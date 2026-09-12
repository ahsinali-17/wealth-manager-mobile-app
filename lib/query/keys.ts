import { Transaction_Filter } from "../services/transactions";

export const queryKeys = {
  accounts: (userId: string) => ["accounts", userId] as const,
  transactions: (userId: string, filters: Transaction_Filter = {}) =>
    ["transactions", userId, filters] as const,
  budgets: (userId: string) => ["budgets", userId] as const,
};
