import { ModuloShell } from "@/components/modulo-shell";
import Link from "next/link";

export const metadata = { title: "Financeiro" };

export default function FinanceiroPage() {
  return (
    <ModuloShell
      titulo="Financeiro"
      descricao="Entradas, saídas, doações Safe2Pay (recorrentes e avulsas), campanhas, conciliação OFX, multi-conta por igreja."
      stats={[
        { label: "Saldo total", valor: "—", ref: "InChurch: R$ 75.273" },
        { label: "Entradas (mês)", valor: "—" },
        { label: "Saídas (mês)", valor: "—", ref: "InChurch: R$0 — nunca lançadas" },
        { label: "Doações recorrentes", valor: "—", ref: "Hoje: 0 ativas" },
      ]}
      acoes={[
        { href: "/admin/financeiro/lancamentos/novo", label: "Lançar" },
        { href: "/admin/financeiro/campanhas/nova", label: "Nova campanha" },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">🎯 Ação 2 do plano — Recorrência Safe2Pay</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Potencial estimado: R$ 50-150k/ano. Hoje 0 doações recorrentes.
            </p>
          </div>
          <Link
            href="/admin/financeiro/recorrencia"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Configurar
          </Link>
        </div>
      </section>
    </ModuloShell>
  );
}
