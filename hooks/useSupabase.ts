import { useAuth } from "@clerk/expo";
import { useMemo, useRef } from "react";
import { createClerkSupabaseClient } from "../lib/supabase";

export const useSupabase = () => {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const client = useMemo(() => {
    return createClerkSupabaseClient(() => getTokenRef.current());
  }, []);
  return client;
};
