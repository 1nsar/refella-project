"use client";

/** Staggered entrance for a single element, driven by a parent's play flag. */
export function Reveal({
  play,
  delay = 0,
  from = "up",
  className = "",
  children,
}: {
  play: boolean;
  delay?: number;
  from?: "up" | "left" | "right" | "scale";
  className?: string;
  children: React.ReactNode;
}) {
  const hidden = {
    up: "translateY(12px)",
    left: "translateX(-14px)",
    right: "translateX(14px)",
    scale: "scale(0.92)",
  }[from];

  return (
    <div
      className={className}
      style={{
        opacity: play ? 1 : 0,
        transform: play ? "none" : hidden,
        transition: `opacity 520ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 520ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}
