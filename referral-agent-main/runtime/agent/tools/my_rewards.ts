import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { service, customerContext } from '../lib/service';
export default defineTool({ description: 'Read current customer bonus units, not cash.', inputSchema: z.object({}),
  execute: async (_input, ctx) => service().ownRewards(customerContext(ctx.session.auth.current)),
});
