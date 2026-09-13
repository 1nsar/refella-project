"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Bubble, TypingBubble } from "./chat-bits";
import { useInView } from "@/lib/use-in-view";

const QUERY = "(prefers-reduced-motion: reduce)";

export function usePrefersReducedMotion() {
  const subscribe = useCallback((onChange: () => void) => {
    const media = window.matchMedia(QUERY);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

export type Line = { from: string; text: string };

/**
 * Drives a step counter through a script: typing indicator, message lands,
 * next. Starts when the element is scrolled to and plays through exactly once,
 * holding the finished conversation afterwards.
 */
export function useChatSequence({
  total,
  isIncoming,
  typingMs = 950,
  sendMs = 680,
  threshold = 0.25,
}: {
  total: number;
  isIncoming: (index: number) => boolean;
  typingMs?: number;
  sendMs?: number;
  threshold?: number;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(threshold);

  const [count, setCount] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (reducedMotion || !inView) return;

    // Played through — hold the finished thread.
    if (count >= total) return;

    const incoming = isIncoming(count);

    if (incoming && !typing) {
      const timer = setTimeout(() => setTyping(true), 280);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(
      () => {
        setTyping(false);
        setCount((value) => value + 1);
      },
      incoming ? typingMs : sendMs,
    );
    return () => clearTimeout(timer);
  }, [count, typing, inView, reducedMotion, total, isIncoming, typingMs, sendMs]);

  return {
    ref,
    shown: reducedMotion ? total : count,
    typing: typing && inView && !reducedMotion,
  };
}

/**
 * A conversation that plays once. `extras` are revealed one at a time once
 * every message has landed — the receipt, the link, the attribution row.
 */
export function ChatPlayer({
  lines,
  extras = [],
  className = "",
  height,
}: {
  lines: readonly Line[];
  extras?: React.ReactNode[];
  className?: string;
  height?: number;
}) {
  const total = lines.length + extras.length;

  const isIncoming = useCallback(
    (index: number) =>
      index >= lines.length ? true : lines[index].from === "business",
    [lines],
  );

  const { ref, shown, typing } = useChatSequence({ total, isIncoming });

  return (
    <div
      ref={ref}
      aria-live="polite"
      className={`flex flex-col justify-end gap-2.5 overflow-hidden ${className}`}
      style={height ? { height } : undefined}
    >
      {lines.slice(0, shown).map((line, index) => (
        <Bubble key={index} incoming={line.from === "business"}>
          {line.text}
        </Bubble>
      ))}

      {extras.map((extra, index) =>
        shown > lines.length + index ? (
          <div key={`extra-${index}`}>{extra}</div>
        ) : null,
      )}

      {typing ? <TypingBubble /> : null}
    </div>
  );
}
