export const locales = ["en", "ru"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
};

export const localeHtmlLang: Record<Locale, string> = {
  en: "en",
  ru: "ru",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
