import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { brl } from "@/lib/utils";
import { getAppUrl } from "@/lib/safe2pay/config";

export const metadata = { title: "Financeiro" };
export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const fimMes = new Date(inicioMes);
  fimMes.setMonth(fimMes.getMonth() + 1);

  const [entradas, saidas, totalDoacoesRecorrentes, campanhasAtivas] = await Promise.all([
    prisma.lancamentoFinanceiro.aggregate({
      _sum: { valor: true },
      where: { tipo: "ENTRADA", data: { gte: inicioMes, lt: fimMes } },
    }),
    prisma.lancamentoFinanceiro.aggregate({
      _sum: { valor: true },
      where: { tipo: "SAIDA", data: { gte: inicioMes, lt: fimMes } },
    }),
    prisma.safe2PayAssinatura.count({ where: { ativa: true } }),
    prisma.campanha.findMany({
      where: { ativa: true },
      orderBy: { criadaEm: "desc" },
      take: 5,
    }),
  ]);

  const entrMes = Number(entradas._sum.valor ?? 0);
  const saiMes = Number(saidas._sum.valor ?? 0);
  const liquido = entrMes - saiMes;
  const doacaoUrl = `${getAppUrl()}/doar`;
  const whatsappTexto = encodeURIComponent(
    `Contribua com a obra da Igreja Missionária Evangélica Maranata: ${doacaoUrl}`,
  );

  return (
    <ModuloShell
      titulo="Financeiro"
      descricao="Entradas, saídas, doações Safe2Pay (recorrentes e avulsas), campanhas, conciliação OFX, multi-conta por igreja."
      stats={[
        { label: "Entradas (mês)", valor: brl(entrMes) },
        { label: "Saídas (mês)", valor: brl(saiMes), ref: "InChurch: R$0 — nunca lançadas" },
        { label: "Líquido (mês)", valor: brl(liquido) },
        { label: "Recorrentes ativas", valor: totalDoacoesRecorrentes },
      ]}
      acoes={[
        { href: "/admin/financeiro/lancamentos/novo", label: "Novo lançamento" },
        { href: "/admin/financeiro/campanhas/nova", label: "Nova campanha" },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">🎯 Ação 2 do plano — Recorrência Safe2Pay</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Potencial estimado: R$ 50-150k/ano. Hoje {totalDoacoesRecorrentes} doações recorrentes ativas.
            </p>
          </div>
          <Link
            href="/doar"
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Ver página pública
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Divulgação do link de doações</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use este link em push, WhatsApp, QR Code impresso ou telão. Ele aceita doação avulsa e dízimo mensal.
            </p>
            <code className="mt-3 block rounded-xl bg-secondary px-3 py-2 text-sm">{doacaoUrl}</code>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={doacaoUrl}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
            >
              Abrir link
            </a>
            <a
              href={`https://wa.me/?text=${whatsappTexto}`}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Compartilhar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Campanhas ativas</h2>
            <Link href="/admin/financeiro/campanhas" className="text-xs text-primary hover:underline">
              Ver todas →
            </Link>
          </div>
          {campanhasAtivas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma campanha ativa.{" "}
              <Link href="/admin/financeiro/campanhas/nova" className="text-primary hover:underline">
                Crie a primeira
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {campanhasAtivas.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/admin/financeiro/campanhas/${c.id}`}
                    className="font-medium hover:text-primary"
                  >
                    {c.titulo}
                  </Link>
                  <span className="text-muted-foreground">
                    {brl(Number(c.arrecadado))}
                    {c.meta && ` / ${brl(Number(c.meta))}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Atalhos</h2>
          <div className="grid gap-2 text-sm">
            <Link
              href="/admin/financeiro/lancamentos"
              className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-secondary"
            >
              <span>Todos os lançamentos</span>
              <span className="text-muted-foreground">→</span>
            </Link>
            <Link
              href="/admin/financeiro/campanhas"
              className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-secondary"
            >
              <span>Todas as campanhas</span>
              <span className="text-muted-foreground">→</span>
            </Link>
            <Link
              href="/admin/financeiro/categorias"
              className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-secondary"
            >
              <span>Categorias</span>
              <span className="text-muted-foreground">→</span>
            </Link>
          </div>
        </div>
      </section>
    </ModuloShell>
  );
}
