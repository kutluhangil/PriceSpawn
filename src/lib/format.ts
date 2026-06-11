import type { Locale } from "@/i18n";

export function formatTRY(amount: number, locale: Locale): string {
  const isWhole = Number.isInteger(amount);
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "TRY",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
