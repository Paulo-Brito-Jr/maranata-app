import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { EmptyState } from "@/components/empty-state";
import { Field, Input, Button, Select } from "@/components/ui/field";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import {
  criarAtalhoAction,
  toggleAtalhoAction,
  excluirAtalhoAction,
} from "./actions";

export const metadata = { title: "Atalhos" };
export const dynamic = "force-dynamic";

export default async function AtalhosPage() {
  const ctx = await getIgrejaContexto();
  const filtroIgreja = filtroIgrejaWhere(ctx);
  const atalhoWhere = filtroIgreja.igrejaId
    ? { OR: [{ igrejaId: null }, { igrejaId: filtroIgreja.igrejaId }] }
    : {};

  const [atalhos, igrejas] = await Promise.all([
    prisma.atalho.findMany({
      where: atalhoWhere,
      include: { igreja: { select: { nome: true, apelido: true } } },
      orderBy: [{ ativo: "desc" }, { ordem: "asc" }],
    }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true, apelido: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  return (
    <ModuloShell
      titulo="Atalhos"
      descricao="Cards de atalho que aparecem na home do membro (PWA). Geral aparece pra todos; local só pra unidade."
      stats={[
        { label: "Total", valor: atalhos.length },
        { label: "Ativos", valor: atalhos.filter((a) => a.ativo).length },
        { label: "Gerais", valor: atalhos.filter((a) => !a.igrejaId).length },
      ]}
    >
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Novo atalho</h2>
        <form action={criarAtalhoAction} className="grid gap-3 md:grid-cols-2">
          <Field label="Título" required>
            <Input name="titulo" required placeholder="Ex.: Doar agora" />
          </Field>
          <Field label="URL/Link" required>
            <Input name="linkUrl" required placeholder="/doar ou https://..." />
          </Field>
          <Field label="Ícone (lucide)" hint="ex: heart, calendar, gift">
            <Input name="icone" placeholder="heart" />
          </Field>
          <Field label="Ordem">
            <Input type="number" name="ordem" defaultValue={0} />
          </Field>
          <Field label="Escopo" className="md:col-span-2">
            <Select name="igrejaId" defaultValue="GERAL">
              <option value="GERAL">🌐 Geral (todas as 14 unidades)</option>
              {igrejas.map((ig) => (
                <option key={ig.id} value={ig.id}>📍 Local — {ig.apelido ?? ig.nome}</option>
              ))}
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Button type="submit">Criar atalho</Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Atalhos ({atalhos.length})
        </h2>
        {atalhos.length === 0 ? (
          <EmptyState titulo="Sem atalhos" descricao="Crie o primeiro acima." />
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {atalhos.map((a) => (
              <li
                key={a.id}
                className={`rounded-2xl border bg-card p-4 ${
                  a.ativo ? "border-border" : "border-dashed opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{a.titulo}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.linkUrl}</p>
                  </div>
                  {a.igreja ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                      📍 {a.igreja.apelido ?? a.igreja.nome}
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] text-blue-700 dark:text-blue-300">
                      🌐 Geral
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-1 text-xs">
                  <Link
                    href={`/admin/atalhos/${a.id}/editar`}
                    className="rounded-full bg-primary/15 px-2 py-1 text-primary hover:bg-primary/25"
                  >
                    Editar
                  </Link>
                  <form action={toggleAtalhoAction.bind(null, a.id, !a.ativo)}>
                    <button className="rounded-full bg-secondary/60 px-2 py-1 hover:bg-secondary">
                      {a.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                  <form action={excluirAtalhoAction.bind(null, a.id)}>
                    <button className="rounded-full bg-red-500/10 px-2 py-1 text-red-600 hover:bg-red-500/20 dark:text-red-400">
                      Excluir
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </ModuloShell>
  );
}
