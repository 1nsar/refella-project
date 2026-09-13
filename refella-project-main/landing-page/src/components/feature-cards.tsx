"use client";

import { EngageVisual, RetainVisual, GrowVisual, PrivacyVisual } from "./feature-visuals";
import type { Dictionary } from "@/i18n";

const washes = [
  "linear-gradient(150deg, #f7e9ef 0%, #efe9f8 45%, #e2defa 100%)",
  "linear-gradient(150deg, #e6f7ee 0%, #e4f4f7 50%, #dff0fb 100%)",
  "linear-gradient(150deg, #fdf0e4 0%, #f9e9ea 55%, #f1e6f6 100%)",
  "linear-gradient(150deg, #e7eefb 0%, #eaf1f6 50%, #e4f3ee 100%)",
];

function WashCard({
  wash,
  label,
  title,
  children,
  className = "",
}: {
  wash: string;
  label: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`relative flex flex-col justify-between overflow-hidden rounded-[var(--radius-card)] p-6 sm:p-8 ${className}`}
      style={{ background: wash, boxShadow: "var(--ring-layer)" }}
    >
      <p className="text-[13px] font-semibold" style={{ opacity: 0.55 }}>
        {label}
      </p>

      <div className="my-6 flex-1">{children}</div>

      <h3 className="t-h3 max-w-[18ch] text-balance">{title}</h3>
    </article>
  );
}

export function FeatureCards({ t }: { t: Dictionary }) {
  const [engage, retain, grow] = t.pillars.items;

  return (
    <section id="platform" className="scroll-mt-8 pb-[clamp(72px,10vw,132px)]">
      <div className="shell grid gap-4 lg:grid-cols-2">
        <WashCard wash={washes[0]} label={engage.tag} title={engage.title}>
          <EngageVisual t={t} />
        </WashCard>

        <WashCard wash={washes[1]} label={retain.tag} title={retain.title}>
          <RetainVisual t={t} />
        </WashCard>

        <WashCard wash={washes[2]} label={grow.tag} title={grow.title}>
          <GrowVisual t={t} />
        </WashCard>

        <WashCard
          wash={washes[3]}
          label={t.cards.privacy.tag}
          title={t.cards.privacy.title}
        >
          <PrivacyVisual t={t} />
        </WashCard>
      </div>
    </section>
  );
}
