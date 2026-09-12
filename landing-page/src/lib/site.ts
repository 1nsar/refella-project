/**
 * Single source of truth for the values that change per environment.
 * Set NEXT_PUBLIC_WHATSAPP_NUMBER to the business number in E.164 digits
 * (no "+", no spaces) — e.g. 77001234567.
 */
export const site = {
  name: "Refella",
  domain: "refella.com",
  email: "hello@refella.com",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "77000000000",
} as const;

export function whatsappLink(prefilledMessage: string) {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(prefilledMessage)}`;
}
