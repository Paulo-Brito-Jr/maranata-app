import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0c0a18" },
          headerTintColor: "#fff",
          contentStyle: { backgroundColor: "#0c0a18" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Maranata", headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
