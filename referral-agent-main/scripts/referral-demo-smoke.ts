import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// One short model turn; every other request is deterministic backend work.
const base = process.env.REFERRAL_API_BASE || 'http://127.0.0.1:3020';
const origin = process.env.REFERRAL_LANDING_ORIGIN || 'https://refella.app';
async function call(path: string, body?: unknown, token?: string) {
  const r = await fetch(`${base}/api/referral-demo/${path}`, { method: body === undefined ? 'GET' : 'POST', headers: {
    origin, 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}),
  }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await r.json(); assert.ok(r.ok, `${path}: ${r.status} ${data.error}`); return data;
}
const a = await call('start', { code: process.env.DEMO_ACCESS_CODE, consent: true, alias: 'Alex Demo' });
const ref = new URL(a.invitation.url).searchParams.get('ref'); assert.equal(ref, a.invitation.code);
const info = await call(`invitation?ref=${ref}`); assert.equal(info.inviter, 'Alex Demo');
const joinKey = randomUUID();
const f = await call('join', { code: ref, consent: true, alias: 'Sam Demo', joinKey });
const retry = await call('join', { code: ref, consent: true, alias: 'Sam Demo', joinKey }); assert.equal(retry.token, f.token);
const future = new Date(Date.now() + 7 * 86400_000).toISOString();
const p = await call('messages', { message: `Please prepare a Haircut request for ${future}. This is my desired time, UTC. I understand availability is not confirmed.` }, f.token);
assert.ok(p.proposal?.id, 'Model did not prepare a proposal; no additional paid retry');
const request = await call('confirm', { proposalId: p.proposal.id }, f.token);
const same = await call('confirm', { proposalId: p.proposal.id }, f.token); assert.equal(same.request.id, request.request.id);
const paid = await call('simulate-purchase', { requestId: request.request.id, simulate: true }, a.token); assert.equal(paid.rewardPoints, 100);
const duplicate = await call('simulate-purchase', { requestId: request.request.id, simulate: true }, a.token); assert.equal(duplicate.rewardPoints, 100); assert.equal(duplicate.rewards.length, 1);
const friend = await call('session', undefined, f.token); assert.equal(friend.request.status, 'simulated_paid');
console.log(JSON.stringify({ verified: true, synthetic: true, modelTurns: 1, inviteUrl: a.invitation.url,
  attribution: friend.attribution, requestStatus: friend.request.status, advocatePoints: duplicate.rewardPoints,
  duplicateRewardPrevented: true, duplicateJoinPrevented: true, tokensLogged: false }, null, 2));
