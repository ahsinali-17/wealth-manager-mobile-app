import { FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform } from "react-native";

// Unified theme colors (from tailwind/brand palette)
const ACTIVE_COLOR = "#2ECC71"; // Wealth Manager green primary
const INACTIVE_COLOR = "#8A8D96"; // Muted text/icon color
const BACKGROUND_COLOR = "#141822"; // Brand dark surface background
const BORDER_COLOR = "#232838"; // Brand surface border

function IOSTabs() {
  return (
    <NativeTabs
      backgroundColor={BACKGROUND_COLOR}
      shadowColor={BORDER_COLOR}
      iconColor={{
        default: INACTIVE_COLOR,
        selected: ACTIVE_COLOR,
      }}
      labelStyle={{
        default: { color: INACTIVE_COLOR },
        selected: { color: ACTIVE_COLOR },
      }}
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="transections">
        <Label>Transections</Label>
        <Icon sf="list.bullet" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="add-transection">
        <Label>Add</Label>
        <Icon sf="plus.app.fill" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="assistant">
        <Label>Assistant</Label>
        <Icon sf="brain.head.profile" drawable="custom_android_drawable" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" drawable="custom_settings_drawable" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function AndroidTabs() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: BACKGROUND_COLOR,
          borderTopColor: BORDER_COLOR,
          borderTopWidth: 1,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => {
            return <FontAwesome size={24} color={color} name="home" />;
          },
        }}
      />
      <Tabs.Screen
        name="transections"
        options={{
          title: "Transections",
          tabBarIcon: ({ color }) => {
            return <FontAwesome size={24} color={color} name="list" />;
          },
        }}
      />
      <Tabs.Screen
        name="add-transection"
        options={{
          title: "Add",
          tabBarIcon: ({ color }) => {
            return <FontAwesome size={24} color={color} name="plus" />;
          },
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant",
          tabBarIcon: ({ color }) => {
            return <FontAwesome size={24} color={color} name="question" />;
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => {
            return <FontAwesome size={24} color={color} name="user" />;
          },
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return Platform.OS === "ios" ? <IOSTabs /> : <AndroidTabs />;
}
