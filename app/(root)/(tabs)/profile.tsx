import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function profile() {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel", onPress: () => {} },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };
  return (
    <SafeAreaView className="flex-1 p-3">
      <Text>profile</Text>
      <TouchableOpacity
        className="w-full bg-brand-blue py-4 rounded-xl items-center"
        onPress={handleSignOut}
      >
        <Text className="text-white font-semibold text-base">Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
