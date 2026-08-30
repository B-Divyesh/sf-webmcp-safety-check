import { describe, expect, it } from 'vitest';
import { analyzeText, SafetyParseError } from '../src/core/analyzer';

const safeTool = {
  name: 'search_catalog',
  description: 'Find public products.',
  annotations: { readOnlyHint: true },
  'x-webmcp-safety': {
    approval: 'none',
    evidence: { before: false, after: true },
    profile: 'fresh',
    origins: ['https://shop.example'],
    credentials: 'none'
  }
};

describe('analyzeText', () => {
  it('accepts a completely declared manifest', () => {
    const report = analyzeText(JSON.stringify({ tools: [safeTool] }));
    expect(report.summary.status).toBe('clear');
    expect(report.summary.score).toBe(100);
    expect(report.summary.blockers).toBe(0);
  });

  it('identifies every omitted required safety declaration', () => {
    const report = analyzeText(JSON.stringify({ tools: [{ name: 'place_order', description: 'Purchase and submit an order.' }] }));
    expect(report.tools[0]?.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining([
      'missing-effect', 'missing-approval', 'missing-evidence'
    ]));
    expect(report.summary.status).toBe('block');
  });

  it('@claim:input-formats accepts manifests, JSON-RPC responses, transcript arrays, JSONL, and single tools', () => {
    const transcript = [
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      { jsonrpc: '2.0', id: 1, result: { tools: [safeTool] } }
    ];
    const cases = [
      { text: JSON.stringify({ tools: [safeTool] }), kind: 'manifest' },
      { text: JSON.stringify({ jsonrpc: '2.0', result: { tools: [safeTool] } }), kind: 'transcript' },
      { text: JSON.stringify(transcript), kind: 'transcript' },
      { text: `${JSON.stringify({ method: 'tools/list' })}\n${JSON.stringify({ result: { tools: [safeTool] } })}`, kind: 'transcript' },
      { text: JSON.stringify(safeTool), kind: 'manifest' }
    ] as const;
    for (const example of cases) {
      const report = analyzeText(example.text);
      expect(report.source).toEqual({ kind: example.kind, toolCount: 1 });
    }
  });

  it('@claim:classification-policy blocks unscoped navigation and real-profile credential gaps', () => {
    const { origins: _origins, ...safetyWithoutOrigins } = safeTool['x-webmcp-safety'];
    const tool = { ...safeTool, 'x-webmcp-safety': { ...safetyWithoutOrigins, effect: 'external-navigation' } };
    const report = analyzeText(JSON.stringify({ tools: [tool] }));
    expect(report.tools[0]?.findings.find((item) => item.code === 'undeclared-origins')?.severity).toBe('blocker');

    const { credentials: _credentials, ...safetyWithoutCredentials } = safeTool['x-webmcp-safety'];
    const profileReport = analyzeText(JSON.stringify({ tools: [{ ...safeTool, 'x-webmcp-safety': { ...safetyWithoutCredentials, profile: 'real' } }] }));
    expect(profileReport.tools[0]?.findings.find((item) => item.code === 'undeclared-credentials')?.severity).toBe('blocker');
  });

  it('@claim:declaration-validation preserves booleans and blocks malformed safety values', () => {
    const safeReport = analyzeText(JSON.stringify({ tools: [safeTool] }));
    expect(safeReport.tools[0]?.claims.evidence.value).toEqual({ before: false, after: true });
    expect(safeReport.summary.status).toBe('clear');

    const malformed = {
      name: 'nonsense',
      description: 'tool',
      inputSchema: {},
      'x-webmcp-safety': {
        effect: 'read', approval: null, evidence: { before: false, after: false }, profile: null, origins: null, credentials: null
      }
    };
    const report = analyzeText(JSON.stringify(malformed));
    expect(report.summary.status).toBe('block');
    expect(report.summary.score).toBe(33);
    expect(report.tools[0]?.claims.evidence.value).toEqual({ before: false, after: false });
    expect(report.tools[0]?.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining([
      'invalid-approval', 'invalid-profile', 'invalid-origins', 'invalid-credentials'
    ]));
    expect(report.tools[0]?.findings.some((finding) => finding.code === 'claims-present')).toBe(false);

    const invalidKinds = analyzeText(JSON.stringify({ tools: [{ ...safeTool, annotations: {}, 'x-webmcp-safety': { ...safeTool['x-webmcp-safety'], effect: 'erase', evidence: { before: true, after: 'yes' }, credentials: 'global' } }] }));
    expect(invalidKinds.tools[0]?.findings.map((finding) => finding.code)).toEqual(expect.arrayContaining(['invalid-effect', 'invalid-evidence', 'invalid-credentials']));
  });

  it('@claim:unknown-fields ignores unknown future keys without changing valid claims', () => {
    const extended = structuredClone(safeTool) as typeof safeTool & { 'x-webmcp-safety': typeof safeTool['x-webmcp-safety'] & { futureReviewMode: string } };
    extended['x-webmcp-safety'].futureReviewMode = 'future-value';
    const report = analyzeText(JSON.stringify({ tools: [extended] }));
    expect(report.summary).toMatchObject({ status: 'clear', score: 100, blockers: 0, warnings: 0 });
    expect(report.tools[0]?.claims.evidence.value).toEqual({ before: false, after: true });
  });

  it('@claim:claim-inventory records all six documented safety properties', () => {
    const claims = analyzeText(JSON.stringify({ tools: [safeTool] })).tools[0]?.claims;
    expect(claims).toMatchObject({
      effect: { declared: true, value: 'read' }, approval: { declared: true, value: 'none' },
      evidence: { declared: true, value: { before: false, after: true } }, profile: { declared: true, value: 'fresh' },
      origins: { declared: true, value: ['https://shop.example'] }, credentials: { declared: true, value: 'none' }
    });
  });

  it('@claim:declaration-sources recognizes each documented safety declaration location and MCP effect hint', () => {
    const declaration = safeTool['x-webmcp-safety'];
    for (const tool of [
      { ...safeTool, 'x-webmcp-safety': undefined, safety: { ...declaration, effect: 'read' } },
      { ...safeTool, 'x-webmcp-safety': undefined, metadata: { safety: { ...declaration, effect: 'read' } } },
      { ...safeTool, 'x-webmcp-safety': undefined, _meta: { safety: { ...declaration, effect: 'read' } } },
      { ...safeTool, 'x-webmcp-safety': undefined, annotations: { safety: { ...declaration, effect: 'read' } } },
      { ...safeTool, 'x-webmcp-safety': declaration, annotations: { destructiveHint: true } }
    ]) expect(analyzeText(JSON.stringify(tool)).summary.status).toBe('clear');
  });

  it('reports empty and no-tool documents clearly', () => {
    expect(() => analyzeText('')).toThrow(SafetyParseError);
    expect(() => analyzeText('{"hello":"world"}')).toThrow(/no tools/i);
  });
});
