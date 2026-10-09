import { createServer } from 'node:http';
// Public metadata only. Never read a request body or expose a chat endpoint.
createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200); res.end(JSON.stringify({ status: 'ok', app: 'catchup-local', version: '0.1.0', chatProcessing: 'device-only' }));
  } else { res.writeHead(404); res.end(JSON.stringify({ error: 'Not found' })); }
}).listen(Number(process.env.PORT || 3001), '0.0.0.0');
