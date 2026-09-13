import { defineTool } from 'eve/tools';
import { always } from 'eve/tools/approval';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { service, customerContext } from '../lib/service';
export default defineTool({ description: 'Submit a service REQUEST for staff review, not a confirmed booking.',
  inputSchema: z.object({ service: z.string().min(1).max(500), preferredTime: z.string().datetime({ offset: true }) }),
  approval: always(),
  execute: async (input, ctx) => service().createRequest(customerContext(ctx.session.auth.current), { ...input, requestKey: `agent-${createHash('sha256').update(ctx.session.id + ':' + ctx.callId).digest('hex')}` }),
});
