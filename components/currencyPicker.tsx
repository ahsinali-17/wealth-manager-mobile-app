import { Feather } from "@expo/vector-icons";
import cc from "currency-codes";
import getSymbol from "currency-symbol-map";
import { useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export const ALL_CURRENCIES: Currency[] = cc
  .codes()
  .map((c) => {
    return {
      code: c,
      name: cc.code(c)?.currency ?? c,
      symbol: getSymbol(c) ?? c,
    };
  })
  .filter((currency) => currency.code !== currency.symbol);

export function CurrencyPicker({
  showCurrencyPicker,
  onSelect,
  onClose,
  selectedCurrency,
}: {
  showCurrencyPicker: boolean;
  onSelect: (currency: Currency) => void;
  selectedCurrency: Currency;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filteredCurrencies = useMemo(() => {
    if (!search.toLowerCase()) return ALL_CURRENCIES;
    return ALL_CURRENCIES.filter(
      (currency) =>
        currency.code.toLowerCase().includes(search.toLowerCase()) ||
        currency.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search]);

  return (
    <Modal
      animationType="slide"
      visible={showCurrencyPicker}
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-brand-body">
        <View className="flex-row justify-between items-center gap-5 mb-6 p-3">
          <TextInput
            className="flex-1 bg-white border  border-brand-surface-border rounded-xl px-4 py-3 text-brand-bg text-base"
            value={search}
            onChangeText={setSearch}
            placeholder="Search currency"
            placeholderTextColor="#8A8D96"
            autoFocus
          />
          <TouchableOpacity onPress={onClose}>
            <Text>Close</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredCurrencies}
          keyExtractor={(item) => item.code}
          automaticallyAdjustContentInsets={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 20,
          }}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                }}
                className="py-2 flex-row justify-between items-center  border-b border-brand-surface-border"
              >
                <Text className="text-brand-bg text-base">
                  {item.symbol + "  " + item.code + " " + item.name}
                </Text>
                {selectedCurrency.code === item.code && (
                  <Feather name="check" size={24} color="black" />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
