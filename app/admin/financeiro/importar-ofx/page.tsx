import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { FormOfx } from "./form-client";

export const metadata = { title: "Importar OFX" };
export const dynamic = "force-dynamic";

export default async function ImportarOfxPage() {
  const [igrejas, contas] = await Promise.all([
    prisma.igreja.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.contaBancaria.findMany({
      where: { ativa: true },
      select: { id: true, nome: true, igrejaId: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <ModuloShell
      titulo="Importar OFX"
      descricao="Concilie o extrato bancário com os lançamentos existentes. Transações sem match viram lançamentos PENDENTES pra revisão."
      acoes={[{ href: "/admin/financeiro", label: "← Voltar" }]}
    >
      <FormOfx igrejas={igrejas} contas={contas} />

      <section className="rounded-2xl border border-dashed border-border bg-card/40 p-5 text-sm text-muted-foreground">
        <h3 className="mb-2 text-sm font-medium uppercase tracking-widest">Como funciona</h3>
        <ul className="space-y-1.5">
          <li>
            <strong className="text-foreground">Match exato:</strong> mesma conta · mesmo tipo
            (entrada/saída) · mesmo valor (absoluto) · data ± 1 dia · status ≠ cancelado.
          </li>
          <li>
            <strong className="text-foreground">Match único:</strong> marca o lançamento como{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5">CONCILIADO</code>.
          </li>
          <li>
            <strong className="text-foreground">Múltiplos matches:</strong> concilia o primeiro
            não-conciliado e conta como &ldquo;conflito&rdquo; pra revisão manual.
          </li>
          <li>
            <strong className="text-foreground">Sem match:</strong> cria como{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5">PENDENTE</code> com descrição vinda
            do <code className="rounded bg-secondary px-1.5 py-0.5">MEMO</code> do OFX.
          </li>
        </ul>
      </section>
    </ModuloShell>
  );
}
