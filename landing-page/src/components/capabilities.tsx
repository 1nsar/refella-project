"use client";

import { useState } from "react";
import {
  ChatSticker,
  StarSticker,
  HeartSticker,
  GiftSticker,
  QrSticker,
  CoinSticker,
  BellSticker,
  TicketSticker,
  Orb,
} from "./stickers";
import type { Dictionary } from "@/i18n";

const glyphs = [
  ChatSticker,
  StarSticker,
  BellSticker,
  HeartSticker,
  QrSticker,
  GiftSticker,
  CoinSticker,
  TicketSticker,
];

export function Capabilities({ t }: { t: Dictionary }) {
  const [active, setActive] = useState(-1);

  const groups = t.pillars.items;
  const shown = active === -1 ? groups : [groups[active]];

  return (
    <section id="capabilities" className="section scroll-mt-8">
      <div className="shell">
        <p className="eyebrow text-center">{t.capabilities.eyebrow}</p>
        <h2 className="t-h2 mx-auto mt-4 max-w-[22ch] text-balance text-center">
          {t.capabilities.title}
        </h2>

        {/* Filter pills */}
        <div className="mt-8 flex justify-center">
          <div className="pill flex flex-wrap items-center justify-center gap-1 p-1.5">
            {[{ tag: t.capabilities.all }, ...groups].map((group, index) => {
              const value = index - 1;
              const isActive = active === value;
              return (
                <button
                  key={group.tag}
                  type="button"
                  onClick={() => setActive(value)}
                  aria-pressed={isActive}
                  className={`rounded-full px-4 py-1.5 text-[14px] font-medium transition-colors ${
                    isActive
                      ? "bg-white shadow-sm"
                      : "muted hover:bg-black/[0.04]"
                  }`}
                >
                  {group.tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grouped capability cards */}
        <div className="mt-12 flex flex-col gap-12">
          {shown.map((group) => {
            const offset = groups.indexOf(group) * 3;

            return (
              <div key={group.tag}>
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <h3 className="text-[17px] font-bold tracking-[-0.02em]">
                    {group.tag}
                  </h3>
                  <span className="text-[14px] faint">{group.title}</span>
                </div>

                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.features.map((feature, index) => {
                    const Glyph = glyphs[(index + offset) % glyphs.length];
                    return (
                      <li
                        key={feature}
                        className="card card-lift flex items-center gap-3.5 p-4"
                      >
                        <Orb size={46}>
                          <Glyph size={26} />
                        </Orb>
                        <span className="text-pretty text-[15px] font-medium leading-snug">
                          {feature}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
