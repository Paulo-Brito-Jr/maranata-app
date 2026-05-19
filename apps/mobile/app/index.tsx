import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import * as Linking2 from "expo-linking";

const APP_URL = "https://maranata.app";
const AUTH_URL = "https://auth.maranata.app";
const APP_SLUG = "maranata-app";
const SESSION_KEY = "maranata_session_token";

WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const [logado, setLogado] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync(SESSION_KEY);
      setLogado(!!token);
    })();
  }, []);

  async function login() {
    setBusy(true);
    setErro(null);
    try {
      const returnUrl = Linking2.createURL("/auth/callback");
      const url = `${AUTH_URL}/api/sso/start?app=${APP_SLUG}&return=${encodeURIComponent(returnUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);
      if (result.type !== "success") {
        setBusy(false);
        return;
      }
      const parsed = new URL(result.url);
      const token = parsed.searchParams.get("token");
      if (!token) {
        setErro("Login não retornou token");
        setBusy(false);
        return;
      }
      await SecureStore.setItemAsync(SESSION_KEY, token);
      setLogado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha no login");
    } finally {
      setBusy(false);
    }
  }

  async function abrirWebApp() {
    await Linking.openURL(APP_URL);
  }

  async function sair() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setLogado(false);
  }

  if (logado === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.brand}>MARANATA</Text>
        <Text style={styles.tagline}>Igreja Missionária Evangélica</Text>
      </View>

      {logado ? (
        <View style={styles.card}>
          <Text style={styles.title}>Você está conectado</Text>
          <Text style={styles.sub}>
            Sua sessão Maranata Key está ativa neste aparelho.
          </Text>
          <Pressable onPress={abrirWebApp} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Abrir aplicativo</Text>
          </Pressable>
          <Pressable onPress={sair} style={styles.btnGhost}>
            <Text style={styles.btnGhostText}>Sair</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.sub}>
            Acesse com seu cadastro Maranata Key.
          </Text>
          {erro && <Text style={styles.erro}>{erro}</Text>}
          <Pressable
            onPress={login}
            disabled={busy}
            style={[styles.btnPrimary, busy && styles.btnDisabled]}
          >
            <Text style={styles.btnPrimaryText}>
              {busy ? "Abrindo login..." : "Entrar com Maranata Key"}
            </Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.footer}>maranata.app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c0a18",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  center: {
    flex: 1,
    backgroundColor: "#0c0a18",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
  },
  brand: {
    color: "#F0641E",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 6,
  },
  tagline: {
    color: "#c6b7e0",
    fontSize: 14,
    marginTop: 8,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  sub: {
    color: "#aaa3bd",
    marginTop: 8,
    fontSize: 14,
  },
  erro: {
    color: "#f87171",
    marginTop: 12,
    fontSize: 13,
  },
  btnPrimary: {
    marginTop: 24,
    backgroundColor: "#F0641E",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnGhost: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  btnGhostText: {
    color: "#c6b7e0",
    fontSize: 14,
  },
  footer: {
    color: "#6b6182",
    textAlign: "center",
    fontSize: 12,
  },
});
