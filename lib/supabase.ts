import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or anon key");
}

export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>,
) {
  return createClient(supabaseUrl!, supabaseKey!, {
    accessToken: async () => {
      try {
        const token = await getToken();
        return token ?? null;
      } catch (e) {
        return null;
      }
    },
  });
}
