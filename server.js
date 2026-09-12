const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Allowlist of public production files
const ALLOWED_FILES = new Set([
  'final lodo.html',
  'index.html',
  'config.js'
]);

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  let decodedPath = '';
  try {
    const parsedUrl = new URL(req.url, 'http://localhost');
    decodedPath = decodeURIComponent(parsedUrl.pathname);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  // Block any path containing null bytes, directory traversal patterns, or hidden paths
  if (
    decodedPath.includes('\0') ||
    decodedPath.includes('..') ||
    decodedPath.includes('/.') ||
    decodedPath.includes('\\.')
  ) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  // Normalize route: '/' maps to 'final lodo.html'
  let relativePath = decodedPath === '/' ? 'final lodo.html' : decodedPath.replace(/^\/+/, '');
  const baseName = path.basename(relativePath).toLowerCase();

  // Strict allowlist: only explicitly allowed files
  if (!ALLOWED_FILES.has(baseName)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  // Safe path verification
  const safePath = path.resolve(ROOT_DIR, relativePath);
  if (path.dirname(safePath) !== ROOT_DIR) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'Content-Length': stats.size
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(safePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
      }
      res.end('Server Error');
    });
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Ludo server running at http://localhost:${PORT}/`);
});
