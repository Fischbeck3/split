// Serves site/ on http://localhost:8000 with no dependencies. Hold mode works here.
// Tilt needs HTTPS on phones, so test tilt on the live site.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL(process.argv.includes('--pages') ? '../.pages/' : '../site/', import.meta.url));
const PORT = Number(process.env.PORT) || 8000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ttf': 'font/ttf', '.ics':'text/calendar; charset=utf-8'
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)){ res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, {'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store'});
    res.end(body);
  } catch {
    res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'}).end('Not found');
  }
}).listen(PORT, () => {
  console.log('Split is pouring at http://localhost:' + PORT);
  console.log('Add #day2 or #day3 to the address to preview a planned day.');
});
