import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountType = "CASH" | "SAVINGS" | "BANK" | "CREDIT_CARD";

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

export async function createAccount(
  client: SupabaseClient,
  user_id: string,
  { name, type }: { name: string; type: AccountType },
) {
  const { data: accountsData, error: accountsError } = await client
    .from("accounts")
    .insert({ user_id, name, type, is_default: false, balance: 0 })
    .select()
    .single();

  if (accountsError) throw accountsError;
  return accountsData as Account;
}

export async function updateAccount(
  client: SupabaseClient,
  account_id: string,
  { name, type }: { name: string; type: AccountType },
) {
  const { data: accountsData, error: accountsError } = await client
    .from("accounts")
    .update({ name, type })
    .eq("id", account_id)
    .select()
    .single();

  if (accountsError) throw accountsError;
  return accountsData as Account;
}

export async function updateDefaultAccount(
  client: SupabaseClient,
  user_id: string,
  account_id: string,
) {
  const { error: accountsError } = await client
    .from("accounts")
    .update({ is_default: false })
    .eq("user_id", user_id)
    .neq("id", account_id);

  if (accountsError) throw accountsError;

  const { data: updateData, error: updateError } = await client
    .from("accounts")
    .update({ is_default: true })
    .eq("id", account_id)
    .select()
    .single();
  if (updateError) throw updateError;
  return updateData as Account;
}

export async function deleteAccount(
  client: SupabaseClient,
  account_id: string,
  { force = false }: { force?: Boolean },
) {
  const { count, error: countError } = await client
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account_id);

  if (countError) throw countError;

  const transactionCount = count ?? 0;

  if (!force && transactionCount > 0) {
    return { deleted: false, transactionCount };
  }

  if (force && transactionCount > 0) {
    const { error: txDeleteError } = await client
      .from("transactions")
      .delete()
      .eq("account_id", account_id);
    if (txDeleteError) throw txDeleteError;
  }

  const { error } = await client.from("accounts").delete().eq("id", account_id);

  if (error) throw error;

  return { deleted: true, transactionCount };
}
