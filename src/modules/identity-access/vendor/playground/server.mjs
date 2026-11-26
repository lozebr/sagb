import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const moduleRoot = new URL('../', import.meta.url).pathname;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

createServer(async (req, res) => {
  try {
    const raw = req.url === '/' ? '/index.html' : req.url ?? '/index.html';
    const isDist = raw.startsWith('/dist/');
    const base = isDist ? moduleRoot : root;
    const relative = normalize(raw).replace(/^\/+/, '');
    if (relative.includes('..')) throw new Error('invalid path');
    const body = await readFile(join(base, relative));
    res.writeHead(200, { 'content-type': mime[extname(relative)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(4174, () => console.log('Identity & Access playground: http://localhost:4174'));
