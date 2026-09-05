import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import "../global.css";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  else return <Redirect href="/(root)/(tabs)" />;
}
