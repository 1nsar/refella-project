import Image from "next/image";
import type { MessengerApp } from "./brand-icons";

/**
 * A messaging platform rendered at icon size.
 *
 * Platforms with a logo file are drawn as-is — they already carry their own
 * shape and colour — with just a drop shadow to lift them off the page.
 * Anything without a file falls back to a gradient squircle and drawn glyph.
 */
export function AppTile({
  app,
  size = 76,
  className = "",
  style,
}: {
  app: MessengerApp;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (app.src) {
    return (
      <Image
        src={app.src}
        alt={app.name}
        width={size}
        height={size}
        className={`shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          filter: "drop-shadow(0 14px 20px rgba(16,38,64,0.32))",
          ...style,
        }}
      />
    );
  }

  return (
    <span
      className={`grid shrink-0 place-items-center ${className}`}
      title={app.name}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        background: app.wash,
        boxShadow:
          "inset 0 1.5px 0 rgba(255,255,255,0.45), 0 0 0 1px rgba(15,15,15,0.06), 0 14px 26px -10px rgba(16,38,64,0.45)",
        ...style,
      }}
    >
      <app.Icon width={size * 0.56} height={size * 0.56} style={{ color: "#fff" }} />
    </span>
  );
}

/** Inline logo for use inside copy, chat headers and card labels. */
export function BrandLogo({
  app,
  size = 16,
  className = "",
}: {
  app: MessengerApp;
  size?: number;
  className?: string;
}) {
  if (!app.src) {
    return <app.Icon width={size} height={size} style={{ color: app.tint }} className={className} />;
  }

  return (
    <Image
      src={app.src}
      alt={app.name}
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
