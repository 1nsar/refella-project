import type { Dictionary } from "@/i18n";

export function Faq({ t }: { t: Dictionary }) {
  return (
    <section id="faq" className="section scroll-mt-8">
      <div className="shell">
        <p className="eyebrow text-center">{t.faq.eyebrow}</p>
        <h2 className="t-h2 mx-auto mt-4 max-w-[18ch] text-balance text-center">
          {t.faq.title}
        </h2>

        <div className="mx-auto mt-12 flex max-w-3xl flex-col gap-2.5">
          {t.faq.items.map((item) => (
            <details key={item.q} name="faq" className="card group p-5 sm:p-6">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[16px] font-bold tracking-[-0.02em] marker:content-none">
                <span className="text-pretty">{item.q}</span>
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-black/[0.05] transition-transform duration-200 group-open:rotate-45"
                >
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 max-w-[64ch] text-pretty text-[15px] leading-relaxed muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
