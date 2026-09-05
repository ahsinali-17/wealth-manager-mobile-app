import { useUserStore } from "@/store/useUserStore";
import { useUser } from "@clerk/expo";
import { useEffect } from "react";
import { useSupabase } from "./useSupabase";

export const useUserSync = () => {
  const { user } = useUser();
  const setCurrency = useUserStore((s) => s.setCurrency);
  const setNeedsOnboarding = useUserStore((s) => s.setNeedsOnboarding);
  const authSupabase = useSupabase();

  useEffect(() => {
    async function syncUser() {
      try {
        const { data: userData, error: userError } = await authSupabase
          .from("users")
          .select("clerk_id, currency")
          .eq("clerk_id", user?.id)
          .single();

        if (userError && userError?.code !== "PGRST116") {
          console.log("Error fetching user data: ", userError);
          setNeedsOnboarding(true);
          return;
        }

        if (userData) {
          setCurrency(userData.currency ?? "PKR");
          setNeedsOnboarding(!userData.currency);
          return;
        }

        const userEmail = user?.emailAddresses[0].emailAddress;

        const { data: NewUserData, error: NewUserError } = await authSupabase
          .from("users")
          .upsert(
            {
              clerk_id: user?.id,
              email: userEmail,
              name: user?.firstName?.trim() + " " + user?.lastName?.trim(),
              image_url: user?.hasImage ? user?.imageUrl : "",
            },
            { onConflict: "clerk_id", ignoreDuplicates: false },
          )
          .select("currency")
          .single();

        if (NewUserError) {
          console.log("Error creating new user: ", NewUserError);
          setNeedsOnboarding(true);
          return;
        }

        const { error: accountError } = await authSupabase
          .from("accounts")
          .insert({
            user_id: user?.id,
            name: "cash",
            type: "CASH",
            balance: 0,
            is_default: true,
          })
          .select("*")
          .single();

        if (accountError) {
          console.log("Error creating account: ", accountError);
        }

        setCurrency(NewUserData?.currency ?? "PKR");
        setNeedsOnboarding(!NewUserData?.currency);
      } catch (err) {
        console.log("Error syncing user: ", err);
        setNeedsOnboarding(true);
      }
    }
    syncUser();
  }, [user?.id]);
};
