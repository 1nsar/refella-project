import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { service, customerContext } from '../lib/service';
export default defineTool({ description: 'Read approved offer rules for this customer.', inputSchema: z.object({}),
  execute: async (_input, ctx) => service().getCustomerOffer(customerContext(ctx.session.auth.current)),
});
