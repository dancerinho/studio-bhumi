import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./dist/', import.meta.url));
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.mp4':'video/mp4' };
const port = Number(process.env.PORT || 3000);
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (!file.startsWith(resolve(root) + sep)) { res.writeHead(403).end('Forbidden'); return; }
    const data = await readFile(file);
    const headers = { 'Content-Type': types[extname(file)] || 'application/octet-stream' };
    if (extname(file) === '.mp4') {
      headers['Accept-Ranges'] = 'bytes';
      const match = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
      if (match) {
        const start = match[1] ? Number(match[1]) : Math.max(0, data.length - Number(match[2]));
        const end = match[2] && match[1] ? Math.min(data.length - 1, Number(match[2])) : data.length - 1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= data.length) {
          res.writeHead(416, { ...headers, 'Content-Range': `bytes */${data.length}` }).end();
          return;
        }
        headers['Content-Range'] = `bytes ${start}-${end}/${data.length}`;
        headers['Content-Length'] = String(end - start + 1);
        res.writeHead(206, headers).end(data.subarray(start, end + 1));
        return;
      }
    }
    headers['Content-Length'] = String(data.length);
    res.writeHead(200, headers).end(data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '0.0.0.0', () => console.log(`Studio Bhumi: http://localhost:${port}`));
