import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Células" };

export default function CelulasPage() {
  return (
    <ModuloShell
      titulo="Células"
      descricao="Redes, células, líderes, participantes e relatórios."
      stats={[
        { label: "Células ativas", valor: "—", ref: "InChurch: 62" },
        { label: "Redes", valor: "—" },
        { label: "Participantes", valor: "—", ref: "InChurch: 713" },
        { label: "Visitantes (mês)", valor: "—", ref: "InChurch: 85" },
      ]}
      acoes={[{ href: "/admin/celulas/nova", label: "Nova célula" }]}
      faseRoadmap="F5 — CRUD células, redes, supervisores, líderes, auxiliares, participantes, visitantes. 9 análises estratégicas (estratégia, segmentação, comparecimento, adesão, demográficos, doações, supervisão, classificação, integração). Buscador público estilo inchur.ch/K58OW."
    />
  );
}
