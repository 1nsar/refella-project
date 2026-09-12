# Landing-page implementation

[← Refella](../README.md) · [Architecture](ARCHITECTURE.md) · [Design system](DESIGN.md)

## Source reviewed

The team supplied a Next.js marketing-site archive, `startup-refella.zip`, as the design reference for this repository. The source was inspected; it has not been imported into this repository. The instructions below apply to that source, not to a clone of this documentation repository.

## Declared technologies

| Technology | Declared version | Role |
| --- | --- | --- |
| Next.js | 16.3.5 | App Router, localized routes, metadata, sitemap, and language redirect |
| React / React DOM | 19.2.8 | Components and interactive presentation |
| TypeScript | ^5 | Component and dictionary types |
| Tailwind CSS | ^4 | Utility styling and shared design tokens |
| ESLint / Next config | ^9 / 16.3.5 | Source linting |

These versions are read from the supplied package manifest. No installation or production build was performed during the repository presentation update.

## Local setup for the supplied source

In the extracted landing-page source directory, with a Node.js version supported by its Next.js release:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local` to the intended business number in international digits, without spaces or a plus sign. It is a public contact number, not an API credential.

Open `http://localhost:3000`. The source redirects the root path according to the visitor's language; explicit pages are `/en` and `/ru`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Build for production |
| `npm run start` | Serve the production build |

## Source map

| Path in the supplied source | Responsibility |
| --- | --- |
| `src/app/[locale]/` | Landing page, layout, and localized metadata |
| `src/app/globals.css` | Color tokens, typography, cards, chat bubbles, and motion |
| `src/components/hero.tsx` | Sky-gradient hero, floating platform tiles, and phone |
| `src/components/phone-mock.tsx` | Customer lifecycle demonstration |
| `src/components/chat-player.tsx` | Scripted chat sequencing and reduced-motion behavior |
| `src/components/logo.tsx` | Refella wordmark and conversation symbol |
| `src/i18n/dictionaries/` | English and Russian copy |
| `src/lib/site.ts` | Domain, email, and WhatsApp contact configuration |
| `src/proxy.ts` | Language negotiation |
| `public/logos/` | Messaging-platform artwork |

## What the frontend does

The chat player reveals predefined messages with typing states. It starts when a section enters view and respects reduced-motion preferences. The WhatsApp call to action creates a `wa.me` link with a prefilled message.

Those are frontend behaviors. They do not demonstrate model inference, a WhatsApp Business API connection, a live reservation, or a completed payment.

## Before deployment

The supplied `site.ts` contains `refella.com`, `hello@refella.com`, and a fallback WhatsApp number. Confirm the actual domain and contact details before deploying. This repository does not advertise those values as a verified live demo.

The landing-page story also shows a reward after a booking. Align the final demo with the documented business rule: completion-based rewards are issued after a qualifying completed visit or purchase.

When importing the frontend, include its source, lockfile, configuration, and required public assets. Exclude dependencies, build output, local environment files, and machine-specific generated files.
