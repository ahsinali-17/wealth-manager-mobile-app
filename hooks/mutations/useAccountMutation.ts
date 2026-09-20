import { useSupabase } from "@/hooks/useSupabase";
import {
    AccountType,
    createAccount,
    deleteAccount,
    updateAccount,
    updateDefaultAccount,
} from "@/lib/services/accounts";
import { useUser } from "@clerk/expo";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateAccountMutation() {
  const supabase = useSupabase();
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, type }: { name: string; type: AccountType }) =>
      createAccount(supabase, user?.id!, { name, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccountMutation() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      account_id,
      name,
      type,
    }: {
      account_id: string;
      name: string;
      type: AccountType;
    }) => updateAccount(supabase, account_id, { name, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateDefaultAccountMutation() {
  const supabase = useSupabase();
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ account_id }: { account_id: string }) =>
      updateDefaultAccount(supabase, user?.id!, account_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccountMutation() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      account_id,
      force = false,
    }: {
      account_id: string;
      force?: Boolean;
    }) => deleteAccount(supabase, account_id, { force }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
