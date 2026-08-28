#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { analyzeText, SafetyParseError } from './core/analyzer';
import { reportToJson, reportToMarkdown } from './core/report';
import { DEFAULT_POLICY, type ClaimName, type Policy } from './core/types';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(`WebMCP Safety Check 1.0.0\n\nUsage: webmcp-safety-check <file|-> [--format json|markdown] [--out path] [--policy path] [--strict]\n\nExit 0: policy passes · Exit 1: findings meet failure threshold · Exit 2: input/config error\n`);
  process.exit(0);
}
if (args.includes('--version') || args.includes('-v')) {
  process.stdout.write('1.0.0\n');
  process.exit(0);
}

function option(name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

async function run(): Promise<void> {
  const positional = inputArgument(args);
  if (!positional) throw new Error('Provide a manifest/transcript path, or - to read stdin. Run with --help for usage.');
  const format = option('--format') ?? 'markdown';
  if (!['json', 'markdown'].includes(format)) throw new Error('--format must be json or markdown.');
  const input = positional === '-' ? await readStdin() : await readFile(resolve(positional), 'utf8');
  const policy = await loadPolicy(option('--policy'));
  if (args.includes('--strict')) policy.failOn = 'warning';
  const report = analyzeText(input, policy);
  const output = format === 'json' ? reportToJson(report) : reportToMarkdown(report);
  const outputPath = option('--out');
  if (outputPath) await writeFile(resolve(outputPath), output, 'utf8');
  else process.stdout.write(output);
  const failed = report.summary.blockers > 0 || (policy.failOn === 'warning' && report.summary.warnings > 0);
  process.exitCode = failed ? 1 : 0;
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
