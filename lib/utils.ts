import { ALL_CURRENCIES } from "@/components/currencyPicker";
import { format } from "date-fns";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Transaction } from "./services/transactions";

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

const CSV_WINDOW_DAYS = 30;

function toCSVCell(value: string | number | null): string {
  if (value === null || value === undefined) return "";

  const str = String(value);

  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function buildCsv(csvData: Transaction[]) {
  const header = ["Date", "Type", "Account", "Amount", "Category"];
  const rows = csvData.map((tr) => [
    format(tr.date, "dd/MM/yyyy"),
    tr.type,
    tr.account_id,
    tr.amount.toString(),
    tr.category,
  ]);
  return [header, ...rows]
    .map((row) => row.map(toCSVCell).join(","))
    .join("\n"); //surrounds each element with "" if contains , or \n
}

export async function exportToCSV(data: Transaction[]) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - CSV_WINDOW_DAYS);

  let filtered = data.filter((tr) => new Date(tr.date) >= cutoff);

  const csv = buildCsv(filtered);

  const fileName = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;

  const file = new File(new Directory(Paths.cache), fileName);

  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: "Share transactions",
      UTI: "public.comma-separated-values-text",
    });
  }
  return { count: filtered.length, uri: file.uri };
}
