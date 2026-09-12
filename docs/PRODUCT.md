# The Refella experience

[← Back to Refella](../README.md)

> Product specification and illustrative demo script. These flows are planned, not implemented.

## The idea in 30 seconds

Refella helps businesses engage customers, reward repeat business, and convert recommendations into purchases through messaging apps. A customer can ask a question, share feedback, check a reward, or invite a friend within a familiar conversation.

The buyer is the business. The end user is its customer. The product is intended to work across business sizes and sectors, with industry-specific booking, commerce, and payment integrations.

## One connected journey

| Stage | Customer action | Business outcome |
| --- | --- | --- |
| Enroll | Start a chat through a QR code or invitation | Create a business-scoped customer profile and record messaging choices |
| Engage | Ask a question or share feedback | Resolve questions and identify service issues |
| Retain | Check rewards or respond to a relevant offer | Encourage another qualifying visit or purchase |
| Refer | Forward a personal invitation | Introduce a new prospect with referral attribution |
| Convert | Ask questions and book or buy | Turn the introduction into a transaction |
| Reward | Receive credit after verified completion | Recognize the advocate and start the next loyalty cycle |

A name and available channel identifier are the starting point for enrollment. A phone number is not assumed to be available on every platform. Linking identities across channels requires an explicit verification flow.

## Suggested three-minute hackathon walkthrough

Use synthetic customers and clearly mark simulated integrations.

| Time | Show | Explain |
| --- | --- | --- |
| 0:00–0:25 | A customer joins a business through chat | No extra loyalty app to install |
| 0:25–0:55 | Customer asks about rewards and gives private feedback | Engagement and loyalty share one customer relationship |
| 0:55–1:25 | Customer receives and forwards a personal referral invitation | Sharing takes only a short message and a link |
| 1:25–2:05 | Friend asks a question and requests a booking | The assistant helps the recommendation become a decision |
| 2:05–2:35 | A qualifying transaction is verified | Rewards follow completion, not a link click |
| 2:35–3:00 | Dashboard shows the referral and resulting reward | The business can inspect the full journey |

## Example referral offer

“Give a friend 15% off their first visit, and get credit toward your next one.”

The business defines the actual discount, advocate credit, qualifying conditions, expiry, and refund behavior. The assistant explains those configured rules; it does not invent them.

## Business dashboard, proposed

- Customer activity and messaging preferences.
- Feedback requiring a staff response.
- Loyalty balances and a reward transaction history.
- Referred leads and their conversion status.
- Completed referred transactions and attributed revenue.

## Experience boundaries

Private feedback stays distinct from a public review. Public review publication requires a separate customer action. Tipping uses a payment provider and verified staff allocation. Promotions require recorded permission and an easy opt-out. Uncertain answers or unavailable integrations trigger an honest explanation or staff handoff.

## Channel expansion

WhatsApp, Telegram, Instagram, and Apple messaging are intended channel directions. Validate supported APIs, business eligibility, identity access, outbound messaging rules, and payment or booking capabilities before selecting each integration. Ordinary iMessage bot access is not assumed.

## Future industry adaptations

Restaurants could emphasize visits, reservations, and staff appreciation. Retailers could emphasize purchases, sizing, and restocks. Service businesses could emphasize appointments and repeat-service reminders. These are examples of adapting the shared foundation, not separate products.
