# Landing-page implementation

[← Refella](../README.md) · [Architecture](ARCHITECTURE.md) · [Design system](DESIGN.md)

## Source

The [landing-page directory](../landing-page/) contains Refella's Next.js marketing experience, with localized content and animated customer conversations.

## Technologies

| Technology | Version | Role |
| --- | --- | --- |
| Next.js | 16.3.5 | App Router, localized routes, metadata, sitemap, and language redirect |
| React / React DOM | 19.2.8 | Components and interactive presentation |
| TypeScript | ^5 | Component and dictionary types |
| Tailwind CSS | ^4 | Utility styling and shared design tokens |
| ESLint / Next config | ^9 / 16.3.5 | Source linting |

## Local setup

From the repository root, using a Node.js version supported by this Next.js release:

```bash
cd landing-page
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

| Path within `landing-page/` | Responsibility |
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

## Deployment configuration

Set the domain and contact email in `src/lib/site.ts`, and configure `NEXT_PUBLIC_WHATSAPP_NUMBER` for the business contact. Run `npm run build` to create the production build and `npm run start` to serve it.

Keep local environment files, dependencies, and generated build output outside version control.
