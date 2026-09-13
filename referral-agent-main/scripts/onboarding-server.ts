import { createServer } from 'node:http';
import { createOnboardingHandler } from '../src/onboarding/core';
import { runOnboarding } from '../runtime/agent/lib/onboarding-model';

// Only onboarding is exposed here. No owner, customer, or framework session routes.
const handle = createOnboardingHandler(runOnboarding);
const server = createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url || '/', 'http://127.0.0.1:3019');
    if (!['/api/onboarding/start', '/api/onboarding/session', '/api/onboarding/messages', '/api/onboarding/confirm'].includes(url.pathname)) {
      outgoing.writeHead(404); outgoing.end(); return;
    }
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of incoming) {
      size += chunk.length;
      if (size > 16_384) { outgoing.writeHead(413); outgoing.end(); return; }
      chunks.push(chunk);
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) if (typeof value === 'string') headers.set(key, value);
    const request = new Request(url, { method: incoming.method, headers,
      body: ['GET','HEAD'].includes(incoming.method || 'GET') ? undefined : Buffer.concat(chunks) });
    const response = await handle(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(await response.text());
  } catch { outgoing.writeHead(500, { 'content-type': 'application/json' }); outgoing.end('{"error":"internal_error"}'); }
});
server.requestTimeout = 30_000;
server.headersTimeout = 10_000;
server.listen(3019, '127.0.0.1', () => console.log('Onboarding API listening on 127.0.0.1:3019; onboarding routes only'));
