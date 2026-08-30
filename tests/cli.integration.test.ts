import { execFile as execFileCallback, spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execFile = promisify(execFileCallback);
const workspace = process.cwd();
let temporaryDirectory = '';
let installedCli = '';

beforeAll(async () => {
  temporaryDirectory = await mkdtemp(join(tmpdir(), 'webmcp-safety-consumer-'));
  await execFile(process.execPath, ['scripts/build-cli.mjs'], { cwd: workspace });
  const { stdout } = await execFile('npm', ['pack', '--pack-destination', temporaryDirectory], { cwd: workspace });
  const tarball = join(temporaryDirectory, stdout.trim().split(/\r?\n/).at(-1)!);
  await writeFile(join(temporaryDirectory, 'package.json'), '{"private":true}\n', 'utf8');
  await execFile('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd: temporaryDirectory });
  installedCli = join(temporaryDirectory, 'node_modules/webmcp-safety-check/dist/cli/webmcp-safety-check.mjs');
}, 60_000);

afterAll(async () => {
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
});

function runWithStdin(command: string, args: string[], input: string): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: temporaryDirectory, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8').on('data', (chunk) => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => resolveRun({ code, stdout, stderr }));
    child.stdin.end(input);
  });
}

describe('packed CLI consumer', () => {
  it('accepts the documented stdin sentinel in a clean npm consumer install', async () => {
    const manifest = await readFile(resolve(workspace, 'public/examples/safe-manifest.json'), 'utf8');
    const result = await runWithStdin(process.execPath, [installedCli, '-', '--strict'], manifest);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Result:** CLEAR');
    expect(result.stderr).toBe('');
    // npm installed the package outside the source tree; this confirms the
    // tarball's declared consumer artifact, rather than a local import.
    expect((await stat(join(temporaryDirectory, 'node_modules/webmcp-safety-check/package.json'))).isFile()).toBe(true);
  }, 60_000);

  it('@claim:cli-policy returns stable policy exit codes and writes automation output', async () => {
    const safe = resolve(workspace, 'public/examples/safe-manifest.json');
    const incomplete = resolve(workspace, 'public/examples/incomplete-manifest.json');
    const output = join(temporaryDirectory, 'report.json');
    const passed = await execFile(process.execPath, [installedCli, safe, '--format', 'json', '--out', output], { cwd: temporaryDirectory });
    expect(passed.stderr).toBe('');
    expect(JSON.parse(await readFile(output, 'utf8'))).toMatchObject({ summary: { status: 'clear' } });

    const safeInput = await readFile(safe, 'utf8');
    const stdin = await runWithStdin(process.execPath, [installedCli, '-', '--strict'], safeInput);
    expect(stdin).toMatchObject({ code: 0, stderr: '' });

    await expect(execFile(process.execPath, [installedCli, incomplete], { cwd: temporaryDirectory })).rejects.toMatchObject({ code: 1 });
    const invalid = await runWithStdin(process.execPath, [installedCli, '-'], '{}');
    expect(invalid.code).toBe(2);
    expect(invalid.stderr).toContain('Input error:');
  });

  it('rejects unknown command-line options', async () => {
    const safe = resolve(workspace, 'public/examples/safe-manifest.json');
    await expect(execFile(process.execPath, [installedCli, safe, '--bogus'], { cwd: temporaryDirectory })).rejects.toMatchObject({
      code: 2,
      stderr: expect.stringContaining('Unknown option: --bogus')
    });
  });

  it('returns a blocking report for malformed declaration values', async () => {
    const malformed = '{"name":"nonsense","description":"tool","inputSchema":{},"x-webmcp-safety":{"effect":"read","approval":null,"evidence":{"before":false,"after":false},"profile":null,"origins":null,"credentials":null}}';
    const result = await runWithStdin(process.execPath, [installedCli, '-', '--format', 'json'], malformed);
    expect(result.code).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      summary: { status: 'block', blockers: 4, score: 33 },
      tools: [{ claims: { evidence: { value: { before: false, after: false } } } }]
    });
  });
});
