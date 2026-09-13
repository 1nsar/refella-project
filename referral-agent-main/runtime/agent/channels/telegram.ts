import { telegramChannel } from 'eve/channels/telegram';
import { z } from 'zod';
import { service } from '../lib/service';
import { safeError } from '../../../src/server/index';
export default telegramChannel({
  botUsername: process.env.TELEGRAM_BOT_USERNAME,
  turnPolicy: 'queue',
  events: {
    // eve 0.54 native callback approvals lose auth. Text replies go through onMessage.
    'input.requested': async (event, channel) => {
      for (const request of event.requests) {
        const input = request.action.input;
        const details = request.action.toolName === 'submit_request'
          ? `Review your request\n\nService: ${String(input.service).slice(0,500)}\nPreferred time: ${String(input.preferredTime).slice(0,80)}\n\nThis is a request, not a confirmed booking.`
          : request.prompt.slice(0,1000);
        await channel.telegram.post(`${details}\n\nReply approve to submit, or cancel to keep it unsent.`);
      }
    },
  },
  onMessage: async (ctx, message) => {
    if (message.chat.type !== 'private' || !message.from || message.from.isBot || !message.text || message.text.length > 4000) return null;
    const businessId = z.string().uuid().parse(process.env.TELEGRAM_BUSINESS_ID);
    const identity = { businessId, channel: 'telegram' as const, externalId: message.from.id, displayName: message.from.firstName };
    const token = /^\/start(?:@\w+)?\s+([a-f0-9]{48})$/.exec(message.text)?.[1];
    if (token) {
      try { await service().claimInvite(identity, { token }); }
      catch (error) { await ctx.telegram.post(`We could not apply this invitation (${safeError(error).body.error}). Please ask the business to check it before continuing.`); return null; }
    }
    return {
      auth: { authenticator: 'referral-telegram', principalType: 'user', principalId: message.from.id, attributes: { businessId } },
      context: [`Current time UTC: ${new Date().toISOString()}. ${token ? 'Referral invitation applied by backend.' : ''}`],
    };
  },
});
