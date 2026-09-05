import { ALL_CURRENCIES, CurrencyPicker } from "@/components/currencyPicker";
import { useSupabase } from "@/hooks/useSupabase";
import {
  OnboardingFormValue,
  onboardingSchema,
} from "@/lib/schemas/onboarding";
import { useUserStore } from "@/store/useUserStore";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Onboarding() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState(
    ALL_CURRENCIES.find((c) => c.code === "PKR") ?? ALL_CURRENCIES[0],
  );
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const router = useRouter();
  const authSupabase = useSupabase();
  const { user } = useUser();
  const setNeedsOnBoarding = useUserStore((state) => state.setNeedsOnboarding);
  const setCurrency = useUserStore((state) => state.setCurrency);

  const {
    control: onboardingControl,
    handleSubmit: onboardingHandleSubmit,
    formState: { errors: onboardingErrors },
  } = useForm<OnboardingFormValue>({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: { balance: "" },
  });

  const onSavePress = async (values: OnboardingFormValue) => {
    setIsLoading(true);
    const { error: userError } = await authSupabase
      .from("users")
      .update({ currency: selectedCurrency.code })
      .eq("clerk_id", user?.id);

    if (userError) {
      setError(userError.message);
      setIsLoading(false);
      return;
    }

    const { data: accountsData, error: accountsError } = await authSupabase
      .from("accounts")
      .select("id, balance")
      .eq("user_id", user?.id)
      .eq("is_default", true)
      .single();

    if (accountsError) {
      setError(accountsError.message);
      setIsLoading(false);
      return;
    }

    const { error: transectionError } = await authSupabase
      .from("transections")
      .insert({
        user_id: user?.id,
        account_id: accountsData?.id,
        amount: parseFloat(values.balance.replace(/,/g, "")),
        type: "INCOME",
        category: "OTHER",
        description: "Opening Balance",
        date: new Date().toISOString(),
        input_method: "MANUAL",
      });

    if (transectionError) {
      setError(transectionError.message);
      setIsLoading(false);
      return;
    }

    const { error: updatedAccountError } = await authSupabase
      .from("accounts")
      .update({
        balance:
          accountsData?.balance + parseFloat(values.balance.replace(/,/g, "")),
      })
      .eq("id", accountsData?.id)
      .select()
      .single();

    if (updatedAccountError) {
      setError(updatedAccountError.message);
      setIsLoading(false);
      return;
    }

    setCurrency(selectedCurrency.code);
    setNeedsOnBoarding(false);
    setIsLoading(false);
    router.replace("/(root)/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <View className="-mt-16">
            <Image
              source={require("../../assets/images/welth.png")}
              className="w-36 h-16 mb-8"
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-[#1A1D26] mb-2 leading-tight">
              Let's get you set up.
            </Text>
            <Text className="text-brand-text-muted text-base mb-8">
              A couple of quick questions to personalise your experience.
            </Text>

            <Text className="text-brand-bg mb-2">Balance</Text>
            <View className="bg-white border border-[#E8E6DF] rounded-xl flex-row gap-3 items-center px-4 mb-8">
              <Text className="text-brand-text-secondary">
                {selectedCurrency.symbol}
              </Text>
              <Controller
                control={onboardingControl}
                name="balance"
                render={({ field: { value, onChange } }) => {
                  return (
                    <TextInput
                      className="flex-1 text-brand-bg py-3"
                      placeholder="e.g. 50000"
                      placeholderTextColor="#8A8D96"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="numeric"
                      returnKeyType="done"
                    />
                  );
                }}
              />
            </View>
            {onboardingErrors.balance && (
              <Text className="text-brand-coral mb-4 text-sm">
                {onboardingErrors.balance.message}
              </Text>
            )}

            <Text className="text-brand-bg mb-2">Currency</Text>
            <TouchableOpacity
              onPress={() => setShowCurrencyPicker(true)}
              className="bg-white border border-[#E8E6DF] rounded-xl px-4 py-3 flex-row gap-3 items-center justify-between mb-8"
            >
              <Text className="text-brand-text-secondary text-base font-semibold">
                {selectedCurrency.symbol + "  "} {selectedCurrency.code + ""}-
                {" " + selectedCurrency.name}
              </Text>
              <Feather name="chevron-down" size={24} color="black" />
            </TouchableOpacity>

            {error && (
              <Text className="text-brand-coral mb-4 text-sm">{error}</Text>
            )}

            <TouchableOpacity
              onPress={onboardingHandleSubmit(onSavePress)}
              disabled={isLoading}
              className="w-full bg-brand-blue py-4 rounded-xl items-center mb-4"
            >
              <Text className="text-white font-semibold text-base">
                {isLoading ? "Saving" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <CurrencyPicker
        showCurrencyPicker={showCurrencyPicker}
        selectedCurrency={selectedCurrency}
        onSelect={(currency) => {
          setSelectedCurrency(currency);
          setShowCurrencyPicker(false);
        }}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </SafeAreaView>
  );
}
