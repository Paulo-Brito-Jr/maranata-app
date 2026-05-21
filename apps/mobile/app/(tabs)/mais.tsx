import { useRouter } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "maranata_session_token";

type ItemProps = { titulo: string; desc: string; href: string };

export default function MaisTab() {
  const router = useRouter();

  async function sair() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    router.replace("/");
  }

  const items: ItemProps[] = [
    { titulo: "Perfil", desc: "Dados pessoais e carteirinha", href: "https://maranata.app/membro/perfil" },
    { titulo: "Histórico", desc: "Eventos, doações, oração", href: "https://maranata.app/membro/historico" },
    { titulo: "Doar", desc: "Dízimo e ofertas", href: "https://maranata.app/doar" },
    { titulo: "Jornadas", desc: "Trilhas de discipulado", href: "https://maranata.app/membro/jornadas" },
    { titulo: "Escola Bíblica", desc: "EBD + IBM", href: "https://maranata.app/membro/escola" },
    { titulo: "Encontre uma célula", desc: "15 igrejas · 218 células", href: "https://maranata.app/celulas" },
    { titulo: "Loja Maranata", desc: "Catálogo oficial", href: "https://maranata.app/loja" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {items.map((it) => (
        <Pressable
          key={it.href}
          onPress={() => Linking.openURL(it.href)}
          style={styles.item}
        >
          <View style={styles.itemBody}>
            <Text style={styles.itemTitulo}>{it.titulo}</Text>
            <Text style={styles.itemDesc}>{it.desc}</Text>
          </View>
          <Text style={styles.itemArrow}>→</Text>
        </Pressable>
      ))}

      <Pressable onPress={sair} style={styles.btnSair}>
        <Text style={styles.btnSairText}>Sair</Text>
      </Pressable>

      <Text style={styles.footer}>Maranata App · v0.1</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0a18" },
  content: { padding: 16, gap: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  itemBody: { flex: 1 },
  itemTitulo: { color: "#fff", fontSize: 15, fontWeight: "600" },
  itemDesc: { color: "#aaa3bd", fontSize: 12, marginTop: 2 },
  itemArrow: { color: "#F0641E", fontSize: 20 },
  btnSair: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  btnSairText: { color: "#f87171", fontWeight: "600" },
  footer: { color: "#6b6182", textAlign: "center", fontSize: 11, marginTop: 16 },
});
