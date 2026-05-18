import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Configurações" };

export default function ConfigPage() {
  return (
    <ModuloShell
      titulo="Configurações"
      descricao="Igrejas, papéis e permissões, feature flags, integração Safe2Pay, importação InChurch."
      acoes={[
        { href: "/admin/config/igrejas", label: "Igrejas (15)" },
        { href: "/admin/config/papeis", label: "Papéis & RBAC" },
        { href: "/admin/config/integracoes", label: "Integrações" },
        { href: "/admin/config/inchurch-import", label: "Importar InChurch" },
      ]}
      faseRoadmap="Mapa de 15 unidades (Sede + 14 congregações) já modelado no schema. RBAC ligado ao Brito Auth (project_rbac_familia)."
    />
  );
}
