import { Orb, GiftSticker, ChatSticker, HeartSticker, StarSticker, CoinSticker } from "./stickers";
import type { Dictionary } from "@/i18n";

const glyphs = [ChatSticker, GiftSticker, HeartSticker, StarSticker, CoinSticker];

export function ReferralFlow({ t }: { t: Dictionary }) {
  return (
    <section id="referrals" className="section scroll-mt-8">
      <div className="shell">
        <p className="eyebrow text-center">{t.referral.eyebrow}</p>
        <h2 className="t-h2 mx-auto mt-4 max-w-[18ch] text-balance text-center">
          {t.referral.title}
        </h2>
        <p className="mx-auto mt-5 max-w-[54ch] text-pretty text-center text-[16px] leading-relaxed muted">
          {t.referral.subtitle}
        </p>

        <ol className="mt-12 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {t.referral.steps.map((step, index) => {
            const Glyph = glyphs[index];
            return (
              <li key={step.title} className="card card-lift flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <Orb size={52}>
                    <Glyph size={30} />
                  </Orb>
                  <span className="text-[13px] font-bold faint">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold leading-tight tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="text-pretty text-[13.5px] leading-relaxed muted">
                  {step.body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
