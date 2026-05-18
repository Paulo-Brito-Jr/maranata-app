import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Kids" };

export default function KidsPage() {
  return (
    <ModuloShell
      titulo="Kids"
      descricao="Check-in/out via QR, etiquetas com alergias e contatos, autorização de imagem, turmas por faixa etária."
      stats={[
        { label: "Crianças cadastradas", valor: "—" },
        { label: "Turmas ativas", valor: "—" },
        { label: "Check-ins (semana)", valor: "—" },
        { label: "Economia anual", valor: "R$ 718,80", ref: "vs InChurch Kids" },
      ]}
      acoes={[
        { href: "/admin/kids/criancas/nova", label: "Cadastrar criança" },
        { href: "/admin/kids/checkin", label: "Tela de check-in" },
      ]}
      faseRoadmap="F8 — Substitui o módulo Kids do InChurch (R$59,90/mês). WebApp para check-in sem precisar de app store. Etiquetas com dados médicos imprimíveis direto. Comunicação push com pais."
    />
  );
}
