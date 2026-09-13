import type { SVGProps } from "react";

type Icon = (props: SVGProps<SVGSVGElement>) => React.ReactElement;

/* ---------- Messenger marks ----------
 * Simplified glyphs drawn in code, each in its platform's brand colour.
 * Every entry can be swapped for an official PNG by giving the app an
 * `src` in `messengerApps` below — see README.
 */

export const WhatsAppIcon: Icon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.69 14.05c-.24.67-1.4 1.28-1.94 1.36-.5.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.17-1.56-1.17-2.97 0-1.41.74-2.11 1-2.4.26-.29.57-.36.76-.36h.55c.18 0 .41-.07.64.49.24.57.81 1.98.88 2.13.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.3.37-.42.5-.14.14-.29.29-.12.57.16.29.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.45.12.62-.07.17-.19.71-.83.9-1.12.19-.29.38-.24.64-.14.26.09 1.66.78 1.95.93.28.14.47.21.54.33.07.12.07.69-.17 1.36Z" />
  </svg>
);

export const TelegramIcon: Icon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M20.6 5.2 3.9 11.6c-.9.35-.88 1.65.03 1.97l4.2 1.47 1.63 5.1c.2.62 1 .78 1.42.29l2.3-2.7 4.3 3.17c.55.4 1.34.1 1.48-.57l3.02-14.2c.16-.75-.58-1.38-1.28-1.1ZM8.9 14.2l8.5-5.3c.2-.13.4.15.23.31l-6.9 6.3c-.18.16-.3.4-.33.65l-.22 1.9-1.28-3.86Z" />
  </svg>
);

export const ImessageIcon: Icon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.6c-5.4 0-9.8 3.66-9.8 8.18 0 2.56 1.4 4.85 3.6 6.34.23.16.32.46.22.72l-.9 2.5c-.12.33.22.62.53.45l3.2-1.7c.18-.1.4-.12.6-.07.83.2 1.72.3 2.55.3 5.4 0 9.8-3.66 9.8-8.18S17.4 2.6 12 2.6Z" />
  </svg>
);

export const MessengerIcon: Icon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.2C6.3 2.2 2 6.4 2 11.9c0 3.1 1.4 5.8 3.7 7.6v3.5l3.4-1.9c.9.25 1.9.38 2.9.38 5.7 0 10-4.2 10-9.7S17.7 2.2 12 2.2Zm1.1 12.7-2.6-2.7-4.9 2.7L10.5 9l2.6 2.7L18 9l-4.9 5.9Z" />
  </svg>
);

export const InstagramIcon: Icon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5.2" />
    <circle cx="12" cy="12" r="4.1" />
    <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const ViberIcon: Icon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.4c-4.9 0-8.9 3.4-8.9 7.9 0 2.4 1.1 4.5 2.9 6v4l3.3-2.3c.85.2 1.75.3 2.7.3 4.9 0 8.9-3.4 8.9-7.9S16.9 2.4 12 2.4Zm4.2 11.7c-.2.57-1.1 1.1-1.6 1.15-.43.05-.95.08-1.53-.1-.35-.1-.8-.26-1.38-.5-2.43-1.06-4.02-3.5-4.14-3.66-.12-.16-1-1.32-1-2.5 0-1.2.63-1.78.85-2.03.22-.24.48-.3.64-.3h.46c.15 0 .35-.6.54.42.2.48.68 1.67.74 1.8.06.11.1.25.02.41-.08.16-.12.27-.24.42-.12.14-.25.31-.36.42-.12.12-.24.25-.1.48.13.24.6 1.01 1.32 1.65.9.8 1.67 1.05 1.9 1.17.24.12.38.1.52-.6.15-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.14 1.15Z" />
  </svg>
);

export const DiscordIcon: Icon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M19.3 6.1A16 16 0 0 0 15.4 5l-.25.5a12 12 0 0 1 3.4 1.45 14 14 0 0 0-12-.5c-.2.08-.4.17-.6.26A12 12 0 0 1 9.1 5.5L8.8 5a16 16 0 0 0-3.9 1.1C2.5 9.7 1.9 13.2 2.2 16.6a16.2 16.2 0 0 0 4.9 2.5l.9-1.5c-.55-.2-1.07-.45-1.55-.75l.38-.28a11.4 11.4 0 0 0 10.34 0l.38.28c-.48.3-1 .55-1.55.75l.9 1.5a16.2 16.2 0 0 0 4.9-2.5c.36-3.94-.6-7.42-2.5-10.5ZM8.9 14.6c-.95 0-1.73-.88-1.73-1.95 0-1.08.76-1.95 1.73-1.95.97 0 1.75.88 1.73 1.95 0 1.07-.76 1.95-1.73 1.95Zm6.2 0c-.95 0-1.73-.88-1.73-1.95 0-1.08.76-1.95 1.73-1.95.97 0 1.75.88 1.73 1.95 0 1.07-.76 1.95-1.73 1.95Z" />
  </svg>
);

export const SignalIcon: Icon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 2.8c-5.2 0-9.4 3.7-9.4 8.3 0 1.9.72 3.65 1.93 5.06l-1.1 3.6c-.16.52.34 1 .86.82l3.68-1.28A10.4 10.4 0 0 0 12 19.4c5.2 0 9.4-3.7 9.4-8.3S17.2 2.8 12 2.8Z" />
  </svg>
);

