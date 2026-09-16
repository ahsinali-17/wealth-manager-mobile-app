import { CategoryKey, getCategoryConfig } from "@/constants/transactions";
import { Transaction } from "@/lib/services/transactions";
import { formatAmount } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

export default function TransactionRow({
  transaction,
  onDelete = () => {},
}: {
  transaction: Transaction;
  onDelete?: () => void;
}) {
  const currency = useUserStore((s) => s.currency);
  const catConfig = getCategoryConfig(transaction["category"] as CategoryKey);
  const catMethodIcon: Record<string, keyof typeof Feather.glyphMap> = {
    MANUAL: "edit-3",
    VOICE: "mic",
    RECEIPT_SCAN: "camera",
  };

  let row = (
    <View
      className="flex-row items-center justify-between px-3 py-2 bg-white border-2 border-[#E8E6DF] rounded-2xl"
      style={{
        borderLeftColor: catConfig?.color,
      }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className={`items-center justify-center p-3`}
          style={{
            backgroundColor: `${catConfig?.color}25`,
            borderRadius: "50%",
          }}
        >
          <Text className="">{catConfig?.icon}</Text>
        </View>
        <View className="flex-col gap-1 justify-start">
          <Text className="text-brand-text font-semibold line-clamp-1 text-xl">
            {transaction?.description || catConfig?.label}
          </Text>
          <View className="flex-row items-center gap-3">
            <Feather
              name={catMethodIcon[transaction?.input_method] || "edit-3"}
              size={12}
              color={catConfig?.color}
            />
            <Text
              className={`px-2 py-1 rounded-2xl`}
              style={{
                backgroundColor: `${catConfig?.color}25`,
                color: catConfig?.color,
              }}
            >
              {` ${catConfig?.label}`}
            </Text>
          </View>
        </View>
      </View>
      <View>
        <Text
          className={`${catConfig?.type === "INCOME" ? "text-brand-success" : "text-red-500"}`}
        >
          {catConfig?.type === "INCOME" ? "+ " : "- "}
          {formatAmount(transaction?.amount ?? 0, currency)}
        </Text>
      </View>
    </View>
  );

  if (!onDelete) {
    return <View className="mb-3">{row}</View>;
  }

  return (
    <View className="mb-3">
      <ReanimatedSwipeable
        overshootLeft={false}
        renderRightActions={() => (
          <TouchableOpacity
            className="bg-red-500 w-1/2 h-full flex-1 justify-center items-center rounded-lg"
            onPress={onDelete}
          >
            <Text>Delete</Text>
          </TouchableOpacity>
        )}
      >
        {row}
      </ReanimatedSwipeable>
    </View>
  );
}
