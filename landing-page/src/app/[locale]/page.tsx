import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { Sectors } from "@/components/sectors";
import { Capabilities } from "@/components/capabilities";
import { ChannelStatement } from "@/components/channel-statement";
import { FeatureCards } from "@/components/feature-cards";
import { Journey } from "@/components/journey";
import { ReferralFlow } from "@/components/referral-flow";
import { Outcomes } from "@/components/outcomes";
import { Faq } from "@/components/faq";
import { ArcCta } from "@/components/arc-cta";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/lib/site";

export default async function LandingPage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    applicationCategory: "BusinessApplication",
    description: t.meta.description,
    url: `https://${site.domain}/${locale}`,
    offers: { "@type": "Offer", availability: "https://schema.org/PreOrder" },
    mainEntity: {
      "@type": "FAQPage",
      mainEntity: t.faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  };

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader locale={locale} t={t} />
      <main>
        <Hero t={t} />
        <Sectors t={t} />
        <Capabilities t={t} />
        <ChannelStatement t={t} />
        <FeatureCards t={t} />
        <Journey t={t} />
        <ReferralFlow t={t} />
        <Outcomes t={t} />
        <Faq t={t} />
        <ArcCta t={t} />
      </main>
      <SiteFooter locale={locale} t={t} />
    </div>
  );
}
