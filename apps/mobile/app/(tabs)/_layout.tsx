import { Tabs, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "maranata_session_token";

export default function TabsLayout() {
  const [logado, setLogado] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(SESSION_KEY);
      setLogado(!!token);
    })();
  }, []);

  if (logado === null) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0c0a18", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (!logado) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#0c0a18",
          borderTopColor: "rgba(255,255,255,0.08)",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#F0641E",
        tabBarInactiveTintColor: "#6b6182",
        headerStyle: { backgroundColor: "#0c0a18" },
        headerTintColor: "#fff",
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Início", headerTitle: "Maranata" }} />
      <Tabs.Screen name="eventos" options={{ title: "Eventos" }} />
      <Tabs.Screen name="biblia" options={{ title: "Bíblia" }} />
      <Tabs.Screen name="oracao" options={{ title: "Oração" }} />
      <Tabs.Screen name="mais" options={{ title: "Mais" }} />
    </Tabs>
  );
}
