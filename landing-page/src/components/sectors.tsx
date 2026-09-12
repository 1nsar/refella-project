import type { Dictionary } from "@/i18n";

export function Sectors({ t }: { t: Dictionary }) {
  return (
    <section className="pt-16">
      <div className="shell">
        <p className="text-center text-[13px] faint">{t.sectors.title}</p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {t.sectors.items.map((item) => (
            <li key={item} className="card px-4 py-2 text-[14px] font-medium">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
