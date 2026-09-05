import { useUserSync } from "@/hooks/useUserSync";
import { useUserStore } from "@/store/useUserStore";
import { useAuth } from "@clerk/expo";
import { Redirect, Slot, usePathname } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

export default function Layout() {
  const pathName = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const needsOnboarding = useUserStore((s) => s.needsOnboarding);
  const [minLoadDone, setMinLoadDone] = useState(false);
  useUserSync();
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadDone(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  if (!minLoadDone || needsOnboarding === null) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-body">
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  } else if (minLoadDone && needsOnboarding && pathName !== "/onboarding")
    return <Redirect href="/(root)/onboarding" />;
  return <Slot />;
}
