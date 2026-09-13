import { defineChannel, GET, POST } from 'eve/channels';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { handleApi } from '../../../src/http/api';
const headers = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" };
async function asset(name: string, type: string) {
  try { return new Response(await readFile(resolve(process.env.REFERRAL_PUBLIC_DIR || '../public', name), 'utf8'), { headers: { ...headers, 'content-type': type } }); }
  catch { return new Response('Workspace assets unavailable', { status: 503 }); }
}
export default defineChannel({ routes: [
  GET('/app', () => asset('app.html', 'text/html; charset=utf-8')),
  GET('/demo', () => asset('demo.html', 'text/html; charset=utf-8')),
  GET('/assets/demo-script', () => asset('demo.js', 'text/javascript; charset=utf-8')),
  GET('/assets/demo-style', () => asset('demo.css', 'text/css; charset=utf-8')),
  GET('/assets/script', () => asset('app.js', 'text/javascript; charset=utf-8')),
  GET('/assets/style', () => asset('app.css', 'text/css; charset=utf-8')),
  GET('/api/health', handleApi), GET('/api/dashboard', handleApi),
  POST('/api/login', handleApi), POST('/api/confirm', handleApi), POST('/api/cancel', handleApi),
  ...['invite', 'claim', 'request', 'rewards'].map(action => POST(`/api/referrals/${action}`, handleApi)),
] });
