# Referral runtime

Start from the repository root using `npm run dev`. Read [RUNBOOK](../docs/RUNBOOK.md) first. Generic agent session routes are deliberately denied; this is not a public web chat. No deployment is authorized by these instructions.

This is an eve agent. Configure `runtime/.env.local` using `runtime/.env.example`. Install dependencies with `npm ci` from the repository root; the root workspace lockfile is canonical.

## Getting started

First, run the development server:

```bash
eve dev
```

The owner dashboard is at `/app`. The root development command runs without the TUI.

Start by editing `agent/instructions.md` to define the agent's identity, purpose, tone, and response guidelines. Configure its model and runtime behavior in `agent/agent.ts`.

Add capabilities under `agent/`, including tools, connections, channels, skills, subagents, and schedules. eve reloads your changes as you work.

## Learn more

To learn more about eve, explore these resources:

- [eve documentation](https://eve.dev/docs) — learn about eve's features and authoring APIs.
- [Build an Agent tutorial](https://eve.dev/docs/tutorial/first-agent) — build and deploy an agent step by step.
- [eve on GitHub](https://github.com/vercel/eve) — view the source and contribute.

## Deployment status

No deployment or Telegram webhook registration has been performed. These are separate steps after credentials and live verification are available. See RUNBOOK for the remaining gates.
