import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Pregações" };

export default function PregacoesPage() {
  return (
    <ModuloShell
      titulo="Pregações"
      descricao="YouTube/SoundCloud, séries, categorias, transmissões ao vivo, banners e planos de leitura."
      stats={[
        { label: "Pregações publicadas", valor: "—", ref: "InChurch: 587" },
        { label: "Séries", valor: "—", ref: "InChurch: 9" },
        { label: "Transmissões", valor: "—", ref: "InChurch: 85" },
        { label: "Banners ativos", valor: "—", ref: "InChurch: 40" },
      ]}
      acoes={[
        { href: "/admin/pregacoes/nova", label: "Nova pregação" },
        { href: "/admin/pregacoes/banners", label: "Banners" },
        { href: "/admin/pregacoes/planos", label: "Planos de leitura" },
      ]}
      faseRoadmap="F6 — Pregações + séries + categorias + transmissões + banners + planos de leitura + downloads EBD."
    />
  );
}
