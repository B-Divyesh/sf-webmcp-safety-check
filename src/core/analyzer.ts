import { DEFAULT_POLICY, type Claim, type ClaimName, type Effect, type Finding, type Policy, type SafetyReport, type ToolAssessment, type ToolClaims } from './types';

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord => value !== null && typeof value === 'object' && !Array.isArray(value);
const hasOwn = (value: JsonRecord, key: string) => Object.prototype.hasOwnProperty.call(value, key);

export class SafetyParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SafetyParseError';
  }
}

export function parseInput(text: string): { tools: JsonRecord[]; kind: 'manifest' | 'transcript' } {
  const trimmed = text.trim();
  if (!trimmed) throw new SafetyParseError('Nothing to inspect. Paste JSON or choose a manifest or transcript file.');

  let value: unknown;
  try {
    value = JSON.parse(trimmed);
  } catch (jsonError) {
    const lines = trimmed.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      throw new SafetyParseError(`This is not valid JSON: ${errorMessage(jsonError)}`);
    }
    try {
      value = lines.map((line) => JSON.parse(line));
    } catch (jsonlError) {
      throw new SafetyParseError(`This is not valid JSON or JSONL: ${errorMessage(jsonlError)}`);
    }
  }

  const tools: JsonRecord[] = [];
  let transcript = false;
  const visited = new WeakSet<object>();

  const walk = (node: unknown, context = ''): void => {
    if (Array.isArray(node)) {
      if (context === 'tools') {
        node.forEach((item) => { if (isRecord(item)) tools.push(item); });
        return;
      }
      transcript = true;
      node.forEach((item) => walk(item, 'event'));
      return;
    }
    if (!isRecord(node) || visited.has(node)) return;
    visited.add(node);
    if (typeof node.jsonrpc === 'string' || typeof node.method === 'string') transcript = true;

    if (Array.isArray(node.tools)) walk(node.tools, 'tools');
    if (isRecord(node.result)) walk(node.result, 'result');
    if (isRecord(node.params)) walk(node.params, 'params');
    if (isRecord(node.capabilities)) walk(node.capabilities, 'capabilities');
    if (Array.isArray(node.events)) walk(node.events, 'events');
  };

  walk(value);
  if (tools.length === 0 && isRecord(value) && typeof value.name === 'string' && (hasOwn(value, 'inputSchema') || hasOwn(value, 'description'))) {
    tools.push(value);
  }
  if (tools.length === 0) throw new SafetyParseError('Valid JSON was found, but no tools were present. Expected a tools array or a tools/list transcript result.');
  return { tools, kind: transcript ? 'transcript' : 'manifest' };
}

export function analyzeText(text: string, policy: Partial<Policy> = {}): SafetyReport {
  const parsed = parseInput(text);
  const mergedPolicy: Policy = {
    requiredClaims: policy.requiredClaims ?? DEFAULT_POLICY.requiredClaims,
    failOn: policy.failOn ?? DEFAULT_POLICY.failOn
  };
  const tools = parsed.tools.map((tool, index) => assessTool(tool, index, mergedPolicy));
  const findings = tools.flatMap((tool) => tool.findings);
  const blockers = findings.filter((item) => item.severity === 'blocker').length;
  const warnings = findings.filter((item) => item.severity === 'warning').length;
  const notes = findings.filter((item) => item.severity === 'note').length;
  const totalClaims = tools.length * 6;
  const declaredClaims = tools.reduce((sum, tool) => sum + Object.values(tool.claims).filter((claim) => claim.declared).length, 0);

  return {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    source: { kind: parsed.kind, toolCount: tools.length },
    summary: {
      status: blockers ? 'block' : warnings ? 'review' : 'clear',
      score: Math.round((declaredClaims / totalClaims) * 100),
      blockers,
      warnings,
      notes,
      missingClaims: totalClaims - declaredClaims
    },
    tools,
    disclaimer: 'This report checks declarations as claims. It does not verify server behavior or vendor trustworthiness.'
  };
}

