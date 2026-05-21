import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Encontre uma célula | Maranata",
  description:
    "Buscador público de células da IME Maranata. Filtre por igreja, dia da semana, rede e bairro pra encontrar a célula perto de você.",
};
export const dynamic = "force-dynamic";

const DIAS_SEMANA = [
  { v: 0, nome: "Domingo" },
  { v: 1, nome: "Segunda-feira" },
  { v: 2, nome: "Terça-feira" },
  { v: 3, nome: "Quarta-feira" },
  { v: 4, nome: "Quinta-feira" },
  { v: 5, nome: "Sexta-feira" },
  { v: 6, nome: "Sábado" },
] as const;

const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

const EMAIL_INTERESSE = "secretaria@igrejamaranata.com.br";

async function flagAtiva(chave: string): Promise<boolean> {
  const f = await prisma.featureFlag.findUnique({ where: { chave } });
  return Boolean(f?.habilitada);
}

function diaLabel(d: number | null | undefined): string {
  if (d == null) return "Dia a confirmar";
  return DIAS_SEMANA[d]?.nome ?? "—";
}

function diaCurtoLabel(d: number | null | undefined): string {
  if (d == null) return "—";
  return DIAS_CURTOS[d] ?? "—";
}

function parseDia(raw: string | undefined): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0 || n > 6) return undefined;
  return n;
}

