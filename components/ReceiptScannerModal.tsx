import { COLORS } from "@/constants/theme";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReceiptScannerModal({
  onClose,
  visible,
  onCapture,
}: {
  onClose: () => void;
  visible: boolean;
  onCapture: (base64: string, mimeType: string) => void;
}) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setcapturing] = useState(false);

  const handleCapture = async () => {
    if (capturing || !cameraRef.current) return;
    try {
      setcapturing(true);
      const image = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
      });

      if (image.base64) {
        onCapture(image.base64, image.exif?.MimeType || "image/jpeg");
      }
    } catch (error) {
      console.error("Error capturing image:", error);
    } finally {
      setcapturing(false);
    }
  };

  const handleLibrarySelection = async () => {
    const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.7,
      selectionLimit: 1,
      mediaTypes: ["images"],
    });
    if (result.canceled) return;

    if (result?.assets[0]?.base64) {
      onCapture(
        result.assets[0].base64,
        result.assets[0].mimeType || "image/jpeg",
      );
    }
  };

  useEffect(() => {
    if (visible && !permission?.granted) requestPermission();
  }, [visible, permission?.granted, requestPermission]);

  return (
    <Modal visible={visible} animationType="slide">
      <View className="flex-1 bg-brand-bg">
        {permission?.granted && (
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={"back"}
            autofocus="on"
          />
        )}
        <View className="absolute inset-0 items-center justify-center px-10">
          <View
            className="w-full aspect-[3/4] border  rounded-xl border-brand-body"
            style={{ borderStyle: "dashed" }}
          ></View>
          <SafeAreaView className="absolute inset-0 pt-5" edges={["top"]}>
            <View className="flex-row justify-between px-3">
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity className="flex-row gap-3 items-center p-2 bg-brand-surface">
                <MaterialCommunityIcons
                  name="robot-outline"
                  size={24}
                  color={COLORS.teal}
                />
                <Text className="text-lg text-brand-body font-semibold">
                  Align Receipt
                </Text>
              </TouchableOpacity>
              <View></View>
            </View>

            <View className="flex-1"></View>

            <View className="pb-3 px-3 flex-row justify-between items-center">
              <TouchableOpacity
                onPress={handleLibrarySelection}
                disabled={capturing}
                className="border border-brand-body rounded-full p-2"
              >
                <Feather name="image" size={16} color={"#fff"} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCapture}
                disabled={capturing || !permission?.granted}
                activeOpacity={0.85}
                className="border-2 border-brand-body rounded-full p-4 bg-brand-blue"
              >
                {capturing ? (
                  <ActivityIndicator size={16} color={"#fff"} />
                ) : (
                  <Feather name="camera" size={28} color={"#fff"} />
                )}
              </TouchableOpacity>
              <View className="w-12 h-12"></View>
            </View>
          </SafeAreaView>

          {!permission?.granted && permission?.canAskAgain === false && (
            <View
              className="absolute bg-black  w-full aspect-[3/4] border  rounded-xl border-brand-body items-center justify-center px-10 gap-3"
              style={{ borderStyle: "dashed" }}
            >
              <Feather name="camera-off" size={30} color={"#fff"} />
              <Text className="text-brand-body font-medium">
                Camera permission required. Go to settings to give permission
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="mt-5 px-5 py-2 bg-brand-blue rounded-xl "
              >
                <Text className="text-brand-surface font-medium ">Close</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
