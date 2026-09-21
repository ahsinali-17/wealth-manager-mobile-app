import { useBudgetsQuery } from "@/hooks/query/useBudgetsQuery";
import { useTransactionsQuery } from "@/hooks/query/useTransactionsQuery";
import { askAssistant } from "@/lib/services/assistant";
import { useUserStore } from "@/store/useUserStore";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const prompts = [
  "Have I spent more from my budget than I should have?",
  "Which category did I spend most on?",
  "What is the ratio of my income and expense?",
];

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <View
      className={`w-[80%] ${isUser ? "self-end bg-brand-bg" : "self-start bg-white"} rounded-xl px-4 py-2 mb-3`}
    >
      <Text
        className={`${isUser ? "text-brand-body" : "text-brand-bg"} text-base`}
      >
        {message.content}
      </Text>
    </View>
  );
}

export default function Assistant() {
  const { user } = useUser();
  const INITIAL_MESSAGE: Message[] = [
    {
      id: "welcome",
      role: "assistant",
      content: `Hello ${user?.firstName || ""}! Ask me about your finance...`,
    },
  ];
  const [input, setinput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGE);

  const currency = useUserStore((s) => s.currency);

  const { refetch: refetchTransactions } = useTransactionsQuery();

  const { refetch: refetchBudget } = useBudgetsQuery();

  const handleSend = async (question: string) => {
    if (sending || !user || !question.trim()) return;

    setMessages((prv) => [
      ...prv,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: "user",
        content: question,
      },
    ]);
    setinput("");
    setSending(true);

    try {
      const [{ data: transactions = [] }, { data: budget = null }] =
        await Promise.all([refetchTransactions(), refetchBudget()]);
      const res = await askAssistant(question, transactions, budget, currency);

      setMessages((prev) => [
        ...prev,
        {
          id: new Date().toString(),
          role: "assistant",
          content: res,
        },
      ]);
    } catch (error) {
      console.error("Gemini response error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: new Date().toString(),
          role: "assistant",
          content: "Unable to answer your query. Please try again later...",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-brand-body">
      <View className="px-4 py-3">
        <Text className="text-xl text-brand-bg font-semibold">Assistant</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "android" ? "height" : "padding"}
        keyboardVerticalOffset={Platform.OS === "android" ? -70 : 0}
        className="flex-1"
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingBottom: 20,
            paddingHorizontal: 16,
            paddingTop: 10,
          }}
          renderItem={({ item }) => {
            return <MessageBubble message={item} />;
          }}
          ListFooterComponentStyle={{
            alignSelf: "flex-start",
          }}
          ListFooterComponent={
            sending ? (
              <View className="self-start mb-3 bg-white border border-[#E8E6DF] rounded-2xl px-3.5 py-2.5">
                <ActivityIndicator size="small" color="#4A9EFF" />
              </View>
            ) : null
          }
        />

        {messages.length <= 1 &&
          prompts.map((prom, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                handleSend(prom);
              }}
            >
              <MessageBubble
                message={{
                  id: index.toString(),
                  role: "assistant",
                  content: prom,
                }}
              />
            </TouchableOpacity>
          ))}

        <View className="pb-6 pt-6 px-3 flex-row gap-2 items-center">
          <TextInput
            value={input}
            onChangeText={setinput}
            keyboardType="default"
            autoFocus
            editable={!sending}
            onSubmitEditing={() => handleSend(input)}
            returnKeyType="send"
            placeholder="Ask about your money..."
            placeholderTextColor={"#7d7a7a"}
            className="border-2 border-brand-text-secondary bg-white flex-1 rounded-full px-3"
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Send message"
            disabled={sending || !input.trim()}
            onPress={() => handleSend(input)}
            className="bg-brand-bg rounded-full p-3"
          >
            <Feather name="send" size={18} color={"#fff"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
