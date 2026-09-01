#!/usr/bin/env node
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';
import { analyzeText, SafetyParseError } from './core/analyzer';
import { reportToJson, reportToMarkdown } from './core/report';
import { DEFAULT_POLICY, type ClaimName, type Policy } from './core/types';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(`WebMCP Safety Check 1.0.1\n\nUsage: webmcp-safety-check <file|-> [--format json|markdown] [--out path] [--policy path] [--strict]\n       webmcp-safety-check --demo [--format json|markdown]\n\n--demo writes a bundled sample and its review to a new temporary directory.\nExit 0: policy passes · Exit 1: findings meet failure threshold · Exit 2: input/config error\n`);
  process.exit(0);
}
if (args.includes('--version') || args.includes('-v')) {
  process.stdout.write('1.0.1\n');
  process.exit(0);
}

function option(name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

const DEMO_SAMPLE = `{
  "tools": [
    {
      "name": "place_order",
      "description": "Submit the basket and place an order.",
      "inputSchema": { "type": "object" }
    },
    {
      "name": "search_catalog",
      "description": "Search public products.",
      "annotations": { "readOnlyHint": true },
      "x-webmcp-safety": {
        "approval": "none",
        "evidence": { "before": false, "after": true },
        "profile": "fresh",
        "origins": ["https://catalog.example"],
        "credentials": "none"
      }
    }
  ]
}`;

async function run(): Promise<void> {
  validateArguments(args);
  const demo = args.includes('--demo');
  const positional = inputArgument(args);
  if (!demo && !positional) throw new Error('Provide a manifest/transcript path, or - to read stdin. Run with --help for usage.');
  const format = option('--format') ?? 'markdown';
  if (!['json', 'markdown'].includes(format)) throw new Error('--format must be json or markdown.');
  const input = demo ? DEMO_SAMPLE : positional === '-' ? await readStdin() : await readFile(resolve(positional!), 'utf8');
  const policy = await loadPolicy(option('--policy'));
  if (args.includes('--strict')) policy.failOn = 'warning';
  const report = analyzeText(input, policy);
  const output = format === 'json' ? reportToJson(report) : reportToMarkdown(report);
  const outputPath = option('--out');
  if (demo) {
    const directory = await mkdtemp(join(tmpdir(), 'webmcp-safety-demo-'));
    const manifestPath = join(directory, 'sample-manifest.json');
    const reportPath = join(directory, `sample-review.${format === 'json' ? 'json' : 'md'}`);
    await Promise.all([writeFile(manifestPath, DEMO_SAMPLE, 'utf8'), writeFile(reportPath, output, 'utf8')]);
    process.stdout.write(`Demo sample and review written to ${directory}\nReview: ${reportPath}\n`);
  } else if (outputPath) await writeFile(resolve(outputPath), output, 'utf8');
  else process.stdout.write(output);
  const failed = report.summary.blockers > 0 || (policy.failOn === 'warning' && report.summary.warnings > 0);
  process.exitCode = failed ? 1 : 0;
}

function validateArguments(argv: string[]): void {
  const flags = new Set(['--strict', '--demo']);
  const optionsWithValues = new Set(['--format', '--out', '--policy']);
  let positionalCount = 0;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (optionsWithValues.has(argument)) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`${argument} requires a value.`);
      index += 1;
      continue;
    }
    if (flags.has(argument)) continue;
    if (argument.startsWith('-') && argument !== '-') throw new Error(`Unknown option: ${argument}. Run with --help for usage.`);
    positionalCount += 1;
  }
  if (positionalCount > 1) throw new Error('Provide exactly one manifest/transcript path, or - to read stdin.');
  if (argv.includes('--demo') && positionalCount > 0) throw new Error('--demo does not accept a manifest/transcript path.');
}

/**
 * Return the one input argument while leaving option values out of the search.
 * `-` is deliberately an input value: it is the documented stdin sentinel,
 * not a short option.
 */
function inputArgument(argv: string[]): string | undefined {
  const optionsWithValues = new Set(['--format', '--out', '--policy']);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (optionsWithValues.has(argument)) {
      index += 1;
      continue;
    }
    if (argument === '-') return argument;
    if (argument === '--demo') continue;
    if (!argument.startsWith('-')) return argument;
  }
  return undefined;
}

async function loadPolicy(path?: string): Promise<Policy> {
  const candidate = path ? resolve(path) : resolve('.webmcp-safety.json');
  let raw: string;
  try {
    raw = await readFile(candidate, 'utf8');
  } catch (error) {
    if (!path && isMissing(error)) return { ...DEFAULT_POLICY, requiredClaims: [...DEFAULT_POLICY.requiredClaims] };
    throw new Error(`Could not read policy at ${candidate}.`);
  }
  const parsed = JSON.parse(raw) as Partial<Policy>;
  const allowed: ClaimName[] = ['effect', 'approval', 'evidence', 'profile', 'origins', 'credentials'];
  if (parsed.requiredClaims && (!Array.isArray(parsed.requiredClaims) || parsed.requiredClaims.some((item) => !allowed.includes(item)))) {
    throw new Error(`Policy requiredClaims must use: ${allowed.join(', ')}.`);
  }
  if (parsed.failOn && !['blocker', 'warning'].includes(parsed.failOn)) throw new Error('Policy failOn must be blocker or warning.');
  return { requiredClaims: parsed.requiredClaims ?? [...DEFAULT_POLICY.requiredClaims], failOn: parsed.failOn ?? DEFAULT_POLICY.failOn };
}

function readStdin(): Promise<string> {
  return new Promise((resolveInput, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolveInput(data));
    process.stdin.on('error', reject);
  });
}

function isMissing(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT';
}

run().catch((error: unknown) => {
  const prefix = error instanceof SafetyParseError ? 'Input error' : 'Error';
  process.stderr.write(`${prefix}: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
});
