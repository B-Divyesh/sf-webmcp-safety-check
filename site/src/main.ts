import '../../src/styles/tokens.css';
import '../../src/styles/workbench.css';
import './site.css';
import { mountWorkbench } from '../../src/ui/workbench';

const workbench = document.querySelector<HTMLElement>('#workbench');
if (!workbench) throw new Error('Inspector root was not found.');
const demo = new URLSearchParams(window.location.search).get('demo') === '1';
mountWorkbench(workbench, { demo });
if (demo) document.title = 'Demo — WebMCP Safety Check';

const copyButton = document.querySelector<HTMLButtonElement>('[data-copy-cli]');
copyButton?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('node webmcp-safety-check.mjs manifest.json --format json --out safety-report.json');
    copyButton.textContent = 'Copied';
    window.setTimeout(() => { copyButton.textContent = 'Copy command'; }, 1800);
  } catch {
    copyButton.textContent = 'Select the command to copy';
  }
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const registerServiceWorker = (): void => { void navigator.serviceWorker.register('/sw.js'); };
  if (document.readyState === 'complete') registerServiceWorker();
  else window.addEventListener('load', registerServiceWorker, { once: true });
}
