import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function OracaoTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Oração & Testemunhos</Text>
      <Text style={styles.sub}>
        Faça um pedido, acompanhe respostas e leia o que Deus tem feito.
      </Text>

      <Pressable
        onPress={() => Linking.openURL("https://maranata.app/membro/oracao")}
        style={styles.btn}
      >
        <Text style={styles.btnText}>Enviar pedido de oração</Text>
      </Pressable>
      <Pressable
        onPress={() => Linking.openURL("https://maranata.app/testemunhos")}
        style={styles.btnSecondary}
      >
        <Text style={styles.btnSecondaryText}>Ler testemunhos</Text>
      </Pressable>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>SLA de resposta</Text>
        <Text style={styles.noteText}>
          A equipe de intercessão Maranata responde pedidos em até 48 horas.
        </Text>
      </View>
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
  note: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(240,100,30,0.08)",
    borderWidth: 1,
    borderColor: "rgba(240,100,30,0.25)",
  },
  noteTitle: { color: "#F0641E", fontWeight: "700" },
  noteText: { color: "#c6b7e0", marginTop: 6, fontSize: 13 },
});
