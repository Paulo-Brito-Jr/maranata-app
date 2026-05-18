import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Loja" };

export default function LojaPage() {
  return (
    <ModuloShell
      titulo="Loja Maranata"
      descricao="E-commerce próprio com white-label e dropshipping. Vinculado a pregações e jornadas."
      stats={[
        { label: "Produtos ativos", valor: "—" },
        { label: "Pedidos (mês)", valor: "—" },
        { label: "Faturamento (mês)", valor: "—" },
        { label: "Economia anual", valor: "R$ 3.118,80", ref: "vs InChurch Loja Inteligente" },
      ]}
      acoes={[
        { href: "/admin/loja/produtos/novo", label: "Novo produto" },
        { href: "/admin/loja/pedidos", label: "Ver pedidos" },
      ]}
      faseRoadmap="F10 — Catálogo: devocionais, livros citados em pregações (link automático com F6), camisetas, materiais kids. Checkout Safe2Pay (reusa F2). Loja embutida no PWA membro."
    />
  );
}
