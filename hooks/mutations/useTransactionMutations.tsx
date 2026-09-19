import { useSupabase } from "@/hooks/useSupabase";
import {
  addTransaction,
  deleteTransaction,
  NewTransaction,
  Transaction,
} from "@/lib/services/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteTransactionMutation() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      tx: Pick<Transaction, "id" | "account_id" | "amount" | "type">,
    ) => deleteTransaction(supabase, tx.id, tx.account_id, tx.amount, tx.type),
    onSuccess: (result) => {
      if (result) return alert("Something went wrong");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useAddTransactionMutation() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: NewTransaction) => addTransaction(supabase, payload),
    onSuccess: (result) => {
      if (result.error) return alert("Something went wrong");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
