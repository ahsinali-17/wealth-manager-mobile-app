import AccountModal from "@/components/accountModal";
import {
  ALL_CURRENCIES,
  Currency,
  CurrencyPicker,
} from "@/components/currencyPicker";
import { useUpdateDefaultAccountMutation } from "@/hooks/mutations/useAccountMutation";
import { useAccountsQuery } from "@/hooks/query/useAccountsQuery";
import { useSupabase } from "@/hooks/useSupabase";
import { Account, AccountType } from "@/lib/services/accounts";
import { useUserStore } from "@/store/useUserStore";
import { useAuth, useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

const AccountIcons: Record<AccountType, keyof typeof Feather.glyphMap> = {
  BANK: "home",
  CREDIT_CARD: "credit-card",
  CASH: "dollar-sign",
  SAVINGS: "shield",
};

const label = `text-brand-text-secondary font-semibold text-lg mb-4`;

const Row = ({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  isDanger,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  isDanger?: boolean;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center justify-between bg-white px-4 py-3"
    >
      <View className="flex-row items-center gap-x-3">
        <View
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isDanger ? "bg-red-100" : "bg-brand-text-secondary/10"
          }`}
        >
          <Feather
            name={icon}
            size={20}
            color={isDanger ? "#dc2626" : "#000"}
          />
        </View>
        <Text
          className={`font-semibold ${isDanger ? "text-red-500" : "text-brand-surface"}`}
        >
          {label}
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        {value && <Text className="font-normal text-brand-bg">{value}</Text>}
        {showChevron && onPress && (
          <Feather name="chevron-right" size={20} color={"#BDC3C7"} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function profile() {
  const { signOut } = useAuth();
  const router = useRouter();
  const { user } = useUser();

  const currency = useUserStore((s) => s.currency);
  const setCurrency = useUserStore((s) => s.setCurrency);
  const supabase = useSupabase();

  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(
    ALL_CURRENCIES.find((c) => c.code === currency) ?? ALL_CURRENCIES[0],
  );

  const {
    data: accounts = [],
    isError: accountsError,
    isLoading: isLoadingAccounts,
  } = useAccountsQuery();
  const { mutateAsync: updateDefaultAccount, isPending } =
    useUpdateDefaultAccountMutation();

  const handleAvatarUpload = async () => {
    if (!user) return;
    try {
      const grant = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!grant.granted)
        return Alert.alert(
          "Permission denied",
          "Access to image library is required.",
        );

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setUpdatingAvatar(true);

      const asset = result.assets[0];
      if (!asset.base64) {
        throw new Error("Could not process selected image base64 data.");
      }

      const mimeType = asset.mimeType ?? "image/jpeg";
      const base64Image = `data:${mimeType};base64,${asset.base64}`;

      await user.setProfileImage({
        file: base64Image,
      });

      Alert.alert("Success", "Profile image updated successfully!");
    } catch (error: any) {
      console.error("Failed to update profile image:", error);
      Alert.alert(
        "Upload Error",
        error?.message || "Failed to update profile image. Please try again.",
      );
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleSetDefault = async (account: Account) => {
    if (!editingAcc) return;
    try {
      await updateDefaultAccount({ account_id: account.id });
      setEditingAcc(null);
      setAccountModalOpen(false);
    } catch (e: any) {
      console.error("Failed to update default account:", e);
      Alert.alert(
        "Error",
        "Failed to update default account. Please try again.",
      );
    }
  };

  const updateCurrency = async (currency: Currency) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({ currency: currency.code })
        .eq("clerk_id", user?.id);
      if (error) {
        throw error;
      }
      setSelectedCurrency(currency);
      setCurrency(currency.code);
      setShowCurrencyPicker(false);
    } catch (e: any) {
      console.error("Failed to update default account:", e);
      Alert.alert("Error", "Failed to update currency. Please try again.");
    }
  };
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
    <SafeAreaView edges={["top"]} className="flex-1 p-3 bg-brand-body">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="px-4 py-3">
          <Text className="text-xl text-brand-bg font-semibold">Profile</Text>
        </View>

        <View className="bg-brand-bg rounded-xl border border-brand-body py-4 justify-center items-center">
          <View className="bg-black rounded-full border-2 overflow-hidden border-brand-body w-24 h-24 justify-center items-center">
            {updatingAvatar ? (
              <ActivityIndicator size={18} color={"#fff"} />
            ) : user?.hasImage && user?.imageUrl ? (
              <Image
                source={{ uri: user?.imageUrl }}
                style={{ width: 100, height: 100 }}
                className="object-contain"
              />
            ) : (
              <Feather name="user" size={30} color={"#fff"} />
            )}
            <TouchableOpacity
              onPress={handleAvatarUpload}
              className="z-5 absolute bottom-0 bg-brand-bg/60 rounded-full w-full h-6 p-1 justify-center items-center"
            >
              <Feather name="edit" size={10} color={"#fff"} />
            </TouchableOpacity>
          </View>

          <Text className="text-brand-body mt-3 font-semibold text-xl">
            {user?.firstName + " "} {user?.lastName}
          </Text>
          <Text className="text-brand-text-secondary mt-0.5 text-sm">
            {user?.emailAddresses[0].emailAddress}
          </Text>
        </View>

        <View className="mt-8">
          <Text className={`${label}`}>ACCOUNTS</Text>

          <View className="rounded-2xl overflow-hidden border border-brand-text-secondary">
            {isLoadingAccounts ? (
              <View className="flex items-center justify-center bg-brand-bg rounded-xl p-4">
                <ActivityIndicator size={20} color={"#000"} />
              </View>
            ) : accountsError ? (
              <View className="flex items-center justify-center bg-brand-bg rounded-xl p-4">
                <Text className="text-brand-text-secondary text-center">
                  Failed to load accounts
                </Text>
              </View>
            ) : accounts.length === 0 ? (
              <View className="flex items-center justify-center bg-brand-bg rounded-xl p-4">
                <Text className="text-brand-text-secondary text-center">
                  No accounts found
                </Text>
              </View>
            ) : (
              accounts.map((account) => (
                <Row
                  key={account.id}
                  icon={AccountIcons[account.type]}
                  label={
                    account.name + " " + (account.is_default ? "(default)" : "")
                  }
                  value={account.balance.toString()}
                  onPress={() => {
                    setAccountModalOpen(true);
                    setEditingAcc(account);
                  }}
                />
              ))
            )}

            <Row
              icon="plus-circle"
              label="Add new account"
              onPress={() => {
                setAccountModalOpen(true);
                setEditingAcc(null);
              }}
            />
          </View>
        </View>

        <View className="mt-8">
          <Text className={`${label}`}>PREFERENCES</Text>
          <View className="rounded-2xl overflow-hidden border border-brand-text-secondary">
            <Row
              icon="dollar-sign"
              label="Currency"
              onPress={() => setShowCurrencyPicker(true)}
              value={selectedCurrency.code + " "}
            />
          </View>
        </View>

        <View className="mt-8">
          <Text className={`${label}`}>USER ACTIONS</Text>

          <View className="rounded-2xl overflow-hidden border border-brand-text-secondary">
            <Row
              icon="log-out"
              label="Signout"
              isDanger={true}
              onPress={handleSignOut}
            />
          </View>
        </View>
      </ScrollView>

      <AccountModal
        visible={accountModalOpen}
        onClose={() => {
          setAccountModalOpen(false);
          setEditingAcc(null);
        }}
        account={editingAcc}
        onSetDefault={handleSetDefault}
      />

      <CurrencyPicker
        showCurrencyPicker={showCurrencyPicker}
        selectedCurrency={selectedCurrency}
        onSelect={updateCurrency}
        onClose={() => setShowCurrencyPicker(false)}
      />
    </SafeAreaView>
  );
}
