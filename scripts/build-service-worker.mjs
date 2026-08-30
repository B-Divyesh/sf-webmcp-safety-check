import { createHash } from 'node:crypto';
import { copyFile, readFile, readdir, writeFile } from 'node:fs/promises';
import { extname, join, relative, resolve, sep } from 'node:path';

const site = resolve('dist/site');
const template = await readFile(resolve('public/sw.js'), 'utf8');
await copyFile(resolve('site/staticwebapp.config.json'), join(site, 'staticwebapp.config.json'));
const cacheableExtensions = new Set(['.css', '.js', '.mjs', '.svg', '.webp', '.png', '.json', '.txt', '.xml', '.ico', '.woff2']);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const location = join(directory, entry.name);
    return entry.isDirectory() ? filesIn(location) : [location];
  }));
  return files.flat();
}

const files = await filesIn(site);
const urls = files
  .filter((file) => file !== join(site, 'sw.js'))
  .map((file) => relative(site, file).split(sep).join('/'))
  // Azure Static Web Apps consumes this deployment configuration rather than
  // serving it. Including it makes cache.addAll reject the offline install.
  .filter((path) => path !== 'staticwebapp.config.json')
  .filter((path) => path === 'index.html' || path === 'privacy/index.html' || path === 'terms/index.html' || cacheableExtensions.has(extname(path)))
  .map((path) => path === 'index.html' ? '/' : path === 'privacy/index.html' ? '/privacy/' : path === 'terms/index.html' ? '/terms/' : `/${path}`)
  .sort();

const cacheContents = await Promise.all(urls.map(async (url) => {
  const path = url === '/' ? join(site, 'index.html') : url === '/privacy/' ? join(site, 'privacy/index.html') : url === '/terms/' ? join(site, 'terms/index.html') : join(site, url.slice(1));
  return readFile(path);
}));
const fingerprint = createHash('sha256').update(template).update(urls.join('\n')).update(Buffer.concat(cacheContents)).digest('hex').slice(0, 16);
const output = template
  .replace('__CACHE_VERSION__', fingerprint)
  .replace('__PRECACHE_URLS__', JSON.stringify(urls));
await writeFile(join(site, 'sw.js'), output, 'utf8');
console.log(`Generated offline shell ${fingerprint} with ${urls.length} files.`);
