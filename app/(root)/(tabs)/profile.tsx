import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function profile() {
  const { signOut } = useAuth();
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 p-3">
      <Text>profile</Text>
      <TouchableOpacity
        className="w-full bg-brand-blue py-4 rounded-xl items-center"
        onPress={async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        }}
      >
        <Text className="text-white font-semibold text-base">Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
