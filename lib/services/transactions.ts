import { CategoryKey } from "@/constants/transactions";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TransactionType = "EXPENSE" | "INCOME";
export type Input_Method = "MANUAL" | "VOICE" | "RECEIPT_SCAN";

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  amount: number;
  type: TransactionType;
  category: CategoryKey;
  input_method: Input_Method;
  description: string | null;
  date: string;
  status: string;
  voice_transcript: string | null;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type Transaction_Filter = {
  type?: TransactionType | null;
  accountId?: string | null;
};

export async function getTransactions(
  client: SupabaseClient,
  user_id: string,
  filter: Transaction_Filter = {},
) {
  let query = client.from("transactions").select("*").eq("user_id", user_id);

  if (filter.type) query = query.eq("type", filter.type);
  if (filter.accountId) query = query.eq("account_id", filter.accountId);

  const { data: TransactionData, error: TransactionError } = await query.order(
    "created_at",
    { ascending: false },
  );

  if (TransactionError) {
    console.error("Error fetching transactions:", TransactionError);
    throw TransactionError;
  }
  return (TransactionData as Transaction[]) || [];
}
