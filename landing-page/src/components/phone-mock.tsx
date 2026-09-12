"use client";

import { useCallback } from "react";
import { brandedApps } from "./brand-icons";
import { BrandLogo } from "./app-tile";
import { Bubble, TypingBubble, Divider, LinkCard } from "./chat-bits";
import { useChatSequence } from "./chat-player";
import type { Dictionary } from "@/i18n";

/**
 * Plays the whole customer lifecycle once — a first booking, a win-back weeks
 * later, then a referral that pays out — with the three capabilities called out
 * as the story moves through them, and the finished thread left on screen.
 */
export function PhoneMock({ t }: { t: Dictionary }) {
  const story = t.hero.story;

  // Dividers and link cards arrive from the business side, so they type too.
  const isIncoming = useCallback(
    (index: number) => story[index].k !== "msg" || story[index].from === "business",
    [story],
  );

  const { ref, shown, typing } = useChatSequence({
    total: story.length,
    isIncoming,
    typingMs: 1050,
    sendMs: 720,
    threshold: 0.01,
  });

  const currentAct = story[Math.min(shown, story.length - 1)].act;
  const acts = t.pillars.items;

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className="relative w-[290px] shrink-0 rounded-[46px] p-[10px] sm:w-[320px]"
        style={{
          background: "linear-gradient(180deg, #fbfbfc 0%, #eeeef1 42%, #cfcfd4 100%)",
          boxShadow:
            "0 0 0 1px #0f0f0f1a, inset 0 1px 0 #fff, 0 50px 90px -30px rgba(16,38,64,0.45)",
        }}
      >
        <div className="relative overflow-hidden rounded-[38px] bg-white">
          {/* Chat header */}
          <div className="relative flex flex-col items-center gap-1.5 border-b border-black/[0.06] bg-white/90 px-4 pb-3 pt-3">
            <span className="h-[22px] w-[86px] rounded-full bg-ink" />
            <div className="flex w-full items-center justify-between pt-1">
              <span className="flex items-center gap-1 text-[13px] text-[#0088ff]">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 3 5 8l5 5" />
                </svg>
                2
              </span>
              <span className="flex flex-col items-center gap-0.5">
                <BrandLogo app={brandedApps[0]} size={32} />
                <span className="text-[11px] font-medium">
                  Refella{" "}
                  <span className="font-normal faint">
                    {typing ? t.phone.typing : "›"}
                  </span>
                </span>
              </span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="rgb(14 10 7 / 0.42)" strokeWidth="1.8" strokeLinejoin="round">
                <rect x="2" y="6" width="13" height="12" rx="3" />
                <path d="M15 11l6-3.5v9L15 13z" />
              </svg>
            </div>
          </div>

          {/* Thread — fills from the bottom, so older messages scroll away */}
          <div
            ref={ref}
            aria-live="polite"
            className="flex h-[430px] flex-col justify-end gap-2 overflow-hidden px-3 py-4"
          >
            {story.slice(0, shown).map((step, index) => {
              if (step.k === "divider") {
                return <Divider key={index} text={step.text} />;
              }
              if (step.k === "link") {
                return (
                  <LinkCard key={index} title={step.text} caption="refella.com" />
                );
              }
              return (
                <Bubble key={index} incoming={step.from === "business"}>
                  {step.text}
                </Bubble>
              );
            })}

            {typing ? <TypingBubble /> : null}
          </div>

          {/* Composer */}
          <div className="flex items-center gap-2 border-t border-black/[0.06] px-3 py-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-black/[0.06] text-[16px] leading-none faint">
              +
            </span>
            <span className="flex-1 rounded-full border border-black/10 px-3 py-1.5 text-[13px] faint">
              {t.phone.composer}
            </span>
          </div>
        </div>
      </div>

      {/* Which capability the story is demonstrating right now */}
      <ol className="flex items-center gap-1.5">
        {acts.map((act, index) => {
          const active = index === currentAct;
          const done = index < currentAct;
          return (
            <li key={act.tag} className="flex items-center gap-1.5">
              <span
                className="rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-all duration-500"
                style={{
                  background: active ? "#fff" : "rgba(255,255,255,0.5)",
                  color: active ? "var(--color-ink)" : "rgb(14 10 7 / 0.5)",
                  boxShadow: active
                    ? "var(--smooth-shadow-md), 0 0 0 1px rgba(15,15,15,0.05)"
                    : "inset 0 0 0 1px rgba(15,15,15,0.05)",
                }}
              >
                {act.tag}
              </span>
              {index < acts.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="h-px w-4 transition-colors duration-500"
                  style={{
                    background: done || active ? "rgb(14 10 7 / 0.28)" : "rgb(14 10 7 / 0.12)",
                  }}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
