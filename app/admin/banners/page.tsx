import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { Field, Input, Button, Select } from "@/components/ui/field";
import { dataPtBR } from "@/lib/utils";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import { toggleBannerAction, criarBannerAction, deletarBannerAction } from "./actions";

export const metadata = { title: "Banners" };
export const dynamic = "force-dynamic";

export default async function AdminBanners() {
  const ctx = await getIgrejaContexto();
  const filtroIgreja = filtroIgrejaWhere(ctx);
  const bannerWhere = filtroIgreja.igrejaId
    ? { OR: [{ igrejaId: null }, { igrejaId: filtroIgreja.igrejaId }] }
    : {};

  const [banners, total, totalAtivos, totalCliques, igrejas] = await Promise.all([
    prisma.banner.findMany({
      where: bannerWhere,
      include: { igreja: { select: { nome: true, apelido: true } } },
      orderBy: [{ ativo: "desc" }, { ordem: "asc" }, { criadoEm: "desc" }],
    }),
    prisma.banner.count({ where: bannerWhere }),
    prisma.banner.count({ where: { ativo: true, ...bannerWhere } }),
    prisma.banner.aggregate({ where: bannerWhere, _sum: { cliques: true } }),
    prisma.igreja.findMany({
      where: { ativa: true, tipo: "CONGREGACAO" as const },
      select: { id: true, nome: true, apelido: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const cliques = totalCliques._sum.cliques ?? 0;

  return (
    <ModuloShell
      titulo="Banners"
      descricao="Banners do carousel da homepage e telas internas. Ordem ascendente."
      stats={[
        { label: "Total", valor: total },
        { label: "Ativos", valor: totalAtivos },
        { label: "Cliques", valor: cliques },
      ]}
    >
      <details className="rounded-2xl border border-border bg-card p-5">
        <summary className="cursor-pointer text-sm font-semibold">Criar banner</summary>
        <form action={criarBannerAction} className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Título" required>
            <Input name="titulo" required />
          </Field>
          <Field label="Subtítulo">
            <Input name="subtitulo" />
          </Field>
          <Field label="Imagem URL">
            <Input name="imagemUrl" type="url" />
          </Field>
          <Field label="Link URL">
            <Input name="linkUrl" type="url" />
          </Field>
          <Field label="Ordem">
            <Input name="ordem" type="number" defaultValue={0} />
          </Field>
          <Field label="Início">
            <Input name="inicio" type="date" />
          </Field>
          <Field label="Fim">
            <Input name="fim" type="date" />
          </Field>
          <Field label="Escopo" className="md:col-span-2">
            <Select name="igrejaId" defaultValue="GERAL">
              <option value="GERAL">🌐 Geral (todas as 14 unidades)</option>
              {igrejas.map((ig) => (
                <option key={ig.id} value={ig.id}>
                  📍 Local — {ig.apelido ?? ig.nome}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end md:col-span-2">
            <Button type="submit">Criar banner</Button>
          </div>
        </form>
      </details>

      <section className="space-y-2">
        {banners.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            Sem banners cadastrados ainda.
          </p>
        ) : (
          banners.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border bg-card p-4 ${
                b.ativo ? "border-border" : "border-border/30 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                {b.imagemUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.imagemUrl}
                    alt={b.titulo}
                    className="size-20 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{b.titulo}</h3>
                    <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                      ordem {b.ordem}
                    </span>
                    {b.igreja ? (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-300">
                        📍 {b.igreja.apelido ?? b.igreja.nome}
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-blue-700 dark:text-blue-300">
                        🌐 Geral
                      </span>
                    )}
                    {b.cliques > 0 && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300">
                        {b.cliques} cliques
                      </span>
                    )}
                  </div>
                  {b.subtitulo && <p className="mt-1 text-xs text-muted-foreground">{b.subtitulo}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                    {b.linkUrl && (
                      <a href={b.linkUrl} className="underline" target="_blank" rel="noopener noreferrer">
                        {b.linkUrl}
                      </a>
                    )}
                    {b.inicio && <span>inicia {dataPtBR(b.inicio)}</span>}
                    {b.fim && <span>termina {dataPtBR(b.fim)}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Link
                    href={`/admin/banners/${b.id}/editar`}
                    className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/25"
                  >
                    Editar
                  </Link>
                  <form action={toggleBannerAction.bind(null, b.id, !b.ativo)}>
                    <button
                      type="submit"
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        b.ativo
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      {b.ativo ? "✓ Ativo" : "Desativado"}
                    </button>
                  </form>
                  <form action={deletarBannerAction.bind(null, b.id)}>
                    <button
                      type="submit"
                      className="rounded-full bg-destructive/15 px-3 py-1 text-xs text-destructive"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </ModuloShell>
  );
}
