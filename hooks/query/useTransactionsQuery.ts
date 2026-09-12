import { queryKeys } from "@/lib/query/keys";
import {
  getTransactions,
  Transaction_Filter,
} from "@/lib/services/transactions";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "../useSupabase";

const DEFAULT_FILTER: Transaction_Filter = {};

export function useTransactionsQuery(filter: Transaction_Filter = DEFAULT_FILTER) {
  const supabase = useSupabase();
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.transactions(user?.id!, filter),
    queryFn: () => getTransactions(supabase, user?.id!, filter),
    enabled: !!user?.id, //for safety
  });
}
