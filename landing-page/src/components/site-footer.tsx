import Link from "next/link";
import { Logo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { site } from "@/lib/site";

export function SiteFooter({ locale, t }: { locale: Locale; t: Dictionary }) {
  const columns = [
    {
      title: t.footer.productTitle,
      links: [
        { href: "#platform", label: t.footer.product.engage },
        { href: "#platform", label: t.footer.product.retain },
        { href: "#platform", label: t.footer.product.grow },
        { href: "#how-it-works", label: t.footer.product.journey },
      ],
    },
    {
      title: t.footer.companyTitle,
      links: [
        { href: `mailto:${site.email}`, label: t.footer.company.contact },
        { href: "#faq", label: t.footer.company.faq },
      ],
    },
    {
      title: t.footer.legalTitle,
      links: [
        { href: `/${locale}/privacy`, label: t.footer.legal.privacy },
        { href: `/${locale}/terms`, label: t.footer.legal.terms },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden">
      <div className="shell grid gap-10 pb-10 pt-4 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col items-start gap-4">
          <Logo />
          <p className="max-w-[30ch] text-pretty text-[14.5px] leading-relaxed muted">
            {t.footer.tagline}
          </p>
          <p className="text-[13px] faint">{t.integrations.apps.join(", ")}.</p>
          <LocaleSwitcher current={locale} />
        </div>

        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <p className="text-[14px] font-bold tracking-[-0.02em]">{column.title}</p>
            <ul className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={`${column.title}-${link.label}`}>
                  <Link
                    href={link.href}
                    className="text-[14.5px] muted transition-opacity hover:opacity-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Oversized wordmark, clipped by the page edge. */}
      <p
        aria-hidden="true"
        className="select-none px-5 pb-6 text-center font-bold leading-none tracking-[-0.06em]"
        style={{
          fontSize: "clamp(4rem, 17vw, 13rem)",
          background: "linear-gradient(180deg, #cfe3f5 0%, #e9eff4 62%, #f3f3f3 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        Refella
      </p>

      <div className="shell flex flex-col gap-2 border-t border-black/[0.07] py-6 text-[13px] faint sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {site.name}. {t.footer.rights}
        </p>
        <a href={`mailto:${site.email}`} className="hover:text-ink">
          {site.email}
        </a>
      </div>
    </footer>
  );
}
