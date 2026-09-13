import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { createReferralDemo } from '../src/referral-demo/core';
import { fileStore } from '../src/referral-demo/store';
import { runReferralDemo } from '../runtime/agent/lib/referral-demo-model';

const handle = createReferralDemo(runReferralDemo, fileStore(resolve(process.env.REFERRAL_DEMO_DATA || 'runtime/.referral-demo/state.json')));
const server = createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url || '/', 'http://localhost');
    if (!url.pathname.startsWith('/api/referral-demo/')) { outgoing.writeHead(404); outgoing.end(); return; }
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of incoming) { size += chunk.length; if (size > 16_384) { outgoing.writeHead(413); outgoing.end(); return; } chunks.push(chunk); }
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) if (typeof value === 'string') headers.set(key, value);
    const req = new Request(url, { method: incoming.method, headers, body: ['GET', 'HEAD'].includes(incoming.method || 'GET') ? undefined : Buffer.concat(chunks) });
    const response = await handle(req);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers)); outgoing.end(await response.text());
  } catch { outgoing.writeHead(500, { 'content-type': 'application/json' }); outgoing.end('{"error":"internal_error"}'); }
});
server.requestTimeout = 20_000; server.headersTimeout = 10_000;
server.listen(3020, '127.0.0.1', () => console.log('Referral demo API ready on 127.0.0.1:3020; persistent local demo only'));
