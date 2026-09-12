import BudgetModal from "@/components/budgetModal";
import TransactionRow from "@/components/TransactionRow";
import { CategoryKey, getCategoryConfig } from "@/constants/transactions";
import { useAccountsQuery } from "@/hooks/query/useAccountsQuery";
import { useBudgetsQuery } from "@/hooks/query/useBudgetsQuery";
import { useTransactionsQuery } from "@/hooks/query/useTransactionsQuery";
import { formatAmount } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { isSameMonth } from "date-fns";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { RefreshControl } from "react-native-gesture-handler";
import { PieChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

const QUICK_ACTIONS = [
  {
    icon: "camera",
    label: "AI Receipt Scan",
    action: "scan",
    color: "#1A85FF",
  },
  {
    icon: "mic",
    label: "Voice Entry",
    action: "voice",
    color: "#FF6B4A",
  },
  {
    icon: "plus",
    label: "Add Manually",
    action: "manual",
    color: "#3DDC84",
  },
] as const;
export default function index() {
  const { user } = useUser();
  const router = useRouter();
  const currency = useUserStore((s) => s.currency);

  const [showBudgetModal, setShowBudgetModal] = React.useState(false);

  const {
    data: accounts = [],
    isLoading: isLoadingAccounts,
    isRefetching: isAccountsReFetching,
    refetch: refetchAccounts,
  } = useAccountsQuery();
  const {
    data: transactions = [],
    isLoading: isLoadingTransactions,
    isRefetching: isTransactionsReFetching,
    refetch: refetchTransactions,
  } = useTransactionsQuery();
  const { data: budget = null, refetch: refetchBudgets } = useBudgetsQuery();

  const isLoading = isLoadingAccounts || isLoadingTransactions;
  const isreFetching = isAccountsReFetching || isTransactionsReFetching;

  const reload = () => {
    refetchAccounts();
    refetchTransactions();
    refetchBudgets();
  };

  let totalBalance = useMemo(
    () => accounts?.reduce((sum, acc) => (sum += acc.balance), 0),
    [accounts],
  );

  const monthTransactions = useMemo(() => {
    const now = new Date();
    return transactions?.filter((tx) => isSameMonth(new Date(tx.date), now));
  }, [transactions]);

  const monthExpense = useMemo(
    () =>
      monthTransactions
        .filter((tx) => tx.type === "EXPENSE")
        .reduce((sum, tx) => sum + tx.amount, 0),
    [monthTransactions],
  );
  let monthIncome = useMemo(
    () =>
      monthTransactions
        ?.filter((t) => t.type === "INCOME")
        .reduce((sum, t) => (sum += t.amount), 0),
    [monthTransactions],
  );

  let recentTransactions = useMemo(
    () => monthTransactions?.slice(0, 5),
    [monthTransactions],
  );

  let expenseBreakdown = useMemo(() => {
    let map: Record<string, number> = {};

    monthTransactions
      ?.filter((t) => t.type === "EXPENSE")
      .forEach((item) => {
        map[item.category] = (map[item.category] || 0) + item.amount;
      });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => {
        return {
          category: key as CategoryKey,
          amount: value,
          color: getCategoryConfig(key as CategoryKey).color,
        };
      });
  }, [monthTransactions]);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isreFetching} onRefresh={reload} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="bg-brand-body min-h-full w-full">
          <View className="bg-brand-bg py-6 px-4 rounded-b-3xl">
            <View className="flex-row justify-between items-center mb-4">
              <Image
                source={require("@/assets/images/welth-light.png")}
                className="h-full w-16"
                resizeMode="contain"
              />
              <View className="flex-row gap-6 items-center">
                <View>
                  <Text className="text-xs text-brand-text-secondary">
                    {new Date().getHours() < 12
                      ? "Good Morning"
                      : new Date().getHours() < 18
                        ? "Good Afternoon"
                        : "Good Evening"}
                  </Text>
                  <Text className="text-2xl font-bold text-brand-text-primary">
                    {user?.firstName} {user?.lastName}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push("/(root)/(tabs)/profile")}
                  className="rounded-full border-2 bg-brand-surface border-brand-surface-border"
                >
                  {user?.hasImage ? (
                    <Image
                      source={{ uri: user?.imageUrl! }}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-brand-secondary items-center justify-center">
                      <Feather name="user" size={24} color="white" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View>
              <Text className="text-xs text-brand-text-secondary font-medium mb-2">
                Total Balance
              </Text>
              <Text className="text-brand-text-primary text-4xl leading-tight font-semibold mb-4">
                {formatAmount(totalBalance, currency)}
              </Text>
              <View className="flex-row gap-4 px-3 py-1 items-center rounded-full w-fit mb-4">
                <Text className="text-brand-success text-lg font-semibold">
                  <Feather name="arrow-up-right" size={16} />{" "}
                  {formatAmount(monthIncome, currency)}
                </Text>
                <Text className="text-red-500 text-lg font-semibold">
                  <Feather name="arrow-down-right" size={16} />{" "}
                  {formatAmount(monthExpense, currency)}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-4 items-center">
              {QUICK_ACTIONS.map((action) => {
                return (
                  <TouchableOpacity
                    key={action.label}
                    onPress={() => {
                      router.push({
                        pathname: "/(root)/(tabs)/add-transection",
                        params: { action: action.action },
                      });
                    }}
                    className="items-center border rounded-xl border-brand-surface-border p-4"
                  >
                    <View className="items-center gap-4">
                      <Feather
                        name={action.icon}
                        size={24}
                        color={action.color}
                      />
                      <Text className="text-brand-text-primary">
                        {action.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="w-full px-4">
            <View className="my-5 rounded-2xl bg-white border-muted border p-4 flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-6">
                <View className="w-4 h-4 rounded-full bg-brand-blue"></View>
                <Text className="flex-1font-semibold text-brand-text-muted">
                  Ask AI anything about your money.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(root)/(tabs)/assistant")}
              >
                <Feather name="arrow-right" size={24} color={""} />
              </TouchableOpacity>
            </View>

            <View className="mt-3 mb-4 rounded-2xl bg-white border-muted border p-4">
              <View className="w-full flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-brand-bg">
                  Monthly Budget
                </Text>
                <TouchableOpacity onPress={() => setShowBudgetModal(true)}>
                  <Feather name="edit-2" size={16} color={"#393a3d"} />
                </TouchableOpacity>
              </View>

              {budget ? (
                <View>
                  <Text className="text-brand-text-secondary">
                    {formatAmount(monthExpense, currency)} of{" "}
                    {formatAmount(budget.amount, currency)}
                  </Text>
                  <View className="bg-brand-text-secondary h-2 overflow-hidden rounded-full mt-2">
                    <View
                      style={{
                        width: `${Math.min(Math.round((monthExpense / budget.amount) * 100), 100)}%`,
                        height: "100%",
                        backgroundColor:
                          monthExpense > budget.amount
                            ? "#EF4444"
                            : monthExpense >= budget.amount * 0.8
                              ? "#ddca21"
                              : "#4ade80",
                      }}
                    ></View>
                  </View>
                </View>
              ) : (
                <Text className="text-brand-text-muted">
                  Tap to set a monthly budget.
                </Text>
              )}
            </View>

            <View className="mt-3 mb-4 rounded-2xl bg-white border-muted border p-4">
              <Text className="text-lg font-semibold text-brand-bg">
                Expense breakdown (this month)
              </Text>
              <View className="flex-row items-center justify-between">
                <PieChart
                  data={expenseBreakdown.map((c) => {
                    return {
                      value: c.amount,
                      color: c.color,
                    };
                  })}
                  donut
                  radius={60}
                  innerRadius={38}
                  innerCircleColor={"#fff"}
                />

                <View className="">
                  {expenseBreakdown.map((c) => {
                    return (
                      <View
                        key={c.category}
                        className="flex-row items-center justify-between"
                      >
                        <View className="flex-row items-center gap-3">
                          <View
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: c.color }}
                          ></View>
                          <Text className="text-xs text-brand-text-muted">
                            {getCategoryConfig(c.category)?.label}
                          </Text>
                        </View>
                        <Text>{formatAmount(c.amount, currency)}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            <View className="mt-3 mb-4 rounded-2xl bg-white border-muted border p-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-brand-bg">
                  Recent Transeactions
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(root)/(tabs)/transections")}
                >
                  <Text className="text-base font-semibold text-brand-text-muted">
                    See all
                  </Text>
                </TouchableOpacity>
              </View>
              <View>
                {isLoading ? (
                  <View className="w-full items-center justify-center">
                    <ActivityIndicator color={"#1f1f1f"} />
                  </View>
                ) : monthTransactions.length === 0 ? (
                  <View className="flex-1 justify-center items-center gap-3 p-6 bg-white">
                    <Feather name="inbox" size={24} />
                    <Text className="text-brand-text-muted">
                      No recent transactions.
                    </Text>
                  </View>
                ) : (
                  <>
                    {monthTransactions.slice(0, 5).map((t) => {
                      return <TransactionRow key={t.id} transaction={t} />;
                    })}
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      {!!user && (
        <BudgetModal
          onClose={() => setShowBudgetModal(false)}
          onSave={() => setShowBudgetModal(false)}
          budget={budget}
          visible={showBudgetModal}
        />
      )}
    </SafeAreaView>
  );
}