function assessTool(tool: JsonRecord, index: number, policy: Policy): ToolAssessment {
  const name = stringValue(tool.name) ?? `unnamed-tool-${index + 1}`;
  const description = stringValue(tool.description) ?? 'No description declared.';
  const annotations = isRecord(tool.annotations) ? tool.annotations : {};
  const safety = mergeSafety(tool);
  const claims: ToolClaims = {
    effect: effectClaim(safety, annotations),
    approval: approvalClaim(safety),
    evidence: evidenceClaim(safety),
    profile: stringClaim(safety, ['profile', 'browserProfile', 'profileMode']),
    origins: originsClaim(safety),
    credentials: stringClaim(safety, ['credentials', 'credentialScope', 'credentialMode'])
  };
  const inferredSignals = inferSignals(`${name} ${description}`);
  const findings: Finding[] = [];

  for (const claimName of policy.requiredClaims) {
    if (!claims[claimName].declared) findings.push(missingFinding(claimName));
  }

  for (const claimName of ['profile', 'origins', 'credentials'] as ClaimName[]) {
    if (!policy.requiredClaims.includes(claimName) && !claims[claimName].declared) {
      findings.push({
        code: `undeclared-${claimName}`,
        severity: 'warning',
        title: `${claimLabel(claimName)} is not declared`,
        detail: optionalDetail(claimName),
        claim: claimName
      });
    }
  }

  if (claims.effect.declared && claims.effect.value === 'unknown') {
    findings.push({ code: 'invalid-effect', severity: 'blocker', title: 'Effect declaration is not recognized', detail: 'Use read, mutate, external-navigation, or mixed.', claim: 'effect' });
  }
  if (claims.evidence.declared && claims.evidence.value && (!claims.evidence.value.before || !claims.evidence.value.after)) {
    findings.push({
      code: 'incomplete-evidence',
      severity: claims.effect.value === 'read' ? 'warning' : 'blocker',
      title: 'Before/after evidence is incomplete',
      detail: 'Declare both before and after evidence explicitly. A false value is allowed, but omission is not.',
      claim: 'evidence'
    });
  }
  if ((claims.effect.value === 'external-navigation' || claims.effect.value === 'mixed') && !claims.origins.declared) {
    promote(findings, 'undeclared-origins', 'blocker');
  }
  if (claims.profile.value === 'real' && !claims.credentials.declared) {
    promote(findings, 'undeclared-credentials', 'blocker');
  }
  if (inferredSignals.length && !claims.effect.declared) {
    findings.push({
      code: 'description-risk-signal',
      severity: 'note',
      title: 'Description suggests stateful behavior',
      detail: `Matched: ${inferredSignals.join(', ')}. This hint does not replace a declaration.`,
      claim: 'effect'
    });
  }
  if (findings.length === 0) findings.push({ code: 'claims-present', severity: 'note', title: 'All reviewed claims are present', detail: 'Presence is not proof; verify behavior independently.', claim: 'effect' });

  const hasBlocker = findings.some((finding) => finding.severity === 'blocker');
  const hasWarning = findings.some((finding) => finding.severity === 'warning');
  return { index: index + 1, name, description, claims, findings, inferredSignals, status: hasBlocker ? 'block' : hasWarning ? 'review' : 'clear' };
}

function mergeSafety(tool: JsonRecord): JsonRecord {
  const candidates = [
    tool.safety,
    tool['x-webmcp-safety'],
    isRecord(tool.metadata) ? tool.metadata.safety : undefined,
    isRecord(tool._meta) ? tool._meta.safety : undefined,
    isRecord(tool.annotations) ? tool.annotations.safety : undefined
  ];
  return Object.assign({}, ...candidates.filter(isRecord));
}

function effectClaim(safety: JsonRecord, annotations: JsonRecord): Claim<Effect> {
  for (const key of ['effect', 'operation', 'operationType']) {
    if (hasOwn(safety, key)) return { declared: true, value: normalizeEffect(safety[key]), source: `safety.${key}` };
  }
  if (hasOwn(safety, 'mutatesState')) {
    return { declared: true, value: safety.mutatesState === false ? 'read' : safety.mutatesState === true ? 'mutate' : 'unknown', source: 'safety.mutatesState' };
  }
  if (safety.externalNavigation === true) {
    return { declared: true, value: 'external-navigation', source: 'safety.externalNavigation' };
  }
  if (hasOwn(annotations, 'readOnlyHint')) {
    return { declared: true, value: annotations.readOnlyHint === true ? 'read' : annotations.readOnlyHint === false ? 'mutate' : 'unknown', source: 'annotations.readOnlyHint' };
  }
  if (annotations.destructiveHint === true) {
    return { declared: true, value: 'mutate', source: 'annotations.destructiveHint' };
  }
  return { declared: false };
}

