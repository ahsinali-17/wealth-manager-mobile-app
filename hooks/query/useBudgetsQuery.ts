import { queryKeys } from "@/lib/query/keys";
import { getBudgets } from "@/lib/services/budgets";
import { useUser } from "@clerk/expo";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "../useSupabase";

export function useBudgetsQuery() {
  const supabase = useSupabase();
  const { user } = useUser();

  return useQuery({
    queryKey: queryKeys.budgets(user?.id!),
    queryFn: () => getBudgets(supabase, user?.id!),
    enabled: !!user?.id, //for safety
  });
}
