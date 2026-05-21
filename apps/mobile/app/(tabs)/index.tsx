import { ScrollView, StyleSheet, Text, View, Pressable, Linking } from "react-native";

export default function HomeTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.greeting}>Bem-vindo(a) à Maranata</Text>
        <Text style={styles.tagline}>15 igrejas · uma família</Text>
      </View>

      <View style={styles.grid}>
        <CardLink titulo="Devocional" desc="Versículo do dia" href="https://maranata.app/membro/devocional" />
        <CardLink titulo="Doar" desc="Dízimo e ofertas" href="https://maranata.app/doar" destaque />
        <CardLink titulo="Minha célula" desc="Encontros e relatos" href="https://maranata.app/membro/celula" />
        <CardLink titulo="Pregações" desc="Mensagens recentes" href="https://maranata.app/membro/pregacoes" />
      </View>

      <Text style={styles.footer}>maranata.app</Text>
    </ScrollView>
  );
}

function CardLink({
  titulo,
  desc,
  href,
  destaque,
}: {
  titulo: string;
  desc: string;
  href: string;
  destaque?: boolean;
}) {
  return (
    <Pressable
      onPress={() => Linking.openURL(href)}
      style={[styles.card, destaque && styles.cardDestaque]}
    >
      <Text style={styles.cardTitulo}>{titulo}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0c0a18" },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  hero: { marginBottom: 24 },
  greeting: { color: "#fff", fontSize: 24, fontWeight: "700" },
  tagline: { color: "#aaa3bd", fontSize: 14, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    width: "48%",
  },
  cardDestaque: {
    backgroundColor: "rgba(240,100,30,0.15)",
    borderColor: "rgba(240,100,30,0.4)",
  },
  cardTitulo: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cardDesc: { color: "#aaa3bd", fontSize: 12, marginTop: 4 },
  footer: { color: "#6b6182", textAlign: "center", fontSize: 12, marginTop: 24 },
});
