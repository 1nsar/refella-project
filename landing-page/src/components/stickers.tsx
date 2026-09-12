import type { SVGProps } from "react";

/**
 * Original puffy-sticker set: a solid shape, a thick white rim, and a soft
 * drop shadow. Drawn rather than imported so they scale and tint freely.
 */
type StickerProps = SVGProps<SVGSVGElement> & { size?: number };

const rim = { stroke: "#fff", strokeWidth: 7, strokeLinejoin: "round" as const };

function Sticker({ size = 72, children, ...props }: StickerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 12px 18px rgba(20,40,70,0.22))" }}
      {...props}
    >
      {children}
    </svg>
  );
}

export function HeartSticker(props: StickerProps) {
  const d =
    "M50 84C34 72 18 60 18 43.5 18 33 26 25 36 25c6 0 11 3 14 7 3-4 8-7 14-7 10 0 18 8 18 18.5C82 60 66 72 50 84Z";
  return (
    <Sticker {...props}>
      <path d={d} fill="#e2574c" {...rim} />
      <path d={d} fill="#e2574c" />
      <path d="M44 44l5 5 10-10" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
    </Sticker>
  );
}

export function ChatSticker(props: StickerProps) {
  const d =
    "M20 24h60a8 8 0 0 1 8 8v30a8 8 0 0 1-8 8H44L26 84V70h-6a8 8 0 0 1-8-8V32a8 8 0 0 1 8-8Z";
  return (
    <Sticker {...props}>
      <path d={d} fill="#3ac06b" {...rim} />
      <path d={d} fill="#3ac06b" />
      <g fill="#fff">
        <circle cx="35" cy="47" r="5" />
        <circle cx="50" cy="47" r="5" />
        <circle cx="65" cy="47" r="5" />
      </g>
    </Sticker>
  );
}

export function StarSticker(props: StickerProps) {
  const d =
    "M50 16l9.8 21.3L83 40.2 66 56.4l4.3 23-20.3-11.2L29.7 79.4 34 56.4 17 40.2l23.2-2.9L50 16Z";
  return (
    <Sticker {...props}>
      <path d={d} fill="#f5c344" {...rim} />
      <path d={d} fill="#f5c344" />
    </Sticker>
  );
}

export function GiftSticker(props: StickerProps) {
  return (
    <Sticker {...props}>
      <g {...rim} fill="#e98a3c">
        <rect x="20" y="38" width="60" height="44" rx="8" />
      </g>
      <rect x="20" y="38" width="60" height="44" rx="8" fill="#e98a3c" />
      <rect x="44" y="38" width="12" height="44" fill="#fff" />
      <path
        d="M50 38c-6-12-20-14-22-6-1.6 6.4 8 8 22 6Zm0 0c6-12 20-14 22-6 1.6 6.4-8 8-22 6Z"
        fill="#e98a3c"
        stroke="#fff"
        strokeWidth="4"
      />
    </Sticker>
  );
}

export function QrSticker(props: StickerProps) {
  return (
    <Sticker {...props}>
      <rect x="18" y="18" width="64" height="64" rx="14" fill="#2f6fd0" stroke="#fff" strokeWidth="7" />
      <g fill="#fff">
        <rect x="29" y="29" width="16" height="16" rx="4" />
        <rect x="55" y="29" width="16" height="16" rx="4" />
        <rect x="29" y="55" width="16" height="16" rx="4" />
        <rect x="55" y="55" width="7" height="7" rx="2" />
        <rect x="64" y="64" width="7" height="7" rx="2" />
      </g>
    </Sticker>
  );
}

export function CoinSticker(props: StickerProps) {
  return (
    <Sticker {...props}>
      <circle cx="50" cy="50" r="32" fill="#f0b429" stroke="#fff" strokeWidth="7" />
      <circle cx="50" cy="50" r="22" fill="none" stroke="#fff" strokeWidth="4" opacity="0.75" />
      <path
        d="M50 35v30M43 43h11a5 5 0 0 1 0 10h-8a5 5 0 0 0 0 10h12"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </Sticker>
  );
}

export function BellSticker(props: StickerProps) {
  const d =
    "M50 16a20 20 0 0 1 20 20v14l7 12H23l7-12V36a20 20 0 0 1 20-20Z";
  return (
    <Sticker {...props}>
      <path d={d} fill="#d95d8f" {...rim} />
      <path d={d} fill="#d95d8f" />
      <path d="M42 68a8 8 0 0 0 16 0" stroke="#fff" strokeWidth="6" strokeLinecap="round" fill="none" />
    </Sticker>
  );
}

export function TicketSticker(props: StickerProps) {
  return (
    <Sticker {...props}>
      <path
        d="M18 34h64v14a8 8 0 0 0 0 16v14H18V64a8 8 0 0 0 0-16V34Z"
        fill="#7b6ae0"
        stroke="#fff"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path d="M50 40v6M50 54v6M50 68v6" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    </Sticker>
  );
}

export function LockSticker(props: StickerProps) {
  return (
    <Sticker {...props}>
      <path
        d="M34 46V36a16 16 0 0 1 32 0v10"
        fill="none"
        stroke="#fff"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M34 46V36a16 16 0 0 1 32 0v10"
        fill="none"
        stroke="#5a6b7d"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <rect x="22" y="44" width="56" height="40" rx="11" fill="#e9873c" stroke="#fff" strokeWidth="7" />
      <circle cx="50" cy="60" r="6" fill="#fff" />
      <path d="M50 64v8" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    </Sticker>
  );
}

/** Small white glossy orb holding a glyph — the round accents in the hero. */
export function Orb({
  size = 74,
  children,
}: {
  size?: number;
  children: React.ReactNode;
}) {
  return (
    <span
      className="grid place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(180deg, #ffffff 0%, #eceef1 60%, #d9dde2 100%)",
        boxShadow:
          "inset 0 2px 3px #fff, inset 0 -3px 6px #0f0f0f14, 0 14px 26px -10px rgba(20,40,70,0.35)",
      }}
    >
      {children}
    </span>
  );
}
