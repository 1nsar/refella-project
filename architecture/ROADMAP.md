# Implementation roadmap

[← Back to Refella](../README.md)

## Current state

The repository contains the branded project presentation, product narrative, proposed agent architecture, and this roadmap. The team's landing-page source was reviewed separately: it uses Next.js, React, TypeScript, and Tailwind with English/Russian copy and scripted conversation demos. That source and the agent backend have not yet been imported here.

## First-build checklist

- [ ] Select one business scenario, messaging channel, and conversion goal.
- [ ] Commit the application code with a configuration example containing no secrets.
- [ ] Document prerequisites, installation, local development, and demo steps.
- [ ] Implement enrollment and messaging preferences.
- [ ] Answer questions from a small approved business knowledge source.
- [ ] Generate a personal referral invitation and attribute the friend.
- [ ] Support a booking or purchase flow, clearly labeling any simulation.
- [ ] Verify a qualifying completion event and issue one reward.
- [ ] Show referral status, rewards, and attributed revenue in a business view.
- [ ] Demonstrate staff handoff and promotional opt-out.
- [ ] Add genuine screenshots and a working demo or recorded walkthrough.

## Acceptance criteria for the first demo

| Scenario | Expected result |
| --- | --- |
| Customer shares a personal invitation | The friend is attributed to the correct referrer |
| Friend asks an unknown pricing question | The assistant asks for help instead of inventing a price |
| A booking is requested but not completed | No completion-based reward is issued |
| A qualifying transaction completes | Exactly one reward entry is created |
| The same completion callback is retried | The balance remains unchanged |
| Customer opts out of promotions | Promotional messages stop |
| A user requests another business’s customer data | Access is denied |

## Later expansion

- Additional channel adapters after capability and access validation.
- Real booking, commerce, and payment integrations.
- Loyalty tiers and configurable campaigns.
- Verified staff tipping with payment reconciliation.
- Cross-channel identity linking.
- Refund handling and referral abuse controls.
- Multi-location administration and role-based access.
- Retention cohorts and experiments to measure incremental results.

## Before submitting to judges

- [x] Confirm the repository is publicly accessible.
- [ ] Update the repository status when the frontend and backend source are committed.
- [ ] Put a verified demo link near the top of the README.
- [ ] Identify which features are live, simulated, or planned.
- [ ] Include reproducible setup instructions and safe demo data.
- [x] Add the team's names and responsibilities.
- [ ] Add the hackathon name and actual sponsor integrations.
- [ ] Check the hackathon’s submission and licensing requirements.
