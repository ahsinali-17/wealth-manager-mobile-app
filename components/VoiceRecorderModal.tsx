import { AI_GRADIENT, COLORS, RECORDING_GRADIENT } from "@/constants/theme";
import {
  ExtractedTransaction,
  extractTransactionFromVoice,
} from "@/lib/services/extractTransaction";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";
import { BlurView } from "expo-blur";
import { File } from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

type STATUS = "idle" | "recording" | "processing" | "error";

export default function VoiceRecorderModal({
  visible,
  onClose,
  onExtract,
}: {
  visible: boolean;
  onClose: () => void;
  onExtract: (data: ExtractedTransaction) => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [status, setstatus] = useState<STATUS>("idle");
  const [seconds, setSeconds] = useState(0);

  async function startRecording() {
    setSeconds(0);
    await recorder.prepareToRecordAsync();
    recorder.record();
    setstatus("recording");
  }
  async function stopRecording() {
    setstatus("processing");
    await recorder.stop();

    try {
      const uri = recorder.uri;
      if (!uri) throw new Error("Could not get URI of recording.");
      const file = new File(uri);
      const base64 = await file.base64();
      const result = await extractTransactionFromVoice(base64, "audio/m4a");
      onExtract(result);
      onClose();
    } catch (error) {
      console.log("Failed to stop recording", error);
      setstatus("error");
    }
  }

  useEffect(() => {
    if (!visible) {
      setstatus("idle");
      setSeconds(0);
      return;
    }

    (async () => {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        setstatus("error");
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
    })();
  }, [visible]);

  useEffect(() => {
    if (status !== "recording") return;
    let interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView
        intensity={80}
        tint="dark"
        className="absolute inset-0"
        style={{ flex: 1 }}
      />
      <View className="absolute bottom-0 left-0 right-0 bg-brand-surface rounded-tl-2xl rounded-tr-2xl border-t border-brand-body overflow-hidden">
        {/* Top AI Gradient Accent Line */}
        <LinearGradient
          colors={status === "recording" ? RECORDING_GRADIENT : AI_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 4, width: "100%" }}
        />

        <View className="p-4">
          <View className="flex-row justify-center items-center gap-2 mb-2">
            <MaterialCommunityIcons
              name="robot-outline"
              size={24}
              color={COLORS.teal}
            />
            <Text className="text-xl font-bold" style={{ color: COLORS.teal }}>
              AI Voice log
            </Text>
          </View>

          {status === "error" ? (
            <View className="items-center gap-2 p-2">
              <Feather name="alert-circle" size={24} color={"red"} />
              <Text className="text-brand-body font-semibold text-center">
                Couldn&apos;t process that. Check your microphone permission and
                try again.
              </Text>
              <TouchableOpacity onPress={onClose} style={{ marginTop: 10 }}>
                <Text
                  className="text-brand-coral text-lg font-semibold"
                  style={{ textAlign: "center" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center p-2">
              <Text className="text-xl text-brand-body font-semibold text-center mb-1">
                {status === "idle"
                  ? "Tap the mic to start"
                  : status === "recording"
                    ? "Listening..."
                    : "Processing..."}
              </Text>

              <Text className="text-base text-brand-text-secondary font-semibold text-center mb-4">
                {status === "idle"
                  ? "I spent 400 on grocery today..."
                  : status === "recording"
                    ? `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`
                    : "Transcribing and extracting the details."}
              </Text>

              {status === "idle" ? (
                <TouchableOpacity
                  disabled={status !== "idle"}
                  onPress={startRecording}
                  activeOpacity={0.8}
                  className="mb-3"
                >
                  <LinearGradient
                    colors={AI_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 9999,
                      padding: 20,
                      borderWidth: 2,
                      borderColor: COLORS.teal,
                    }}
                  >
                    <Feather name="mic" size={28} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              ) : status === "recording" ? (
                <TouchableOpacity
                  disabled={status !== "recording"}
                  onPress={stopRecording}
                  activeOpacity={0.8}
                  className="mb-3"
                >
                  <LinearGradient
                    colors={RECORDING_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 9999,
                      padding: 20,
                      borderWidth: 2,
                      borderColor: COLORS.pink,
                    }}
                  >
                    <Feather name="pause" size={28} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View className="mb-3">
                  <LinearGradient
                    colors={AI_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      borderRadius: 9999,
                      padding: 20,
                      borderWidth: 2,
                      borderColor: COLORS.teal,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="brain"
                      size={28}
                      color="#fff"
                    />
                  </LinearGradient>
                </View>
              )}

              <TouchableOpacity
                onPress={onClose}
                style={{ marginTop: 10, padding: 10 }}
              >
                <Text
                  className="text-brand-coral text-xl font-semibold"
                  style={{ textAlign: "center" }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
