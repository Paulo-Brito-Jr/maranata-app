import { Linking, Pressable, ScrollView, StyleSheet, Text } from "react-native";

export default function BibliaTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bíblia + Devocional</Text>
      <Text style={styles.sub}>Leitor com marcadores, devocional diário, planos de leitura.</Text>

      <Pressable
        onPress={() => Linking.openURL("https://maranata.app/membro/biblia")}
        style={styles.btn}
      >
        <Text style={styles.btnText}>Abrir leitor da Bíblia</Text>
      </Pressable>
      <Pressable
        onPress={() => Linking.openURL("https://maranata.app/membro/devocional")}
        style={styles.btnSecondary}
      >
        <Text style={styles.btnSecondaryText}>Devocional de hoje</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0a18" },
  content: { padding: 20 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  sub: { color: "#aaa3bd", marginTop: 6, fontSize: 14 },
  btn: {
    marginTop: 20,
    backgroundColor: "#F0641E",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  btnSecondary: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  btnSecondaryText: { color: "#c6b7e0", fontWeight: "600" },
});
