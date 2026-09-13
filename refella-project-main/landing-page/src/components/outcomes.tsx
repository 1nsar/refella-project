import type { Dictionary } from "@/i18n";

export function Outcomes({ t }: { t: Dictionary }) {
  return (
    <section className="section">
      <div className="shell">
        <p className="eyebrow text-center">{t.outcomes.eyebrow}</p>
        <h2 className="t-h2 mx-auto mt-4 max-w-[18ch] text-balance text-center">
          {t.outcomes.title}
        </h2>
        <p className="mx-auto mt-5 max-w-[54ch] text-pretty text-center text-[16px] leading-relaxed muted">
          {t.outcomes.subtitle}
        </p>

        <div className="mt-12 grid gap-3 md:grid-cols-3">
          {t.outcomes.items.map((item) => (
            <div key={item.label} className="card flex flex-col gap-2 p-7">
              <p className="flex items-baseline gap-2">
                <span className="text-[56px] font-bold leading-none tracking-[-0.05em]">
                  {item.stat}
                </span>
                {item.unit ? (
                  <span className="text-[14px] faint">{item.unit}</span>
                ) : null}
              </p>
              <p className="mt-1 text-[15px] font-bold tracking-[-0.02em]">{item.label}</p>
              <p className="text-pretty text-[14px] leading-relaxed muted">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
