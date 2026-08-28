import type { SafetyReport } from './types';

export function reportToMarkdown(report: SafetyReport): string {
  const lines = [
    '# WebMCP safety review card',
    '',
    `**Result:** ${report.summary.status.toUpperCase()} · **Declaration coverage:** ${report.summary.score}%`,
    `**Inventory:** ${report.source.toolCount} tool${report.source.toolCount === 1 ? '' : 's'} · ${report.summary.blockers} blockers · ${report.summary.warnings} warnings`,
    '',
    '> Declarations are claims, not proof. Verify runtime behavior independently.',
    ''
  ];
  for (const tool of report.tools) {
    lines.push(`## ${tool.index}. ${tool.name} — ${tool.status.toUpperCase()}`, '', tool.description, '');
    for (const finding of tool.findings) lines.push(`- **${finding.severity.toUpperCase()} · ${finding.title}:** ${finding.detail}`);
    lines.push('');
  }
  lines.push(`_Generated ${report.generatedAt}_`, '');
  return lines.join('\n');
}

export function reportToJson(report: SafetyReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}
