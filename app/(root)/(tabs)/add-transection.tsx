import { AIActionCard } from "@/components/AITransactionCard";
import CalenderPicker from "@/components/CalenderPicker";
import PillGroup from "@/components/PillGroup";
import ReceiptScannerModal from "@/components/ReceiptScannerModal";
import VoiceRecorderModal from "@/components/VoiceRecorderModal";
import { AI_GRADIENT } from "@/constants/theme";
import {
  CategoryKey,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/constants/transactions";
import { useAddTransactionMutation } from "@/hooks/mutations/useTransactionMutations";
import { useAccountsQuery } from "@/hooks/query/useAccountsQuery";
import {
  transactionFormValues,
  transactionSchema,
} from "@/lib/schemas/transaction";
import { Account } from "@/lib/services/accounts";
import {
  ExtractedTransaction,
  extractTransactionFromReciept,
} from "@/lib/services/extractTransaction";
import { Input_Method, TransactionType } from "@/lib/services/transactions";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid } from "date-fns";
import { useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_VALUES = (accounts: Account[]): transactionFormValues => {
  return {
    type: "EXPENSE",
    account_id: accounts[0]?.id,
    amount: "",
    category: "food",
    date: new Date(),
    description: "",
  };
};

export default function AddTransection() {
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams<{ action: string }>();

  const [isVoiceModalOpen, setisVoiceModalOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [error, seterror] = useState("");
  const [inputMethod, setInputMethod] = useState<Input_Method>("MANUAL");
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  const {
    data: accountsData = [],
    error: accountsError,
    isLoading: accountsLoading,
  } = useAccountsQuery();

  const { mutateAsync: addTransaction, isPending: saving } =
    useAddTransactionMutation();

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<transactionFormValues>({
    mode: "onBlur",
    defaultValues: DEFAULT_VALUES([]),
    resolver: zodResolver(transactionSchema),
  });

  const type = watch("type");
  const category = watch("category");
  const accountId = watch("account_id");
  const date = watch("date");

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const onSubmit = async (values: transactionFormValues) => {
    if (!user?.id) return;
    const { error } = await addTransaction({
      user_id: user.id,
      account_id: values.account_id,
      amount: parseFloat(values.amount.replace(/,/g, "")),
      type: values.type,
      category: values.category,
      input_method: inputMethod,
      description: values.description || "",
      date: date.toISOString().slice(0, 10),
      voice_transcript: voiceTranscript || "",
    });
    if (error) {
      seterror(error.message);
    } else {
      seterror("");
      reset(DEFAULT_VALUES(accountsData));
      setVoiceTranscript("");
      setInputMethod("MANUAL");
      router.push("/(root)/(tabs)/transections");
    }
  };

  const fillForm = (data: ExtractedTransaction) => {
    const categoryList =
      data.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const isValidCategory = (key: CategoryKey | null): key is CategoryKey =>
      !!key && categories.some((cat) => cat.key === key);

    if (data.type) setValue("type", data.type);
    if (data.amount) setValue("amount", data.amount.toString());
    if (isValidCategory(data.category)) setValue("category", data.category);
    if (data.description) setValue("description", data.description);
    if (data.date) {
      const parsed = new Date(data.date);
      if (isValid(parsed) && parsed <= new Date()) setValue("date", parsed);
    }

    const missing = [
      !isValidCategory(data.category) && "category",
      data.amount == null && "amount",
    ].filter(Boolean);
    if (missing.length > 0) {
      Alert.alert(
        "Confirm Transection",
        `AI couldn't read ${missing.join(",")}  from the receipt. Please enter manually.`,
      );
    }
  };

  const handleReciptCaptured = async (base64: string, mimeType: string) => {
    setScanning(true);
    setScannerOpen(false);
    try {
      const result = await extractTransactionFromReciept(base64, mimeType);
      fillForm(result);
      setInputMethod("RECEIPT_SCAN");
    } catch (e) {
      console.log(e);
      Alert.alert(
        "Error",
        "Couldn't read that receipt. Try again or enter it manually.",
      );
    } finally {
      setScanning(false);
    }
  };

  const handleVoiceExtract = (result: ExtractedTransaction) => {
    fillForm(result);
    setVoiceTranscript(result.transcript ?? "");
    setInputMethod("VOICE");
  };

  useEffect(() => {
    if (accountsData.length > 0) reset(DEFAULT_VALUES(accountsData));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <View className="px-4 pt-3 pb-2">
        <Text className="text-xl text-brand-bg font-semibold">
          Add Transection
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "height" : "padding"}
        className="flex-1"
      >
        {accountsLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color={"#000"} size={32} />
          </View>
        ) : accountsError ? (
          <View className="flex-1 justify-center items-center">
            <Feather name="alert-circle" size={32} className="mb-2" />
            <Text>Error fetching accounts data. {accountsError.message}</Text>
          </View>
        ) : accountsData.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text>You need an account to add a transaction.</Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 100,
              paddingHorizontal: 16,
            }}
          >
            {/* input method cards */}
            <View className="flex-row gap-2 mb-3">
              <AIActionCard
                colors={AI_GRADIENT}
                icon="camera"
                onPress={() => setScannerOpen(true)}
                subtitle="Snap a Photo"
                title="Scan Receipt"
              />

              <AIActionCard
                colors={AI_GRADIENT}
                icon="mic"
                onPress={() => setisVoiceModalOpen(true)}
                subtitle="Voice log"
                title="Say your Finance"
              />
            </View>

            <View className="flex-row  items-center justify-center gap-3 mb-3 ">
              {["INCOME", "EXPENSE"].map((i) => {
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => {
                      setValue("type", i as TransactionType);
                      setValue(
                        "category",
                        i === "INCOME"
                          ? INCOME_CATEGORIES[0].key
                          : EXPENSE_CATEGORIES[0].key,
                      );
                    }}
                    className={`flex-1 rounded-xl ${type === i ? "bg-black" : "bg-white"} border border-brand-text-secondary py-2`}
                  >
                    <Text
                      className={`font-semibold text-lg ${type === i ? "text-white" : "text-black"} text-center`}
                    >
                      {i.charAt(0).toUpperCase() + i.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View className="mb-3">
              <Text className="text-lg  text-brand-bg mb-2 font-semibold">
                Amount
              </Text>

              <Controller
                control={control}
                name="amount"
                render={({ field: { value, onBlur, onChange } }) => (
                  <TextInput
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      onChange(text);
                    }}
                    placeholder="0"
                    keyboardType="numeric"
                    value={value}
                    className="rounded-xl bg-white border border-brand-surface px-3 py-1.5 text-lg"
                  />
                )}
              />
              {errors.amount && (
                <Text className="text-red-500">{errors.amount.message}</Text>
              )}
            </View>

            <View className="mb-3">
              <Text className="text-lg  text-brand-bg mb-2 font-semibold">
                Category
              </Text>

              <PillGroup
                elements={categories.map((c) => {
                  return {
                    key: c.key,
                    label: c.label,
                    icon: c.icon,
                  };
                })}
                currentValue={category}
                onChange={(key) => setValue("category", key as CategoryKey)}
                scrollable={true}
              />
            </View>

            <View className="mb-3">
              <Text className="text-lg  text-brand-bg mb-2 font-semibold">
                Account (select manually)
              </Text>

              <PillGroup
                elements={accountsData.map((acc) => {
                  return {
                    key: acc.id,
                    label: acc.name,
                  };
                })}
                currentValue={accountId}
                onChange={(key) => setValue("account_id", key)}
                scrollable={true}
              />
              {errors.account_id && (
                <Text className="text-red-500">
                  {errors.account_id.message}
                </Text>
              )}
            </View>

            <View className="mb-3">
              <Text className="text-lg  text-brand-bg mb-2 font-semibold">
                Date
              </Text>

              <TouchableOpacity
                onPress={() => setDatePickerOpen(!datePickerOpen)}
                className="rounded-xl bg-white border border-brand-surface px-3 py-1.5 text-lg flex-row items-center justify-between"
              >
                <Text className="text-xl text-brand-bg font-semibold">
                  {format(date, "d MMM, yyyy")}
                </Text>
                <Feather name="calendar" size={12} color={"gray"} />
              </TouchableOpacity>
              {datePickerOpen && (
                <View className="bg-white border border-[#E8E6DF] rounded-xl mb-4 overflow-hidden">
                  <CalenderPicker
                    value={date}
                    maximumDate={new Date()}
                    onChange={(selectedDate) => {
                      setValue("date", selectedDate);
                      setDatePickerOpen(false);
                    }}
                  />
                </View>
              )}
            </View>
            {!datePickerOpen && (
              <View>
                <Text className="text-lg  text-brand-bg mb-2 font-semibold">
                  Discription (Optional)
                </Text>

                <Controller
                  control={control}
                  name="description"
                  render={({ field: { value, onBlur, onChange } }) => (
                    <TextInput
                      onBlur={onBlur}
                      onChangeText={(text) => {
                        onChange(text);
                      }}
                      placeholder="e.g: insurance premium"
                      keyboardType="default"
                      value={value}
                      className="rounded-xl bg-white border border-brand-surface px-3 py-1.5 text-lg"
                    />
                  )}
                />
              </View>
            )}
            {error && <Text className="text-red-500">{error}</Text>}

            <TouchableOpacity
              className="bg-brand-bg rounded-xl px-4 py-3 mt-4"
              onPress={handleSubmit(onSubmit)}
            >
              <Text className="text-white text-xl font-semibold text-center">
                {saving ? "Saving Transaction..." : "Save Transaction"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {scanning && (
        <View className="absolute inset-0 bg-brand-bg/40 items-center justify-center rounded-xl border border-brand-body px-5 py-3">
          <ActivityIndicator size={"large"} className="text-brand-body" />
          <Text className="text-lg text-brand-body font-semibold">
            Scanning...
          </Text>
        </View>
      )}

      <ReceiptScannerModal
        onClose={() => setScannerOpen(false)}
        visible={scannerOpen}
        onCapture={handleReciptCaptured}
      />

      <VoiceRecorderModal
        visible={isVoiceModalOpen}
        onClose={() => setisVoiceModalOpen(false)}
        onExtract={handleVoiceExtract}
      />
    </SafeAreaView>
  );
}
