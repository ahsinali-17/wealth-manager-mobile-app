import type { SupabaseClient } from "@supabase/supabase-js";

export type Budget = {
  id: string;
  user_id: string;
  amount: number;
  last_alert_sent: string;
  created_at: string;
  updated_at: string;
};

export async function getBudgets(client: SupabaseClient, user_id: string) {
  const { data, error } = await client
    .from("budgets")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) throw error;
  return (data as Budget) || null;
}

export async function upsertBudget(
  client: SupabaseClient,
  user_id: string,
  amount: number,
) {
  const { data, error } = await client
    .from("budgets")
    .upsert({ user_id, amount }, { onConflict: "user_id" })
    .select()
    .single();
  if (error) throw error;
  return data as Budget;
}
