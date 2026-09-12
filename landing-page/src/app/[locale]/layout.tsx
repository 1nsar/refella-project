import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { isLocale, locales, localeHtmlLang } from "@/i18n/config";
import { getDictionary } from "@/i18n";
import { site } from "@/lib/site";
import "../globals.css";

/* Loaded as the non-Apple fallback inside the rounded system stack. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);

  return {
    metadataBase: new URL(`https://${site.domain}`),
    title: t.meta.title,
    description: t.meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(
        locales.map((l) => [localeHtmlLang[l], `/${l}`]),
      ),
    },
    openGraph: {
      type: "website",
      title: t.meta.title,
      description: t.meta.description,
      url: `/${locale}`,
      siteName: site.name,
      locale: localeHtmlLang[locale],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.title,
      description: t.meta.description,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html
      lang={localeHtmlLang[locale]}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-clip bg-paper font-sans">
        {children}
      </body>
    </html>
  );
}
