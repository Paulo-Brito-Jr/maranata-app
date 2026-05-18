import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Comunicação" };

export default function PushPage() {
  return (
    <ModuloShell
      titulo="Comunicação"
      descricao="Push notifications para os 6.662 usuários do app. Segmentação por igreja, faixa, célula."
      stats={[
        { label: "Usuários alcançáveis", valor: "6.662", ref: "InChurch: zero envios feitos" },
        { label: "Enviados (mês)", valor: "0" },
        { label: "Taxa de abertura", valor: "—" },
        { label: "Agendados", valor: "—" },
      ]}
      acoes={[
        { href: "/admin/push/novo", label: "Novo push" },
        { href: "/admin/push/agendados", label: "Ver agendados" },
      ]}
      faseRoadmap="F6 (parte) — Calendário de pushes recorrentes (Domingo 8h, Quinta 14h, Sexta 18h, 1×/mês dízimo). Tracking de abertura. Targets por segmento."
    />
  );
}
