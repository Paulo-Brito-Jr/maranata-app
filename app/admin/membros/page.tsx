import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Membros" };

export default function MembrosPage() {
  return (
    <ModuloShell
      titulo="Membresia"
      descricao="Membros, visitantes, novos convertidos, aniversariantes e família espiritual."
      stats={[
        { label: "Membros", valor: "—", ref: "InChurch: 2.731" },
        { label: "Visitantes", valor: "—", ref: "InChurch: 310" },
        { label: "Novos convertidos", valor: "—", ref: "InChurch: 4" },
        { label: "Aniversariantes do mês", valor: "—" },
      ]}
      acoes={[
        { href: "/admin/membros/novo", label: "Novo membro" },
        { href: "/admin/membros/import", label: "Importar XLSX" },
      ]}
      faseRoadmap="F4 — Membros + Visitantes + Novos Convertidos. CRUD + perfil completo + carteirinhas + atendimento pastoral com fluxo."
    />
  );
}
