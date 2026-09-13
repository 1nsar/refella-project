# Refella — landing page

Marketing site for Refella, an AI loyalty and referral manager that runs inside
messaging apps (WhatsApp, iMessage, Telegram, Instagram).

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4.

## Getting started

```bash
npm install
cp .env.example .env.local   # set your WhatsApp number
npm run dev                  # http://localhost:3000
```

`/` redirects to a locale based on the visitor's `Accept-Language` header.

## Configuration

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Business number in E.164 digits, no `+` or spaces (e.g. `77001234567`). Every "Try it on WhatsApp" button opens `wa.me/<number>` with a prefilled message. |

Other shared values (domain, contact email, product name) live in
[`src/lib/site.ts`](src/lib/site.ts).

## Content and translations

All copy lives in typed dictionaries — no strings are hardcoded in components:

- [`src/i18n/dictionaries/en.ts`](src/i18n/dictionaries/en.ts) — source of truth;
  its shape defines the `Dictionary` type.
- [`src/i18n/dictionaries/ru.ts`](src/i18n/dictionaries/ru.ts) — typed against it,
  so a missing or renamed key fails the build.

### Adding a locale

1. Add the code to `locales` in [`src/i18n/config.ts`](src/i18n/config.ts) and give
   it entries in `localeNames` / `localeHtmlLang`.
2. Copy `en.ts`, translate it, and register it in [`src/i18n/index.ts`](src/i18n/index.ts).

Routing, the language switcher, `hreflang` tags and the sitemap all read from that
list — nothing else needs changing.

## Structure

```
src/
  app/[locale]/       route: layout (metadata, <html lang>) + landing page
  app/sitemap.ts      per-locale sitemap
  app/robots.ts       robots.txt
  components/         one file per page section, plus shared UI primitives
  i18n/               locale config, dictionaries, dictionary loader
  lib/site.ts         environment-level configuration
  proxy.ts            locale negotiation and redirect
```

## Design system

Defined once in [`src/app/globals.css`](src/app/globals.css) — tokens in `@theme`
and `:root`, plus the reusable `.card`, `.pill`, `.btn`, `.bubble`, `.t-hero`,
`.sky` and `.arc` classes. Components reference tokens rather than hardcoding
values, so the site re-skins from that one file.

| Token | Value | Used for |
| --- | --- | --- |
| `--color-paper` | `#f3f3f3` | Page ground below the hero |
| `--color-ink` | `#0e0a07` | Text, dark buttons, logo mark |
| `--ink-1/2/3` | `.92 / .62 / .42` | Every muted tone is the same ink, dialled down (`.muted`, `.faint`) |
| `--smooth-shadow-*` | 5–6 stacked layers | Soft card elevation; paired with a `--ring-layer` hairline |
| `--pill-bg` + `--nav-pill-shadow` | translucent white | Glass nav and filter pills |
| `--bubble-gray` / `--bubble-blue` | gradients | Incoming / outgoing chat bubbles |
| `--radius-card` | `24px` | Every card corner |

Type is the rounded system stack (`ui-rounded`, SF Pro Rounded) with **Inter**
loaded as the non-Apple fallback. Headings are weight 700 at `-0.038em` tracking.

Illustrations are drawn in code, not imported: the puffy stickers and glossy orbs
live in [`src/components/stickers.tsx`](src/components/stickers.tsx), and the
product mockups ([`phone-mock.tsx`](src/components/phone-mock.tsx),
[`feature-visuals.tsx`](src/components/feature-visuals.tsx)) are real HTML rather
than screenshots — so they restyle and translate along with everything else.

## Messaging platforms

Every platform is one entry in `messengerApps` in
[`src/components/brand-icons.tsx`](src/components/brand-icons.tsx), carrying the
name, a `tint`, a `wash` gradient and — where we have the artwork — a `src`
pointing at its logo.

WhatsApp, iMessage, Telegram and Instagram ship with real logo files in
`public/logos/`. `brandedApps` filters the list down to those, and it is what the
hero scatters, what the mobile platform row shows, and what appears inline in the
"lives in your customers' …" headline. The remaining entries (Messenger, Viber,
Discord, Signal, LINE, WeChat) are defined but not displayed — **add a `src` to one
and it joins every one of those surfaces automatically.**

[`AppTile`](src/components/app-tile.tsx) draws a logo file as-is with a drop
shadow, since each is already a finished app icon; without a file it falls back to
a gradient squircle around the drawn glyph. `BrandLogo` is the inline variant used
in copy, the chat header and card labels. The drawn SVG glyphs are still used on
the dark CTA buttons, where the mark has to be flat white.

### Adding or replacing a logo

Source files live in `logos/` at the repo root; the processed square PNGs live in
`public/logos/`. Logos arrive at odd sizes with transparent letterboxing, so they
are trimmed to their bounding box and padded to a 512×512 square — otherwise a
letterboxed file renders visibly smaller than the others at the same tile size.
Drop a new file in `logos/`, run the same trim-and-square step, save it to
`public/logos/<name>.png`, and point the entry's `src` at it.

## Animation

Everything animated on the page is a *conversation playing out*, not a decorative
transition. Three pieces do the work, and all of them honour
`prefers-reduced-motion` (globally neutralised in [`globals.css`](src/app/globals.css),
which makes every player jump straight to its finished state).

- **[`useChatSequence`](src/components/chat-player.tsx)** is the engine: it walks a
  script one step at a time, showing a typing indicator before anything the
  business sends, waits out the send, and stops on the last step. Each sequence
  starts when its element is first scrolled into view and **plays exactly once** —
  the finished conversation stays on screen afterwards and never replays.
Because a sequence plays once, an element that has not started yet renders *empty*
rather than finished — showing the completed thread up front would make it pop in
fully written and then reset to blank on the first scroll. The one exception is
reduced motion, which skips straight to the finished thread. The hero phone uses a
0.01 threshold so it begins on load, since it sits partly below the fold.

- **[`ChatPlayer`](src/components/chat-player.tsx)** wraps that for the feature
  cards. It takes `lines` (the messages) and `extras` — React nodes revealed one at
  a time after the last message, used for the receipt chip, the referral link, and
  the attribution rows. A fixed `height` with `justify-end` keeps the card from
  resizing as messages arrive.
- **[`chat-bits.tsx`](src/components/chat-bits.tsx)** holds the shared furniture:
  bubbles, the typing indicator, time dividers, link previews, receipt chips.

### The hero story

[`PhoneMock`](src/components/phone-mock.tsx) plays one long thread covering the
whole customer lifecycle — a first booking, a win-back three weeks later, then a
referral that pays out. The script lives in `hero.story` in the dictionaries, and
each step is tagged with an `act` (0/1/2). Time dividers ("3 weeks later") mark the
jumps, older messages scroll out of the fixed-height frame, and the pills under the
phone light up to name the capability being demonstrated — Engage, then Retain,
then Grow, coming to rest on Grow when the story ends. To change the story, edit `hero.story`; nothing in the component needs
touching as long as each step keeps its `k` / `from` / `text` / `act` shape.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build (runs TypeScript)
npm run start   # serve the build
npm run lint    # eslint
```