export default async function CelulasPublicasPage({
  searchParams,
}: {
  searchParams?: Promise<{
    igreja?: string;
    dia?: string;
    rede?: string;
    q?: string;
  }>;
}) {
  if (!(await flagAtiva("cell_finder"))) notFound();

  const sp = (await searchParams) ?? {};
  const igrejaSel = sp.igreja?.trim() || undefined;
  const diaSel = parseDia(sp.dia);
  const redeSel = sp.rede?.trim() || undefined;
  const qRaw = sp.q?.trim() ?? "";
  const q = qRaw.slice(0, 80);

  const [igrejas, redes, celulas] = await Promise.all([
    prisma.igreja.findMany({
      where: { ativa: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.rede.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, cor: true },
    }),
    prisma.celula.findMany({
      where: {
        status: "ATIVA",
        ...(igrejaSel ? { igrejaId: igrejaSel } : {}),
        ...(redeSel ? { redeId: redeSel } : {}),
        ...(diaSel != null ? { diaSemana: diaSel } : {}),
        ...(q
          ? {
              OR: [
                { cidade: { contains: q, mode: "insensitive" } },
                { endereco: { contains: q, mode: "insensitive" } },
                { nome: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        igreja: { select: { id: true, nome: true, apelido: true } },
        rede: { select: { id: true, nome: true, cor: true } },
      },
      orderBy: [
        { diaSemana: "asc" },
        { horario: "asc" },
        { nome: "asc" },
      ],
      take: 300,
    }),
  ]);

  const totalAtivas = celulas.length;
  const bairros = new Set<string>();
  for (const c of celulas) {
    const b = c.cidade?.trim();
    if (b) bairros.add(b.toLowerCase());
  }
  const totalBairros = bairros.size;

  const filtrosAtivos =
    Boolean(igrejaSel) || diaSel != null || Boolean(redeSel) || Boolean(q);

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm font-medium uppercase tracking-widest text-brand-orange">
          Comunhão · Discipulado · Multiplicação
        </p>
        <h1 className="mt-1 text-3xl font-bold">
          Encontre uma célula perto de você
        </h1>
        <p className="mt-1 text-muted-foreground">
          As células são pequenos grupos que se reúnem nas casas durante a
          semana para oração, comunhão e estudo da Palavra.{" "}
          {totalAtivas > 0 && totalBairros > 0
            ? `${totalAtivas} ${totalAtivas === 1 ? "célula ativa" : "células ativas"} em ${totalBairros} ${totalBairros === 1 ? "bairro" : "bairros"}${filtrosAtivos ? " conforme seu filtro." : "."}`
            : "Use os filtros abaixo para encontrar a sua."}
        </p>
      </header>

      <form
        method="GET"
        className="rounded-3xl border border-border bg-card p-5 shadow-lg shadow-brand-blue/10 md:p-6"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Igreja
            </span>
            <select
              name="igreja"
              defaultValue={igrejaSel ?? ""}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="">Todas as 14 unidades</option>
              {igrejas.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Dia da semana
            </span>
            <select
              name="dia"
              defaultValue={diaSel != null ? String(diaSel) : ""}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="">Qualquer dia</option>
              {DIAS_SEMANA.map((d) => (
                <option key={d.v} value={d.v}>
                  {d.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Rede (opcional)
            </span>
            <select
              name="rede"
              defaultValue={redeSel ?? ""}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            >
              <option value="">Todas as redes</option>
              {redes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Bairro ou rua
            </span>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Ex: Tijuca, Méier, Conde de Bonfim…"
              maxLength={80}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Os filtros funcionam juntos. Combine-os para refinar a busca.
          </p>
          <div className="flex flex-wrap gap-2">
            {filtrosAtivos && (
              <Link
                href="/celulas"
                className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/70"
              >
                Limpar filtros
              </Link>
            )}
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90"
            >
              Buscar
            </button>
          </div>
        </div>
      </form>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            {filtrosAtivos
              ? `Resultados (${totalAtivas})`
              : `Todas as células ativas (${totalAtivas})`}
          </h2>
          {celulas.length === 300 && (
            <span className="text-xs text-muted-foreground">
              Mostrando primeiros 300 — refine a busca
            </span>
          )}
        </div>

        {celulas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma célula encontrada com esses filtros.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Tente remover algum filtro ou{" "}
              <a
                href={`mailto:${EMAIL_INTERESSE}?subject=${encodeURIComponent("Quero conhecer uma célula Maranata")}`}
                className="font-medium text-primary hover:underline"
              >
                fale com a secretaria
              </a>{" "}
              que ajudamos você a encontrar.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {celulas.map((c) => {
              const igrejaNome = c.igreja.apelido ?? c.igreja.nome;
              const horarioTxt = c.horario?.trim();
              const subject = encodeURIComponent(
                `Tenho interesse na célula "${c.nome}" (${igrejaNome})`,
              );
              const body = encodeURIComponent(
                [
                  `Olá! Tenho interesse em participar da célula "${c.nome}".`,
                  "",
                  `Igreja: ${igrejaNome}`,
                  c.rede ? `Rede: ${c.rede.nome}` : null,
                  c.diaSemana != null
                    ? `Reunião: ${diaLabel(c.diaSemana)}${horarioTxt ? ` às ${horarioTxt}` : ""}`
                    : null,
                  c.endereco ? `Endereço: ${c.endereco}` : null,
                  "",
                  "Por favor, me ajudem com o próximo passo.",
                ]
                  .filter(Boolean)
                  .join("\n"),
              );
              const mailto = `mailto:${EMAIL_INTERESSE}?subject=${subject}&body=${body}`;

              return (
                <article
                  key={c.id}
                  className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-lg hover:shadow-brand-orange/10"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold leading-tight">
                      {c.nome}
                    </h3>
                    {c.rede && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest"
                        style={{
                          backgroundColor:
                            (c.rede.cor ?? "#666") + "22",
                          color: c.rede.cor ?? undefined,
                        }}
                      >
                        {c.rede.nome}
                      </span>
                    )}
                  </div>

                  <div
                    className={cn(
                      "mt-3 flex items-center gap-2 text-sm",
                      c.diaSemana != null
                        ? "text-brand-orange"
                        : "text-muted-foreground",
                    )}
                  >
                    <span
                      aria-hidden
                      className="inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded-full bg-brand-orange/15 px-2 text-[11px] font-semibold uppercase tracking-widest text-brand-orange"
                    >
                      {diaCurtoLabel(c.diaSemana)}
                    </span>
                    <span className="font-medium">
                      {diaLabel(c.diaSemana)}
                      {horarioTxt ? ` · ${horarioTxt}` : ""}
                    </span>
                  </div>

                  {c.endereco && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span aria-hidden>📍 </span>
                      {c.endereco}
                      {c.cidade ? ` — ${c.cidade}` : ""}
                    </p>
                  )}
                  {!c.endereco && c.cidade && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span aria-hidden>📍 </span>
                      {c.cidade}
                    </p>
                  )}

                  {c.descricao && (
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                      {c.descricao}
                    </p>
                  )}

                  <footer className="mt-4 flex items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                    <span className="truncate">
                      <span className="text-foreground/80">Igreja:</span>{" "}
                      {igrejaNome}
                    </span>
                  </footer>

                  <a
                    href={mailto}
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md shadow-primary/30 transition hover:opacity-90"
                  >
                    Tenho interesse
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-brand-blue/30 bg-gradient-to-br from-brand-blue/10 to-brand-orange/10 p-6 md:p-8">
        <h2 className="text-lg font-semibold">Não encontrou uma célula?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Fale com a secretaria pelo e-mail{" "}
          <a
            href={`mailto:${EMAIL_INTERESSE}?subject=${encodeURIComponent("Quero participar de uma célula")}`}
            className="font-medium text-primary hover:underline"
          >
            {EMAIL_INTERESSE}
          </a>{" "}
          que indicamos a célula mais próxima de você.
        </p>
      </section>
    </div>
  );
}
