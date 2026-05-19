import { ModuloShell } from "@/components/modulo-shell";
import { CheckoutForm } from "./checkout-form";

export const metadata = { title: "Retirada Kids" };

export default function CheckoutPage() {
  return (
    <ModuloShell
      titulo="Retirar criança"
      descricao="Leia o QR do ticket ou digite o código. Quem retira precisa estar na lista de autorizados."
      stats={[]}
      acoes={[{ href: "/admin/kids", label: "← Voltar" }]}
    >
      <CheckoutForm />
    </ModuloShell>
  );
}
