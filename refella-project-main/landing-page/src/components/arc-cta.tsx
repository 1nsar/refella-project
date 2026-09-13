import { WhatsAppIcon } from "./brand-icons";
import type { Dictionary } from "@/i18n";
import { site, whatsappLink } from "@/lib/site";

/** Pale arc rising out of the page, carrying the closing pitch. */
export function ArcCta({ t }: { t: Dictionary }) {
  return (
    <section className="relative overflow-hidden pt-20">
      <div
        aria-hidden="true"
        className="arc absolute inset-x-[-20%] bottom-0 top-14"
      />

      <div className="shell relative pb-8 pt-16 text-center">
        <h2 className="t-h2 mx-auto max-w-[18ch] text-balance">{t.finalCta.title}</h2>
        <p className="mx-auto mt-5 max-w-[50ch] text-pretty text-[16px] leading-relaxed muted">
          {t.finalCta.subtitle}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href={whatsappLink(t.finalCta.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-dark btn-lg"
          >
            <WhatsAppIcon width={17} height={17} />
            {t.finalCta.primaryCta}
          </a>
          <a href={`mailto:${site.email}`} className="btn btn-emboss btn-lg">
            {t.finalCta.secondaryCta}
          </a>
        </div>

        <p className="mt-5 text-[13px] faint">{t.finalCta.note}</p>
      </div>
    </section>
  );
}
