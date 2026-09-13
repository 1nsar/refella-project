import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createDemoHandler } from '../src/demo/core';
import { runDemo } from '../runtime/agent/lib/demo-model';
import { demoAction, greeting } from '../src/demo/telegram-copy';

// Local polling transport for the isolated demo, never the production database.
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token || !process.env.OPENROUTER_API_KEY) throw new Error('Missing Telegram or model credentials');
const code = randomBytes(24).toString('hex');
const origin = 'http://telegram-demo.local';
const handle = createDemoHandler(runDemo, { ...process.env, DEMO_ENABLED: 'true', DEMO_ACCESS_CODE: code, DEMO_ORIGIN: origin });
const sessions = new Map<number, string>();
const awaitingConfirmation = new Set<number>();
let introVideoId: string | undefined;
const introShown = new Set<number>();
async function sendIntro(chatId: number) {
  if (introShown.has(chatId) || !process.env.TELEGRAM_INTRO_VIDEO_PATH) return;
  const caption = 'Refella — referrals live in chat.\nProduct concept film. This live demo does not confirm real bookings or connect every channel shown.';
  try {
    let result;
    if (introVideoId) result = await telegram('sendVideo', { chat_id: chatId, video: introVideoId, caption });
    else {
      const bytes = await readFile(process.env.TELEGRAM_INTRO_VIDEO_PATH);
      if (bytes.byteLength > 10_000_000) throw new Error('Intro too large');
      const form = new FormData(); form.set('chat_id', String(chatId)); form.set('caption', caption);
      form.set('video', new Blob([bytes], { type: 'video/mp4' }), 'refella-intro.mp4');
      const response = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, { method: 'POST', body: form, signal: AbortSignal.timeout(35_000) });
      const payload = await response.json() as { ok: boolean; result?: { video?: { file_id: string } } };
      if (!payload.ok) throw new Error('Intro upload failed');
      result = payload.result;
    }
    introVideoId = result?.video?.file_id;
    introShown.add(chatId);
    console.log('Intro video delivered');
  } catch { console.error('Intro video unavailable; continuing with text'); }
}
interface Update { update_id: number; message?: { date: number; text?: string; chat: { id: number; type: string }; from?: { is_bot?: boolean } } }
async function telegram(method: string, body: unknown): Promise<any> {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(35_000),
  });
  const result = await response.json() as { ok: boolean; result: unknown; error_code?: number };
  if (!result.ok) throw new Error(`telegram_${result.error_code || response.status}`);
  return result.result;
}
async function reply(chatId: number, text: string) {
  await telegram('sendMessage', { chat_id: chatId, text: text.slice(0, 4000), reply_markup: {
    remove_keyboard: true,
  } });
}
async function api(chatId: number, action: string, body?: unknown) {
  const response = await handle(new Request(`${origin}/api/demo/${action}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { origin, 'content-type': 'application/json', cookie: sessions.get(chatId) || '' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }));
  const cookie = response.headers.get('set-cookie');
  if (cookie) sessions.set(chatId, cookie.split(';')[0]);
  const data = await response.json();
  return { ok: response.ok, data };
}
async function receive(update: Update) {
  const m = update.message;
  if (!m || m.chat.type !== 'private' || m.from?.is_bot || !m.text || m.date < startedAt - 30) return;
  const chatId = m.chat.id;
  if (!sessions.has(chatId) || /^\/start(?:@\w+)?(?:\s|$)/.test(m.text)) {
    if (!sessions.has(chatId)) {
      const start = await api(chatId, 'start', { code });
      if (!start.ok) { await reply(chatId, 'The demo has reached its capacity. Please contact the team.'); return; }
    }
    await sendIntro(chatId);
    await reply(chatId, greeting);
    if (/^\/start/.test(m.text)) return;
  }
  const action = demoAction(m.text, awaitingConfirmation.has(chatId));
  awaitingConfirmation.delete(chatId);
  const result = await api(chatId, action, action === 'state' ? undefined : action === 'message' ? { message: m.text } : {});
  if (!result.ok) {
    const errors: Record<string, string> = {
      demo_expired: 'This demo session expired. Send /start to begin another session.',
      proposal_required: 'First choose a service and a future date, time and timezone so I can prepare a request.',
      request_required: 'Let’s get your request in first. Haircut, or haircut and beard?',
      demo_limit: 'That’s the chat limit for this demo. You can still say “show my request” or “simulate paid visit”.',
      model_unavailable: 'The AI service did not respond. No new request was saved. Please try again.',
      invalid_input: 'Please send a text message of up to 800 characters.',
      future_time_required: 'Please choose a future date and include your timezone.',
    };
    if (result.data.error === 'demo_expired') sessions.delete(chatId);
    await reply(chatId, errors[result.data.error] || 'This demo action could not be completed. Please try again.'); return;
  }
  const state = result.data.state;
  if (action === 'state') {
    await reply(chatId, `Demo status\n\nReferral source: Maya\nRequest: ${state.request?.status || 'not submitted'}\nMaya’s demo points: ${state.rewardUnits}\nMessages remaining: ${result.data.remaining}\n\nNo real money or bookings.`); return;
  }
  let text = result.data.messages.at(-1)?.content || 'Done.';
  if (action === 'confirm') text = 'Your demo request is in. The shop would check the time and get back to you; it isn’t a reserved slot yet.\n\nWant to see Maya’s reward? Say “simulate paid visit” to try that part. No payment needed.';
  if (action === 'purchase') text = 'Test visit marked as paid. Maya now has 100 demo points for sending you our way.\n\nNo money was charged. That’s the referral journey: her recommendation, your visit, her reward.';
  if (state.proposal && !state.request) {
    awaitingConfirmation.add(chatId);
    const iso = state.proposal.preferredTime;
    const when = new Date(iso).toLocaleString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    text += `\n\n${state.proposal.service}\n${when} UTC\n\nShall I send that request? Reply “yes, send it”. This is a demo request, not a reserved slot.`;
  }
  await reply(chatId, text);
  console.log(`Handled ${action}; response delivered`);
}
const startedAt = Math.floor(Date.now() / 1000);
let offset = 0;
async function main() {
  const webhook = await telegram('getWebhookInfo', {});
  if (webhook.url) throw new Error('Existing webhook found; polling not started');
  const me = await telegram('getMe', {});
  console.log(`Ready: @${me.username}; local synthetic demo; no database writes`);
  let failures = 0;
  while (true) {
    try {
      const updates: Update[] = await telegram('getUpdates', { offset, timeout: 25, allowed_updates: ['message'] });
      for (const update of updates) {
        offset = update.update_id + 1;
        try { await receive(update); }
        catch { console.error('Message processing or delivery failed; details suppressed'); }
      }
      failures = 0;
    } catch (error) {
      if (error instanceof Error && /telegram_(401|409)/.test(error.message)) throw error;
      if (++failures >= 5) throw new Error('Repeated polling failure');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}
main().catch(() => { console.error('Telegram demo stopped; check credentials, network or another poller. No secrets logged.'); process.exitCode = 1; });
