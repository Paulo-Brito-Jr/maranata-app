import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Intercessão" };

export default function IntercessaoPage() {
  return (
    <ModuloShell
      titulo="Intercessão"
      descricao="Pedidos de oração, testemunhos públicos, sentimentos e escala de intercessores."
      stats={[
        { label: "Pedidos abertos", valor: "—", ref: "InChurch: 483 (14 desde out/2025!)" },
        { label: "Em oração", valor: "—" },
        { label: "Testemunhos", valor: "—", ref: "InChurch: 654 (todos privados)" },
        { label: "Intercessores ativos", valor: "—" },
      ]}
      acoes={[
        { href: "/admin/intercessao/escala", label: "Escala de oração" },
        { href: "/admin/intercessao/testemunhos", label: "Aprovar testemunhos" },
      ]}
      faseRoadmap="F7 — Fluxo: pedido → atribuição → resposta 48h → notificação. Aba pública de testemunhos no PWA (prova social). 14 pedidos pendentes desde out/2025 precisam ser resolvidos."
    />
  );
}
