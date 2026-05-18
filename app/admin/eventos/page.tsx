import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Eventos" };

export default function EventosPage() {
  return (
    <ModuloShell
      titulo="Eventos"
      descricao="Calendário, inscrições, ingressos, check-in via QR."
      stats={[
        { label: "Eventos ativos", valor: "—", ref: "InChurch: 315 únicos" },
        { label: "Categorias", valor: "—", ref: "InChurch: 11" },
        { label: "Inscrições do mês", valor: "—" },
        { label: "Receita do mês", valor: "—" },
      ]}
      acoes={[{ href: "/admin/eventos/novo", label: "Novo evento" }]}
      faseRoadmap="F3 — Calendário, inscrição pública sem login, lotes, ingressos por tipo, perguntas custom, checkout Safe2Pay, QR check-in. Categorias: Celebrações, Jovem, Kids, Homens, Mulheres, EBD, Evangelismo, Conferências."
    />
  );
}
