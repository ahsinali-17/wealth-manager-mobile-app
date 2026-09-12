import { COLORS } from "@/constants/theme";
import { useBudgetMutation } from "@/hooks/mutations/useBudgetMutations";
import { Budget } from "@/lib/services/budgets";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import FormSheetModal from "./FormSheetModal";

export default function BudgetModal({
  onSave,
  onClose,
  visible,
  budget,
}: {
  onSave: () => void;
  onClose: () => void;
  visible: boolean;
  budget: Budget | null;
}) {
  const [amount, setAmount] = useState(budget?.amount.toString() || "");
  const [error, setError] = useState("");

  const { mutateAsync, isPending } = useBudgetMutation();

  const handleSave = async () => {
    setError("");
    if (amount.trim() === "") {
      setError("Amount is required");
      return;
    }
    try {
      await mutateAsync(parseFloat(amount.replace(/,/g, "")));
      onSave();
    } catch (error) {
      console.log(error);
      setError("Failed to save budget");
    }
  };

  useEffect(() => {
    if (budget) {
      setAmount(budget.amount.toString());
    }
  }, [budget]);

  return (
    <FormSheetModal
      title={budget ? "Edit Budget" : "Add Budget"}
      visible={visible}
      onClose={onClose}
    >
      <Text className="text-brand-bg text-lg font-semibold">Budget Amount</Text>

      <TextInput
        style={{
          backgroundColor: "#fff",
          padding: 10,
          borderRadius: 10,
        }}
        placeholder="e.g. 50000"
        placeholderTextColor={COLORS.placeholder}
        keyboardType="numeric"
        autoFocus
        value={amount}
        onChangeText={(text) => {
          setAmount(text);
        }}
      />

      {error && <Text className="text-red-500 my-2">{error}</Text>}

      <TouchableOpacity
        onPress={handleSave}
        disabled={isPending}
        className="w-full bg-brand-bg py-4 rounded-xl items-center my-4"
      >
        <Text className="text-brand-body text-base font-semibold">
          {isPending ? "Saving..." : "Save"}
        </Text>
      </TouchableOpacity>
    </FormSheetModal>
  );
}
