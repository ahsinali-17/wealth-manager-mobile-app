import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export type PillElements = {
  key: string;
  label: string;
  icon?: string;
};

export default function PillGroup({
  elements,
  currentValue,
  onChange,
  scrollable,
}: {
  elements: PillElements[];
  currentValue: string;
  onChange: (key: string) => void;
  scrollable?: boolean;
}) {
  const row = (
    <View className="flex-row gap-2 flex-wrap">
      {elements.map((ele) => {
        return (
          <TouchableOpacity
            key={ele.key}
            onPress={() => onChange(ele.key)}
            className={`flex-row items-center justify-center px-2 py-1 rounded-full ${currentValue === ele.key ? "bg-black" : "bg-white"} border border-brand-text-secondary`}
          >
            {ele.icon && (
              <Text
                className={`text-lg ${currentValue === ele.key ? "text-white" : "text-black"}`}
              >
                {ele.icon + " "}
              </Text>
            )}
            <Text
              className={`font-semibold text-lg ${currentValue === ele.key ? "text-white" : "text-black"}`}
            >
              {ele.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (!scrollable) return row;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {row}
    </ScrollView>
  );
}
