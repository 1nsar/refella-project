"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n";
import { whatsappLink } from "@/lib/site";

export function SiteHeader({ locale, t }: { locale: Locale; t: Dictionary }) {
  const links = [
    { href: "#capabilities", label: t.nav.pillars },
    { href: "#how-it-works", label: t.nav.journey },
    { href: "#referrals", label: t.nav.referrals },
    { href: "#faq", label: t.nav.faq },
  ];

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="shell flex items-center justify-between gap-4 pt-5">
        <Link href={`/${locale}`} aria-label="Refella" className="shrink-0">
          <Logo tone="light" />
        </Link>

        <div className="pill flex items-center gap-1 p-1.5">
          <nav className="hidden items-center lg:flex">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors hover:bg-black/[0.05]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <LocaleSwitcher current={locale} />

          <a
            href={whatsappLink(t.hero.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-dark whitespace-nowrap text-[13px] sm:text-[14px]"
            style={{ padding: "9px 14px" }}
          >
            {t.nav.cta}
          </a>
        </div>
      </div>
    </header>
  );
}
