import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { service, customerContext } from '../lib/service';
export default defineTool({ description: 'Create an invitation for the current customer to share themselves.', inputSchema: z.object({}),
  execute: async (_input, ctx) => {
    const username = z.string().regex(/^[a-zA-Z0-9_]{5,32}$/).parse(process.env.TELEGRAM_BOT_USERNAME);
    const invite = await service().createInvite(customerContext(ctx.session.auth.current));
    return { terms: invite.terms, reward_units: invite.reward_units, link: `https://t.me/${username}?start=${invite.token}` };
  },
});
