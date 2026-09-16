import { useSupabase } from "@/hooks/useSupabase";
import { deleteTransaction, Transaction } from "@/lib/services/transactions";
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
      else alert("Transaction deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