export const LineIcon: Icon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M12 3C6.9 3 2.8 6.4 2.8 10.6c0 3.75 3.24 6.9 7.62 7.5.3.06.7.2.8.45.09.23.06.58.03.81l-.13.77c-.04.23-.18.9.79.49 .97-.4 5.23-3.08 7.13-5.28 1.32-1.44 1.96-2.9 1.96-4.74C21 6.4 17.1 3 12 3ZM8.2 13.1H6.35c-.27 0-.49-.22-.49-.49V9a.49.49 0 0 1 .98 0v3.12H8.2a.49.49 0 0 1 0 .98Zm1.93-.49a.49.49 0 0 1-.98 0V9a.49.49 0 0 1 .98 0v3.61Zm4.2 0a.49.49 0 0 1-.88.3l-1.9-2.58v2.28a.49.49 0 0 1-.98 0V9a.49.49 0 0 1 .88-.3l1.9 2.59V9a.49.49 0 0 1 .98 0v3.61Zm3.06-2.29a.49.49 0 0 1 0 .98h-1.36v.87h1.36a.49.49 0 0 1 0 .98h-1.85a.49.49 0 0 1-.49-.49V9c0-.27.22-.49.49-.49h1.85a.49.49 0 0 1 0 .98h-1.36v.87h1.36Z" />
  </svg>
);

export const WeChatIcon: Icon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M9 3.6c-3.7 0-6.7 2.5-6.7 5.6 0 1.75.96 3.3 2.47 4.33l-.62 1.9 2.2-1.12c.5.13 1.02.22 1.56.27a4.6 4.6 0 0 1-.13-1.07c0-2.9 2.8-5.2 6.25-5.2.2 0 .4 0 .6.02C14.15 5.65 11.87 3.6 9 3.6Zm-2.3 3.6a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7Zm4.6 0a.85.85 0 1 1 0 1.7.85.85 0 0 1 0-1.7Z" />
    <path d="M21.7 13.5c0-2.5-2.5-4.5-5.6-4.5s-5.6 2-5.6 4.5 2.5 4.5 5.6 4.5c.62 0 1.22-.08 1.78-.23l1.9.97-.52-1.6c1.48-.83 2.44-2.16 2.44-3.64Zm-7.5-1.1a.72.72 0 1 1 0-1.44.72.72 0 0 1 0 1.44Zm3.8 0a.72.72 0 1 1 0-1.44.72.72 0 0 1 0 1.44Z" />
  </svg>
);

/* ---------- Utility marks ---------- */

export const ArrowIcon: Icon = (props) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

export const CheckIcon: Icon = (props) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <path d="M3 8.5 6.5 12 13 4.5" />
  </svg>
);

export const QrIcon: Icon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <path d="M14 14h3v3h-3zM20 14h1M14 20h3M20 17v4" strokeLinecap="round" />
  </svg>
);

/**
 * Every messaging platform shown on the page.
 *
 * `wash` is the icon-tile background, `tint` the flat colour for inline marks.
 * To use an official logo file instead of the drawn glyph, drop it in
 * `public/logos/` and set `src` — AppTile renders the image when present.
 */
export type MessengerApp = {
  name: string;
  Icon: Icon;
  tint: string;
  wash: string;
  src?: string;
};

export const messengerApps: MessengerApp[] = [
  {
    name: "WhatsApp",
    Icon: WhatsAppIcon,
    tint: "#25D366",
    wash: "linear-gradient(180deg, #5BF675 0%, #25D366 55%, #1EBE5A 100%)",
    src: "/logos/whatsapp.png",
  },
  {
    name: "iMessage",
    Icon: ImessageIcon,
    tint: "#34C759",
    wash: "linear-gradient(180deg, #6EE787 0%, #34C759 55%, #24A94A 100%)",
    src: "/logos/imessage.png",
  },
  {
    name: "Telegram",
    Icon: TelegramIcon,
    tint: "#2AABEE",
    wash: "linear-gradient(180deg, #55C2F5 0%, #2AABEE 55%, #1E92D1 100%)",
    src: "/logos/telegram.png",
  },
  {
    name: "Messenger",
    Icon: MessengerIcon,
    tint: "#0084FF",
    wash: "linear-gradient(160deg, #00B2FF 0%, #0084FF 45%, #A033FF 100%)",
  },
  {
    name: "Instagram",
    Icon: InstagramIcon,
    tint: "#E1306C",
    wash: "linear-gradient(160deg, #FEDA75 0%, #FA7E1E 28%, #D62976 62%, #962FBF 88%, #4F5BD5 100%)",
    src: "/logos/instagram.png",
  },
  {
    name: "Viber",
    Icon: ViberIcon,
    tint: "#7360F2",
    wash: "linear-gradient(180deg, #9585F7 0%, #7360F2 55%, #5B48D8 100%)",
  },
  {
    name: "Discord",
    Icon: DiscordIcon,
    tint: "#5865F2",
    wash: "linear-gradient(180deg, #7A85F5 0%, #5865F2 55%, #4450DC 100%)",
  },
  {
    name: "Signal",
    Icon: SignalIcon,
    tint: "#3A76F0",
    wash: "linear-gradient(180deg, #6395F5 0%, #3A76F0 55%, #2A5FD4 100%)",
  },
  {
    name: "LINE",
    Icon: LineIcon,
    tint: "#06C755",
    wash: "linear-gradient(180deg, #3BE07F 0%, #06C755 55%, #03A845 100%)",
  },
  {
    name: "WeChat",
    Icon: WeChatIcon,
    tint: "#07C160",
    wash: "linear-gradient(180deg, #3ADB86 0%, #07C160 55%, #05A250 100%)",
  },
];

/**
 * Platforms with a real logo file — the ones shown as tiles and inline marks.
 * Adding a logo to another entry above brings it into these surfaces too.
 */
export const brandedApps = messengerApps.filter((app) => app.src);

/** Alias kept for the inline marks in the copy. */
export const channelIcons = brandedApps;
