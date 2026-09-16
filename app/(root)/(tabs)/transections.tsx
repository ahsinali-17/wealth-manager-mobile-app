import TransactionRow from "@/components/TransactionRow";
import { useDeleteTransactionMutation } from "@/hooks/mutations/useTransactionMutations";
import { useAccountsQuery } from "@/hooks/query/useAccountsQuery";
import { useTransactionsQuery } from "@/hooks/query/useTransactionsQuery";
import { Transaction, TransactionType } from "@/lib/services/transactions";
import { exportToCSV } from "@/lib/utils";
import { Feather } from "@expo/vector-icons";
import { eachDayOfInterval, format, startOfDay, startOfMonth } from "date-fns";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  RefreshControl,
  ScrollView,
  TextInput,
} from "react-native-gesture-handler";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTERS = ["All", "Income", "Expense"] as const;

const dayKey = (d: Date) => {
  return format(d, "yyyy-MM-dd");
};

const currentMonthDays = () => {
  const today = startOfDay(new Date());
  return eachDayOfInterval({
    start: startOfMonth(today),
    end: today,
  }).map((d) => ({ key: dayKey(d), label: format(d, "dd MMM") }));
};

export default function transections() {
  const router = useRouter();

  let [activeFilter, setActiveFilter] =
    useState<(typeof FILTERS)[number]>("All");
  let [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  let [search, setSearch] = useState<string>("");
  let [exporting, setExporting] = useState<boolean>(false);

  const capitalizedFilter: TransactionType | null =
    activeFilter === "Income"
      ? "INCOME"
      : activeFilter === "Expense"
        ? "EXPENSE"
        : null;

  const {
    data: transactionData = [],
    refetch: transactionRefetch,
    isLoading: isTransactionLoading,
    isRefetching: isTransactionRefetching,
    error: transactionError,
  } = useTransactionsQuery({
    type: capitalizedFilter,
    accountId: activeAccountId,
  });

  const { data: accountsData = [], refetch: accountsRefetch } =
    useAccountsQuery();

  const { mutateAsync: deleteTransaction, isPending } =
    useDeleteTransactionMutation();

  const loading = isTransactionLoading || isPending;
  const refetching = isTransactionRefetching;
  let error = transactionError;

  const loadData = () => {
    try {
      transactionRefetch();
      accountsRefetch();
    } catch (err) {
      error = err as Error;
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const { count, uri } = await exportToCSV(transactionData);
      if (count == 0) {
        Alert.alert("No transactions to export");
      } else {
        Alert.alert(`Exported ${count} transactions`);
      }
    } catch (error) {
      Alert.alert("Failed to export transactions");
      console.log("Error: ", error);
    } finally {
      setExporting(false);
    }
  };
  const handleDelete = async (tx: Transaction) => {
    if (!tx) return;
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete ${tx.id}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteTransaction(tx);
            } catch (error) {
              Alert.alert("Failed to delete transaction");
              console.log("Error: ", error);
            }
          },
        },
      ],
    );
  };

  let filteredTransactions = useMemo(() => {
    if (search.length == 0) {
      return transactionData;
    }
    return transactionData.filter((tr) => {
      tr?.description?.toLowerCase().includes(search.toLowerCase()) ||
        tr.category?.toLowerCase().includes(search.toLowerCase());
    });
  }, [search, transactionData]);

  const dailyIncomeExpense = useMemo(() => {
    const days = currentMonthDays();
    return days.flatMap(({ key, label }) => {
      const income = transactionData
        .filter(
          (tx) => tx.type === "INCOME" && dayKey(new Date(tx.date)) === key,
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      const expense = transactionData
        .filter(
          (tx) => tx.type === "EXPENSE" && dayKey(new Date(tx.date)) === key,
        )
        .reduce((sum, tx) => sum + tx.amount, 0);
      return [
        { value: income, label, frontColor: "#3DDC84" },
        { value: expense, frontColor: "#FF6B4A" },
      ];
    });
  }, [transactionData]);

  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <View className="px-4 py-3">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-xl text-brand-surface text-bold">
            Transactions
          </Text>

          <TouchableOpacity
            onPress={handleExport}
            disabled={exporting}
            className="w-9 h-9 border border-brand-text-secondary flex items-center justify-center rounded-full bg-white p-2"
          >
            {exporting ? (
              <ActivityIndicator color={"black"} />
            ) : (
              <Feather name="download" size={14} color={"black"} />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center py-0.5 px-4 mb-3 border border-brand-text-secondary rounded-full">
          <Feather name="search" size={14} color={"#000"} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={"#3d3c3c"}
            className="text-black flex-1 pl-3 outline-none"
            onChangeText={setSearch}
            value={search}
            keyboardType="default"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={14} color={"#000"} />
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row justify-start items-center gap-2 mb-3">
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              className={`border flex items-center justify-center rounded-full px-3 py-1 ${activeFilter === f ? "bg-black border-brand-body" : "bg-white border-brand-text-secondary"}`}
            >
              <Text
                className={`text-xs ${activeFilter === f ? "text-white" : "text-black"}`}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={{ marginBottom: 12 }}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <View className="flex-row justify-start items-center gap-2">
            <TouchableOpacity
              onPress={() => setActiveAccountId(null)}
              className={`border flex items-center justify-center rounded-full px-3 py-1 ${activeAccountId === null ? "bg-black border-brand-body" : "bg-white border-brand-text-secondary"}`}
            >
              <Text
                className={`text-xs ${activeAccountId === null ? "text-white" : "text-black"}`}
              >
                All
              </Text>
            </TouchableOpacity>
            {accountsData?.map((acc) => (
              <TouchableOpacity
                key={acc.id}
                onPress={() => setActiveAccountId(acc.id)}
                className={`border flex items-center justify-center rounded-full px-3 py-1 ${activeAccountId === acc.id ? "bg-black border-brand-body" : "bg-white border-brand-text-secondary"}`}
              >
                <Text
                  className={`text-xs ${activeAccountId === acc.id ? "text-white" : "text-black"}`}
                >
                  {acc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator
          size={28}
          color={"black"}
          className="mx-auto my-10"
        />
      ) : error ? (
        <View className="flex-1 justify-center items-center gap-2">
          <Feather name="alert-circle" size={24} color={"red"} />
          <Text>Error: Unable to load transactions</Text>
          <TouchableOpacity onPress={loadData} className="p-1 px-4">
            <Text className="text-blue-500 text-xs">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionRow
              key={item.id}
              transaction={item}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl refreshing={refetching} onRefresh={loadData} />
          }
          ListHeaderComponent={
            transactionData.length > 0 ? (
              <View className="bg-white roundd-2xl px-3 py-2 mb-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-semibold text-brand-bg">
                    Daily Income vs Expense
                  </Text>
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center">
                      <View className="h-3 w-3 bg-brand-success rounded-full mr-1"></View>
                      <Text className="text-xs text-brand-text-secondary">
                        Income
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="h-3 w-3 bg-brand-coral rounded-full mr-1"></View>
                      <Text className="text-xs text-brand-text-secondary">
                        Expense
                      </Text>
                    </View>
                  </View>
                </View>

                <BarChart
                  data={dailyIncomeExpense}
                  width={Math.max(dailyIncomeExpense.length * 9, 280)}
                  height={120}
                  barWidth={6}
                  spacing={4}
                  hideYAxisText={false}
                  yAxisTextStyle={{ fontSize: 8, color: "#8aea7b" }}
                  rulesColor="#8c8e84"
                  noOfSections={3}
                  xAxisLabelTextStyle={{ color: "#8A8D96", fontSize: 7 }}
                  isThreeD={false}
                  roundedTop
                />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center gap-2">
              <Feather name="alert-circle" size={24} color={"red"} />
              <Text>
                {search.length > 0
                  ? "No results found"
                  : "No transactions found"}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
