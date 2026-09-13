"use client";

import { CheckIcon, ArrowIcon, brandedApps } from "./brand-icons";
import { BrandLogo } from "./app-tile";
import { ChatPlayer } from "./chat-player";
import { NoteChip } from "./chat-bits";
import { Reveal } from "./reveal";
import { useInView } from "@/lib/use-in-view";
import type { Dictionary } from "@/i18n";

function Frame({
  innerRef,
  children,
}: {
  innerRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}) {
  return (
    <div ref={innerRef} className="card overflow-hidden p-5" style={{ minHeight: 300 }}>
      {children}
    </div>
  );
}

/** Engage — the question, the answer, the complaint, the handoff. */
export function EngageVisual({ t }: { t: Dictionary }) {
  const m = t.mocks.engage;

  return (
    <Frame>
      <div className="flex items-center gap-2 pb-3">
        <BrandLogo app={brandedApps[0]} size={15} />
        <span className="text-[12px] font-medium faint">{m.label}</span>
      </div>

      <ChatPlayer
        lines={m.thread}
        height={244}
        extras={[
          <NoteChip key="note">
            <CheckIcon width={13} height={13} />
            {m.footer}
          </NoteChip>,
        ]}
      />
    </Frame>
  );
}

/** Retain — the balance fills, then the offer that brings them back. */
export function RetainVisual({ t }: { t: Dictionary }) {
  const m = t.mocks.retain;
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <Frame innerRef={ref}>
      <Reveal play={inView}>
        <div className="rounded-xl border border-black/[0.07] p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[12.5px] font-semibold">{m.loyaltyLabel}</span>
            <span className="text-[11.5px] faint">{m.loyaltyCount}</span>
          </div>

          <div className="mt-2.5 flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => {
              const filled = i < 4;
              return (
                <span
                  key={i}
                  className="h-7 flex-1 overflow-hidden rounded-md"
                  style={{ background: "#f1f0ec" }}
                >
                  <span
                    className="block h-full w-full origin-left rounded-md"
                    style={{
                      background: filled
                        ? "linear-gradient(180deg,#4ebaff,#0088ff)"
                        : "transparent",
                      transform: inView && filled ? "scaleX(1)" : "scaleX(0)",
                      transition: `transform 420ms cubic-bezier(0.22,1,0.36,1) ${300 + i * 150}ms`,
                    }}
                  />
                </span>
              );
            })}
          </div>

          <p className="mt-2.5 text-[11.5px] faint">{m.loyaltyCaption}</p>
        </div>
      </Reveal>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {m.tags.map((tag, index) => (
          <Reveal key={tag} play={inView} delay={850 + index * 110} from="scale">
            <span
              className="rounded-full px-2.5 py-1 text-[11px] muted"
              style={{ background: "#f2f2f1" }}
            >
              {tag}
            </span>
          </Reveal>
        ))}
      </div>

      <ChatPlayer lines={m.thread} height={132} className="mt-3" />
    </Frame>
  );
}

/** Grow — the ask, the share, the friend who books, the credit. */
export function GrowVisual({ t }: { t: Dictionary }) {
  const m = t.mocks.grow;

  return (
    <Frame>
      <ChatPlayer
        lines={m.thread}
        height={286}
        extras={[
          <div
            key="link"
            className="flex animate-pop items-center gap-3 rounded-xl border border-black/[0.07] p-3"
          >
            <span
              className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg animate-pulse-ring"
              style={{ background: "rgb(0 136 255 / 0.09)", color: "#0069c7" }}
            >
              <ArrowIcon width={16} height={16} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-semibold">
                {m.linkLabel}
              </span>
              <span className="block text-[11px] faint">{m.linkCaption}</span>
            </span>
          </div>,
          ...m.rows.map((row) => (
            <div
              key={row.name}
              className="flex animate-pop items-center justify-between gap-3 rounded-xl border border-black/[0.07] px-3 py-2.5 text-[12px]"
            >
              <span className="font-semibold">{row.name}</span>
              <span
                className="flex items-center gap-1.5 text-right"
                style={{ color: row.done ? "#0069c7" : "rgb(14 10 7 / 0.42)" }}
              >
                {row.done ? <CheckIcon width={12} height={12} className="shrink-0" /> : null}
                {row.state}
              </span>
            </div>
          )),
        ]}
      />
    </Frame>
  );
}

/** Privacy — the customer opts out, and it takes effect immediately. */
export function PrivacyVisual({ t }: { t: Dictionary }) {
  const m = t.mocks.privacy;

  return (
    <div className="flex h-full items-center">
      <ChatPlayer
        lines={m.thread}
        height={190}
        className="w-full"
        extras={[
          <NoteChip key="note">
            <CheckIcon width={13} height={13} />
            {m.note}
          </NoteChip>,
        ]}
      />
    </div>
  );
}

export const featureVisuals = [EngageVisual, RetainVisual, GrowVisual];
