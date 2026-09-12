import { QrIcon } from "./brand-icons";
import type { Dictionary } from "@/i18n";

export function Journey({ t }: { t: Dictionary }) {
  return (
    <section id="how-it-works" className="section scroll-mt-8">
      <div className="shell">
        <p className="eyebrow text-center">{t.journey.eyebrow}</p>
        <h2 className="t-h2 mx-auto mt-4 max-w-[20ch] text-balance text-center">
          {t.journey.title}
        </h2>
        <p className="mx-auto mt-5 max-w-[52ch] text-pretty text-center text-[16px] leading-relaxed muted">
          {t.journey.subtitle}
        </p>

        <div className="card mt-12 overflow-hidden p-2 sm:p-3">
          <div className="hidden grid-cols-[9rem_1fr_1fr] gap-8 px-5 py-3 md:grid">
            <span />
            <span className="text-[12px] font-semibold uppercase tracking-[0.1em] faint">
              {t.journey.columnCustomer}
            </span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#0069c7]">
              {t.journey.columnSystem}
            </span>
          </div>

          <ol>
            {t.journey.steps.map((step, index) => (
              <li
                key={step.moment}
                className="grid gap-3 rounded-[18px] px-5 py-5 transition-colors odd:bg-black/[0.025] md:grid-cols-[9rem_1fr_1fr] md:gap-8"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[11px] font-bold shadow-sm">
                    {index === 0 ? (
                      <QrIcon width={14} height={14} />
                    ) : (
                      String(index + 1).padStart(2, "0")
                    )}
                  </span>
                  <span className="text-[15px] font-bold tracking-[-0.02em]">
                    {step.moment}
                  </span>
                </div>

                <p className="text-pretty text-[14.5px] leading-relaxed">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] faint md:hidden">
                    {t.journey.columnCustomer}
                  </span>
                  {step.customer}
                </p>

                <p className="text-pretty text-[14.5px] leading-relaxed muted">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0069c7] md:hidden">
                    {t.journey.columnSystem}
                  </span>
                  {step.system}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
