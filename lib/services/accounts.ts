import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountType = "CASH" | "SAVINGS" | "WALLET" | "CREDIT_CARD";

export type Account = {
  id: string;
  user_id: string;
  balance: number;
  name: string;
  type: AccountType;
  is_default: boolean;
  created_at: string;
};

export async function getAccounts(client: SupabaseClient, user_id: string) {
  const { data: accountsData, error: accountsError } = await client
    .from("accounts")
    .select("*")
    .eq("user_id", user_id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (accountsError) throw accountsError;
  return (accountsData as Account[]) || [];
}
