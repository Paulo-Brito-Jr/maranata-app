import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Jornadas" };

export default function JornadasPage() {
  return (
    <ModuloShell
      titulo="Jornadas"
      descricao="Trilhas de discipulado com atribuição automática para novos convertidos."
      stats={[
        { label: "Trilhas ativas", valor: "—", ref: "InChurch: 3 (2 vazias!)" },
        { label: "Pessoas em jornada", valor: "—", ref: "InChurch: 60 só na 'Discipulado'" },
        { label: "Concluídas (mês)", valor: "—" },
        { label: "Economia anual", valor: "R$ 1.318,80", ref: "vs InChurch Jornadas" },
      ]}
      acoes={[{ href: "/admin/jornadas/trilhas/nova", label: "Nova trilha" }]}
      faseRoadmap="F9 — Trilha obrigatória 'Boas-vindas' pra todo novo convertido. Discipulado, Adolacamp, Sal e outras. Atribuição automática + acompanhamento líder + métricas de conclusão."
    />
  );
}
