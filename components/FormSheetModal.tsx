import React, { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function FormSheetModal({
  title,
  onClose,
  children,
  visible,
}: PropsWithChildren<{
  title: string;
  onClose: () => void;
  visible: boolean;
}>) {
  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        className="justify-end bg-black/40"
      >
        <View className="px-4 py-5 bg-brand-body rounded-t-2xl">
          <Text className="text-xl font-bold text-brand-bg">{title}</Text>

          {children}

          <TouchableOpacity
            onPress={onClose}
            className="py-2 items-center rounded-lg bg-slate-500 mt-4"
          >
            <Text className="text-brand-text-primary font-semibold">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
