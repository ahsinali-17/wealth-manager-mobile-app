import { ALL_CURRENCIES } from "@/components/currencyPicker";
export function formatAmount(
  amount: number | undefined,
  currency: string | null,
) {
  amount = amount || 0;
  const currencyIso = ALL_CURRENCIES.find((c) => c.code === currency);
  if (!currencyIso) {
    return `${currency} ${amount.toFixed(0)}`;
  }
  return `${currencyIso.symbol} ${amount.toFixed(0)}`;

  // amount = amount || 0;
  // let locale = currency === "PKR" ? "en-PK" : undefined;
  // currency = currency || "PKR";
  // return new Intl.NumberFormat(locale, {
  //   maximumFractionDigits: 0,
  //   currency,
  //   style: "currency",
  // }).format(amount);
}
