import {
  CodeFormValue,
  codeSchema,
  SignInFormValue,
  signInSchema,
} from "@/lib/schemas/auth";
import { useAuth, useSignIn } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const isLoading = fetchStatus === "fetching";

  const [email, setEmail] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<SignInFormValue>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const {
    control: codeControl,
    handleSubmit: handleCodeSubmit,
    formState: { errors: codeErrors },
  } = useForm<CodeFormValue>({
    resolver: zodResolver(codeSchema),
    mode: "onBlur",
    defaultValues: { code: "" },
  });

  const finalizeSignIn = async () => {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) return;
        const url = decorateUrl("/(root)/(tabs)");
        router.replace(url as any);
      },
    });
  };

  const onSignInPress = async (values: SignInFormValue) => {
    setEmail(values.email);

    const { error } = await signIn.password({
      emailAddress: values.email,
      password: values.password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (!error) {
      if (signIn.status === "complete") {
        await finalizeSignIn();
        return;
      } else if (
        signIn.status === "needs_client_trust" ||
        signIn.status === "needs_second_factor"
      ) {
        try {
          await signIn.mfa.sendEmailCode();
        } catch (error) {
          alert("Failed to send verification code! Please try again.");
        }
      }
    }
  };

  const onVerifyPress = async ({ code }: CodeFormValue) => {
    try {
      await signIn.mfa.verifyEmailCode({ code });

      if (signIn.status === "complete") {
        await finalizeSignIn();
      }
    } catch (error) {
      alert("Verification failed! Please try again.");
    }
  };

  if (!isLoaded) return null;

  if (signIn.status === "complete" || isSignedIn) {
    return null;
  }

  if (
    signIn.status === "needs_client_trust" ||
    signIn.status === "needs_second_factor"
  ) {
    return (
      <SafeAreaView className="flex-1 bg-brand-body">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
            keyboardShouldPersistTaps="handled"
            className="px-6"
          >
            <View className="-mt-16">
              <Image
                source={require("../../assets/images/welth.png")}
                className="w-36 h-16 mb-8"
                resizeMode="contain"
              />
              <Text className="text-3xl font-bold text-[#1A1D26] mb-2 leading-tight">
                Verify your account
              </Text>
              <Text className="text-brand-text-muted text-base mb-8">
                We sent a code to {email}
              </Text>

              <Controller
                control={codeControl}
                name="code"
                render={({ field: { value, onChange } }) => {
                  return (
                    <TextInput
                      className="border border-[#E8E6DF] bg-white rounded-xl px-4 py-3 mb-2 text-[#1A1D26]"
                      placeholder="Enter verification code"
                      placeholderTextColor="#8A8D96"
                      value={value}
                      onChangeText={onChange}
                    />
                  );
                }}
              />
              {codeErrors.code && (
                <Text className="text-brand-coral mb-4 text-sm">
                  {codeErrors.code.message}
                </Text>
              )}
              {errors.fields.code && (
                <Text className="text-brand-coral mb-4 text-sm">
                  {errors.fields.code.message}
                </Text>
              )}

              <TouchableOpacity
                onPress={handleCodeSubmit(onVerifyPress)}
                disabled={isLoading}
                className="w-full bg-brand-blue py-4 rounded-xl items-center mb-4"
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Verify
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => signIn.mfa.sendEmailCode()}
                className="py-2"
              >
                <Text className="text-brand-blue text-sm">
                  I need a new code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => signIn.reset()} className="py-2">
                <Text className="text-brand-blue text-sm">Start over</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-body">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <View className="-mt-16">
            <Image
              source={require("../../assets/images/welth.png")}
              className="w-36 h-16 mb-8"
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-[#1A1D26] mb-2 leading-tight">
              Sign in to your Account
            </Text>
            <Text className="text-brand-text-muted text-base mb-8">
              Track your money, powered by AI
            </Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { value, onChange } }) => {
                return (
                  <TextInput
                    className="border border-[#E8E6DF] bg-white rounded-xl px-4 py-3 mb-2 text-[#1A1D26]"
                    placeholder="Email Address"
                    placeholderTextColor="#8A8D96"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="none"
                  />
                );
              }}
            />
            {formErrors.email && (
              <Text className="text-brand-coral mb-4 text-sm">
                {formErrors.email.message}
              </Text>
            )}
            {errors.fields.identifier && (
              <Text className="text-brand-coral mb-4 text-sm">
                {errors.fields.identifier.message}
              </Text>
            )}

            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange } }) => {
                return (
                  <TextInput
                    className="border border-[#E8E6DF] bg-white rounded-xl px-4 py-3 mb-2 text-[#1A1D26]"
                    placeholder="Password"
                    placeholderTextColor="#8A8D96"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                );
              }}
            />
            {formErrors.password && (
              <Text className="text-brand-coral mb-4 text-sm">
                {formErrors.password.message}
              </Text>
            )}
            {errors.fields.password && (
              <Text className="text-brand-coral mb-4 text-sm">
                {errors.fields.password.message}
              </Text>
            )}

            <TouchableOpacity
              onPress={handleSubmit(onSignInPress)}
              disabled={isLoading}
              className="w-full bg-brand-blue py-4 rounded-xl items-center mb-4"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center">
              <Text className="text-brand-text-muted">
                Don't have an account?{" "}
              </Text>
              <Link href="/sign-up">
                <Text className="text-brand-blue font-semibold">Sign Up</Text>
              </Link>
            </View>

            {/* Required by Clerk for bot protection */}
            <View nativeID="clerk-captcha" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
