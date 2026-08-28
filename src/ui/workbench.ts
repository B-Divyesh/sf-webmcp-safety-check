import { analyzeText, SafetyParseError } from '../core/analyzer';
import { reportToJson, reportToMarkdown } from '../core/report';
import type { Claim, SafetyReport, ToolAssessment } from '../core/types';

const SAMPLE = `{
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

export function mountWorkbench(root: HTMLElement): void {
  let currentReport: SafetyReport | undefined;
  let lastCleared = '';
  let undoTimer: number | undefined;

  root.innerHTML = `
    <section class="workbench" aria-labelledby="workbench-title">
      <h2 id="workbench-title" class="visually-hidden">Manifest inspection workbench</h2>
      <p class="workbench__heading">Choose a manifest or paste a JSON/JSONL session transcript. The check runs entirely in this browser.</p>
      <div class="offline-note" data-offline hidden><strong>Offline fieldwork.</strong> Analysis and export still work; downloads and documentation links may not.</div>
      <div class="error-note" data-error role="alert" tabindex="-1" hidden></div>
      <div class="source-tabs" role="tablist" aria-label="Input method">
        <button class="source-tab" type="button" role="tab" id="tab-file" aria-controls="panel-file" aria-selected="true" data-tab="file">Choose file</button>
        <button class="source-tab" type="button" role="tab" id="tab-paste" aria-controls="panel-paste" aria-selected="false" tabindex="-1" data-tab="paste">Paste JSON</button>
      </div>
      <div class="source-panel" role="tabpanel" id="panel-file" aria-labelledby="tab-file" data-panel="file">
        <div class="drop-envelope" data-drop>
          <div>
            <strong>Place a specimen here</strong>
            <p>JSON manifests and JSON/JSONL transcripts up to 2 MB. Nothing leaves this device.</p>
            <label class="file-label">Choose a manifest<input class="file-input" data-file type="file" accept=".json,.jsonl,application/json,application/x-ndjson,text/plain"></label>
          </div>
        </div>
      </div>
      <div class="source-panel" role="tabpanel" id="panel-paste" aria-labelledby="tab-paste" data-panel="paste" hidden>
        <label class="paste-label" for="safety-input">Manifest or transcript JSON</label>
        <textarea class="paste-area" id="safety-input" data-input spellcheck="false" autocapitalize="off" placeholder='{ "tools": […] }'></textarea>
        <div class="input-actions">
          <button class="primary-button" type="button" data-analyze>Inspect declarations</button>
          <button class="secondary-button" type="button" data-sample>Load incomplete sample</button>
          <button class="quiet-button" type="button" data-clear>Clear</button>
        </div>
      </div>
      <p class="source-meta" data-meta aria-live="polite">Ready for a local file or pasted document.</p>
      <div class="undo-bar" data-undo hidden><span>Input cleared.</span><button class="secondary-button" type="button" data-undo-button>Undo clear</button></div>
      <div data-output aria-live="polite">
        ${emptyState()}
      </div>
    </section>`;

  const input = required<HTMLTextAreaElement>(root, '[data-input]');
  const file = required<HTMLInputElement>(root, '[data-file]');
  const output = required<HTMLElement>(root, '[data-output]');
  const error = required<HTMLElement>(root, '[data-error]');
  const meta = required<HTMLElement>(root, '[data-meta]');
  const drop = required<HTMLElement>(root, '[data-drop]');
  const undo = required<HTMLElement>(root, '[data-undo]');

  const showError = (message = ''): void => {
    error.textContent = message;
    error.hidden = !message;
    if (message) error.focus();
  };

  const inspect = (text: string, label: string): void => {
    showError();
    if (new Blob([text]).size > 2 * 1024 * 1024) {
      showError('That file is over 2 MB. Export only the tools/list response or split the transcript, then try again.');
      return;
    }
    try {
      currentReport = analyzeText(text);
      output.innerHTML = renderReport(currentReport);
      meta.textContent = `${label} · ${currentReport.source.toolCount} tool${currentReport.source.toolCount === 1 ? '' : 's'} found.`;
      bindReportActions();
      output.querySelector<HTMLElement>('.report__title')?.focus();
    } catch (caught) {
      currentReport = undefined;
      output.innerHTML = emptyState('No review card yet', 'Correct the input above, then inspect it again.');
      showError(caught instanceof SafetyParseError ? caught.message : 'The document could not be inspected. Check that it is valid JSON, then try again.');
    }
  };

  const bindReportActions = (): void => {
    root.querySelector('[data-export-json]')?.addEventListener('click', () => currentReport && download('webmcp-safety-report.json', reportToJson(currentReport), 'application/json'));
    root.querySelector('[data-export-md]')?.addEventListener('click', () => currentReport && download('webmcp-safety-review.md', reportToMarkdown(currentReport), 'text/markdown'));
    root.querySelector('[data-print]')?.addEventListener('click', () => window.print());
  };

  root.querySelector('[data-analyze]')?.addEventListener('click', () => inspect(input.value, 'Pasted document'));
  root.querySelector('[data-sample]')?.addEventListener('click', () => { input.value = SAMPLE; inspect(input.value, 'Incomplete sample'); });
  root.querySelector('[data-clear]')?.addEventListener('click', () => {
    lastCleared = input.value;
    input.value = '';
    currentReport = undefined;
    output.innerHTML = emptyState();
    meta.textContent = 'Input cleared. Nothing is stored.';
    undo.hidden = !lastCleared;
    window.clearTimeout(undoTimer);
    undoTimer = window.setTimeout(() => { undo.hidden = true; lastCleared = ''; }, 5000);
    input.focus();
  });
  root.querySelector('[data-undo-button]')?.addEventListener('click', () => {
    input.value = lastCleared;
    undo.hidden = true;
    lastCleared = '';
    input.focus();
  });

  file.addEventListener('change', async () => {
    const selected = file.files?.[0];
    if (selected) await readFile(selected);
    file.value = '';
  });
  for (const eventName of ['dragenter', 'dragover']) drop.addEventListener(eventName, (event) => { event.preventDefault(); drop.dataset.dragging = 'true'; });
  for (const eventName of ['dragleave', 'drop']) drop.addEventListener(eventName, (event) => { event.preventDefault(); drop.dataset.dragging = 'false'; });
  drop.addEventListener('drop', async (event) => {
    const selected = event.dataTransfer?.files[0];
    if (selected) await readFile(selected);
  });

  async function readFile(selected: File): Promise<void> {
    if (selected.size > 2 * 1024 * 1024) {
      showError('That file is over 2 MB. Export only the tools/list response or split the transcript, then try again.');
      return;
    }
    meta.textContent = `Reading ${selected.name}…`;
    try {
      const text = await selected.text();
      input.value = text;
      inspect(text, selected.name);
    } catch {
      showError(`Could not read ${selected.name}. Choose a local text, JSON, or JSONL file.`);
    }
  }

  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
  const activateTab = (next: HTMLButtonElement): void => {
    tabs.forEach((tab) => {
      const active = tab === next;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = root.querySelector<HTMLElement>(`[data-panel="${tab.dataset.tab}"]`);
      if (panel) panel.hidden = !active;
    });
    next.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      const next = tabs[nextIndex];
      if (next) activateTab(next);
    });
  });

  const updateOnline = (): void => { const note = root.querySelector<HTMLElement>('[data-offline]'); if (note) note.hidden = navigator.onLine; };
  window.addEventListener('online', updateOnline);
  window.addEventListener('offline', updateOnline);
  updateOnline();
}

function emptyState(title = 'No specimens collected', body = 'Choose a manifest, drop a transcript, or load the sample to produce a review card.'): string {
  return `<div class="empty-ledger">
    <svg class="empty-ledger__mark" viewBox="0 0 48 48" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M9 39C21 30 31 19 39 7M14 35C7 28 9 19 18 17c6 8 5 14-4 18Zm11-10c-5-8-1-16 8-17 4 8 1 14-8 17Z"/></svg>
    <h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p>
  </div>`;
}

function renderReport(report: SafetyReport): string {
  const statusLabel = report.summary.status === 'block' ? 'Block exposure' : report.summary.status === 'review' ? 'Review needed' : 'Claims complete';
  return `<article class="report" aria-labelledby="report-title">
    <header class="report__mast">
      <div><p class="report__eyebrow">Review card · ${escapeHtml(report.source.kind)}</p><h2 class="report__title" id="report-title" tabindex="-1" data-status="${report.summary.status}">${statusLabel}</h2></div>
      <div class="coverage"><strong>${report.summary.score}%</strong><span>declaration coverage</span></div>
    </header>
    <ul class="summary-list" aria-label="Report summary">
      <li><strong>${report.source.toolCount}</strong><span>tools</span></li>
      <li><strong>${report.summary.blockers}</strong><span>blockers</span></li>
      <li><strong>${report.summary.warnings}</strong><span>warnings</span></li>
      <li><strong>${report.summary.missingClaims}</strong><span>missing claims</span></li>
    </ul>
    <p class="claim-disclaimer"><strong>Claims, not proof.</strong> ${escapeHtml(report.disclaimer)}</p>
    <ol class="specimen-list">${report.tools.map(renderTool).join('')}</ol>
    <div class="report-actions">
      <button type="button" class="primary-button" data-export-json>Export report JSON</button>
      <button type="button" class="secondary-button" data-export-md>Export review card</button>
      <button type="button" class="quiet-button" data-print>Print card</button>
    </div>
  </article>`;
}

function renderTool(tool: ToolAssessment): string {
  const tags = Object.entries(tool.claims).map(([name, claim]) => renderClaim(name, claim)).join('');
  const findings = tool.findings.map((finding) => `<li class="finding" data-severity="${finding.severity}"><span class="finding__mark" aria-hidden="true">${finding.severity === 'blocker' ? '×' : finding.severity === 'warning' ? '!' : '✓'}</span><strong>${escapeHtml(finding.title)}</strong><p>${escapeHtml(finding.detail)}</p></li>`).join('');
  return `<li class="specimen" data-status="${tool.status}">
    <div><p class="specimen__number">Specimen ${String(tool.index).padStart(2, '0')} · ${tool.status}</p><h3>${escapeHtml(tool.name)}</h3><p class="specimen__description">${escapeHtml(tool.description)}</p><ul class="claim-tags" aria-label="Declared claims">${tags}</ul></div>
    <ul class="finding-list" aria-label="Findings for ${escapeHtml(tool.name)}">${findings}</ul>
  </li>`;
}

function renderClaim(name: string, claim: Claim): string {
  const value = !claim.declared ? 'missing' : Array.isArray(claim.value) ? claim.value.join(', ') : typeof claim.value === 'object' ? 'before + after' : String(claim.value);
  return `<li class="claim-tag" data-missing="${!claim.declared}">${escapeHtml(name)}: ${escapeHtml(value)}</li>`;
}

function download(name: string, contents: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function required<T extends Element>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing workbench element: ${selector}`);
  return element;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}
