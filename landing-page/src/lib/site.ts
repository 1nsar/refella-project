/**
 * Single source of truth for the values that change per environment.
 *
 * `domain` drives canonical URLs, hreflang alternates, the sitemap, robots.txt
 * and Open Graph metadata, so it must match the primary domain configured in
 * hosting exactly — including the `www.` prefix if www is the primary host.
 * Set NEXT_PUBLIC_WHATSAPP_NUMBER to the business number in E.164 digits
 * (no "+", no spaces) — e.g. 77001234567.
 */
export const site = {
  name: "Refella",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "refella.app",
  email: "hello@refella.app",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "77000000000",
} as const;

export function whatsappLink(prefilledMessage: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(prefilledMessage)}`;
}
