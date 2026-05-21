import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function EventosTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Eventos da Maranata</Text>
      <Text style={styles.sub}>Calendário, inscrições e ingressos.</Text>

      <Pressable
        onPress={() => Linking.openURL("https://maranata.app/eventos")}
        style={styles.btn}
      >
        <Text style={styles.btnText}>Ver agenda completa</Text>
      </Pressable>

      <View style={styles.tip}>
        <Text style={styles.tipTitle}>Em breve</Text>
        <Text style={styles.tipText}>
          Inscrição rápida, check-in via QR e lembrete antes do evento.
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
  tip: {
    marginTop: 32,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tipTitle: { color: "#fff", fontWeight: "700" },
  tipText: { color: "#aaa3bd", marginTop: 6, fontSize: 13 },
});