function approvalClaim(safety: JsonRecord): Claim<string> {
  for (const key of ['approval', 'humanApproval', 'approvalMode']) {
    if (hasOwn(safety, key)) {
      const value = safety[key];
      return { declared: true, value: typeof value === 'boolean' ? (value ? 'required' : 'none') : String(value), source: `safety.${key}` };
    }
  }
  return { declared: false };
}

function evidenceClaim(safety: JsonRecord): Claim<{ before: boolean; after: boolean }> {
  if (hasOwn(safety, 'evidence')) {
    const evidence = safety.evidence;
    if (isRecord(evidence)) {
      return {
        declared: hasOwn(evidence, 'before') && hasOwn(evidence, 'after'),
        value: { before: hasOwn(evidence, 'before'), after: hasOwn(evidence, 'after') },
        source: 'safety.evidence'
      };
    }
    if (typeof evidence === 'string') {
      const normalized = evidence.toLowerCase();
      return { declared: true, value: { before: normalized.includes('before') || normalized === 'none', after: normalized.includes('after') || normalized === 'none' }, source: 'safety.evidence' };
    }
  }
  const before = hasOwn(safety, 'beforeEvidence');
  const after = hasOwn(safety, 'afterEvidence');
  if (before || after) return { declared: before && after, value: { before, after }, source: 'safety.beforeEvidence/afterEvidence' };
  return { declared: false };
}

function stringClaim(safety: JsonRecord, keys: string[]): Claim<string> {
  for (const key of keys) {
    if (hasOwn(safety, key)) return { declared: true, value: String(safety[key]), source: `safety.${key}` };
  }
  return { declared: false };
}

function originsClaim(safety: JsonRecord): Claim<string[]> {
  for (const key of ['origins', 'originScope', 'allowedOrigins']) {
    if (hasOwn(safety, key)) {
      const raw = safety[key];
      const value = Array.isArray(raw) ? raw.map(String) : [String(raw)];
      return { declared: true, value, source: `safety.${key}` };
    }
  }
  return { declared: false };
}

function normalizeEffect(value: unknown): Effect {
  const normalized = String(value).toLowerCase().replace(/[ _]/g, '-');
  if (['read', 'read-only', 'readonly', 'observe'].includes(normalized)) return 'read';
  if (['mutate', 'mutation', 'write', 'state-change'].includes(normalized)) return 'mutate';
  if (['external-navigation', 'navigate', 'navigation', 'open-world'].includes(normalized)) return 'external-navigation';
  if (['mixed', 'read-write'].includes(normalized)) return 'mixed';
  return 'unknown';
}

function inferSignals(text: string): string[] {
  const words = ['create', 'update', 'delete', 'submit', 'send', 'purchase', 'book', 'navigate', 'login', 'upload', 'write', 'change'];
  const lower = text.toLowerCase();
  return words.filter((word) => new RegExp(`\\b${word}(?:s|d|ing)?\\b`, 'i').test(lower));
}

function missingFinding(claim: ClaimName): Finding {
  return {
    code: `missing-${claim}`,
    severity: 'blocker',
    title: `${claimLabel(claim)} declaration is missing`,
    detail: requiredDetail(claim),
    claim
  };
}

function claimLabel(claim: ClaimName): string {
  return ({ effect: 'Read/mutate effect', approval: 'Human approval', evidence: 'Before/after evidence', profile: 'Browser profile', origins: 'Origin scope', credentials: 'Credential scope' })[claim];
}

function requiredDetail(claim: ClaimName): string {
  return ({
    effect: 'Declare whether this tool reads, mutates, mixes both, or navigates externally.',
    approval: 'Declare the approval mode, including none when no approval is expected.',
    evidence: 'Declare both before and after evidence behavior, including false when unavailable.',
    profile: 'Declare whether the tool uses a fresh, real, or selectable browser profile.',
    origins: 'Declare which origins the tool may reach.',
    credentials: 'Declare whether and how credentials may be used.'
  })[claim];
}

function optionalDetail(claim: ClaimName): string {
  return `${requiredDetail(claim)} Add it to x-webmcp-safety (or metadata.safety).`;
}

function promote(findings: Finding[], code: string, severity: Finding['severity']): void {
  const finding = findings.find((item) => item.code === code);
  if (finding) finding.severity = severity;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown parse error';
}
