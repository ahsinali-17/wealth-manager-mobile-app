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
    throw TransactionError;
  }
  return (TransactionData as Transaction[]) || [];
}

export async function deleteTransaction(
  client: SupabaseClient,
  transaction_id: string,
  accountId: string,
  amount: number,
  type: TransactionType,
) {
  const { error } = await client
    .from("transactions")
    .delete()
    .eq("id", transaction_id);

  if (error) return { error };

  const { data: accountData, error: AccountError } = await client
    .from("accounts")
    .select("balance")
    .eq("id", accountId)
    .single();

  if (AccountError) return { AccountError };

  const { error: AccountUpdateError } = await client
    .from("accounts")
    .update({
      balance:
        type === "EXPENSE"
          ? accountData.balance + amount
          : accountData.balance - amount,
    })
    .eq("id", accountId)
    .single();

  if (AccountUpdateError) {
    return { AccountUpdateError };
  }
}

export type NewTransaction = {
  user_id: string;
  account_id: string;
  amount: number;
  type: TransactionType;
  category: CategoryKey;
  input_method: Input_Method;
  description: string | null;
  date: string;
  voice_transcript: string | null;
};

export async function addTransaction(
  client: SupabaseClient,
  payload: NewTransaction,
) {
  const { data: newTransaction, error: transactionError } = await client
    .from("transactions")
    .insert(payload)
    .select()
    .single();
  if (transactionError) throw transactionError;

  const { data: accData, error: accError } = await client
    .from("accounts")
    .select("balance")
    .eq("id", payload.account_id)
    .single();
  if (accError) throw accError;

  const { error: AccountUpdateError } = await client
    .from("accounts")
    .update({
      balance:
        payload.type === "EXPENSE"
          ? accData.balance - payload.amount
          : accData.balance + payload.amount,
    })
    .eq("id", payload.account_id)
    .single();

  if (AccountUpdateError) {
    return { error: AccountUpdateError, data: null };
  }

  return { transaction: newTransaction as Transaction, error: null };
}
