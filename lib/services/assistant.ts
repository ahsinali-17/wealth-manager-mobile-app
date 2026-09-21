import { getCategoryConfig } from "@/constants/transactions";
import { format, isSameMonth, subDays } from "date-fns";
import { formatAmount } from "../utils";
import { Budget } from "./budgets";
import { Transaction } from "./transactions";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

function buildContext(
  transactions: Transaction[],
  budget: Budget | null,
  currency: string | null,
) {
  const now = new Date();
  const cutoff = subDays(now, 30);

  const filtered = transactions.filter((tr) => new Date(tr.date) >= cutoff);

  const thisMonthExpense = transactions
    .filter(
      (tr) => tr.type === "EXPENSE" && isSameMonth(new Date(tr.date), now),
    )
    .reduce((sum, tr) => sum + tr.amount, 0);

  let categoryExpense: Record<string, number> = {};
  let expense = 0;
  let income = 0;

  filtered.forEach((tr) => {
    if (tr.type === "EXPENSE") {
      expense += tr.amount;

      categoryExpense[tr.category] =
        (categoryExpense[tr.category] ?? 0) + tr.amount;
    } else if (tr.type === "INCOME") {
      income += tr.amount;
    }
  });

  let categoryExpenseLine = Object.entries(categoryExpense)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([key, amount]) =>
        `${getCategoryConfig(key as any)?.label ?? key}: ${formatAmount(amount, currency)}`,
    )
    .join("\n");

  let trLine = filtered
    .map(
      (tr) =>
        `${format(new Date(tr.date), "d MMM yyyy")} | ${tr.type} | ${getCategoryConfig(tr.category)?.label ?? tr.category} | ${formatAmount(tr.amount, currency)} | ${tr.description ? tr.description : ""}`,
    )
    .join("\n");

  let budgetLine = budget
    ? `${formatAmount(thisMonthExpense, currency)} spent out of ${formatAmount(budget.amount, currency)} monthly budget.`
    : "No budget set up.";

  return `Last 30 days summary:
Total income: ${formatAmount(income, currency)}
Total expense: ${formatAmount(expense, currency)}

Spending by category:
${categoryExpenseLine || "No expenses recorded."}

Monthly budget:
${budgetLine}

Recent transactions:
${trLine || "No transactions recorded."}`;
}

export async function askAssistant(
  question: string,
  transactions: Transaction[],
  budget: Budget | null,
  currency: string | null,
) {
  const api_key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!api_key) {
    throw new Error("Gemini API key is not defined");
  }

  const context = buildContext(transactions, budget, currency);

  const prompt = `You are a helpful personal finance assistant inside the Welth app. Answer the user's question using only the financial data below. Be concise and specific with numbers. If the data doesn't answer the question, say so.

${context}

User question: ${question}`;

  const res = await fetch(`${GEMINI_URL}?key=${api_key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API request failed: ${text}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(
      `Invalid response from Gemini API${
        data?.promptFeedback?.blockReason
          ? `: blocked (${data.promptFeedback.blockReason})`
          : ""
      }`,
    );
  }
  return text as string;
}
