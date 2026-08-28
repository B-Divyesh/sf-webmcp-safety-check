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

  it('extracts tools from a JSON-RPC transcript', () => {
    const transcript = [
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      { jsonrpc: '2.0', id: 1, result: { tools: [safeTool] } }
    ];
    const report = analyzeText(JSON.stringify(transcript));
    expect(report.source.kind).toBe('transcript');
    expect(report.source.toolCount).toBe(1);
  });

  it('accepts newline-delimited JSON transcripts', () => {
    const text = `${JSON.stringify({ method: 'tools/list' })}\n${JSON.stringify({ result: { tools: [safeTool] } })}`;
    expect(analyzeText(text).source.kind).toBe('transcript');
  });

  it('requires origins for external navigation', () => {
    const { origins: _origins, ...safetyWithoutOrigins } = safeTool['x-webmcp-safety'];
    const tool = { ...safeTool, 'x-webmcp-safety': { ...safetyWithoutOrigins, effect: 'external-navigation' } };
    const report = analyzeText(JSON.stringify({ tools: [tool] }));
    expect(report.tools[0]?.findings.find((item) => item.code === 'undeclared-origins')?.severity).toBe('blocker');
  });

  it('reports empty and no-tool documents clearly', () => {
    expect(() => analyzeText('')).toThrow(SafetyParseError);
    expect(() => analyzeText('{"hello":"world"}')).toThrow(/no tools/i);
  });
});
