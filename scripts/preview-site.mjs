import { createReadStream } from 'node:fs';
import { access, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const root = resolve('dist/site');
const port = Number(process.env.PORT ?? 4173);
const host = process.env.HOST ?? '127.0.0.1';
const types = new Map([
  ['.avif', 'image/avif'], ['.css', 'text/css; charset=utf-8'], ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'], ['.js', 'text/javascript; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'], ['.png', 'image/png'], ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'], ['.webp', 'image/webp'], ['.xml', 'application/xml; charset=utf-8'],
  ['.zip', 'application/zip']
]);
const globalHeaders = {
  'Content-Security-Policy': "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; manifest-src 'self'; object-src 'none'; script-src 'self'; style-src 'self'; worker-src 'self'; upgrade-insecure-requests",
  'Permissions-Policy': 'accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), usb=(), xr-spatial-tracking=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff'
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? `${host}:${port}`}`);
    const pathname = decodeURIComponent(url.pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.endsWith('/') ? `${pathname.slice(1)}index.html` : pathname.slice(1);
    let file = resolve(root, relativePath);
    if (!file.startsWith(`${root}${sep}`) && file !== resolve(root, 'index.html')) throw new Error('Unsafe path');
    let status = 200;
    try {
      await access(file);
      if ((await stat(file)).isDirectory()) throw new Error('Directory');
    } catch {
      status = 404;
      file = resolve(root, '404.html');
    }
    const details = await stat(file);
    const headers = {
      ...globalHeaders,
      'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : pathname === '/sw.js' ? 'no-cache' : 'public, max-age=0, must-revalidate',
      'Content-Length': String(details.size),
      'Content-Type': types.get(extname(file)) ?? 'application/octet-stream'
    };
    if (pathname.startsWith('/downloads/') && status === 200) {
      headers['Cache-Control'] = 'public, max-age=3600';
      headers['Content-Disposition'] = `attachment; filename="${relativePath.split('/').at(-1)}"`;
    }
    response.writeHead(status, headers);
    if (request.method === 'HEAD') response.end();
    else createReadStream(file).pipe(response);
  } catch {
    response.writeHead(400, { ...globalHeaders, 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Bad request');
  }
});

server.listen(port, host, () => console.log(`Previewing dist/site at http://${host}:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
