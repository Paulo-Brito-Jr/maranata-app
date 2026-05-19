import Link from "next/link";
import Image from "next/image";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Mic, Heart, PlayCircle, Search } from "lucide-react";

export const metadata = { title: "Pregações" };
export const dynamic = "force-dynamic";

function dataCurta(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function thumb(p: { youtubeId: string | null; capaUrl: string | null }): string | null {
  if (p.capaUrl) return p.capaUrl;
  if (p.youtubeId) return `https://img.youtube.com/vi/${p.youtubeId}/mqdefault.jpg`;
  return null;
}

type Search = { q?: string; categoria?: string; serie?: string; pregador?: string };

export default async function MembroPregacoes({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;

  const where: Prisma.PregacaoWhereInput = { publicada: true };
  if (sp.q) where.titulo = { contains: sp.q, mode: "insensitive" };
  if (sp.categoria) where.categoriaId = sp.categoria;
  if (sp.serie) where.serieId = sp.serie;
  if (sp.pregador) where.pregador = { equals: sp.pregador, mode: "insensitive" };

  const [pregacoes, total, categorias, series, pregadores] = await Promise.all([
    prisma.pregacao.findMany({
      where,
      include: {
        categoria: { select: { nome: true } },
        serie: { select: { titulo: true } },
        _count: { select: { favoritos: true } },
      },
      orderBy: [{ data: "desc" }, { criadaEm: "desc" }],
      take: 30,
    }),
    prisma.pregacao.count({ where: { publicada: true } }),
    prisma.categoriaPregacao.findMany({ orderBy: { nome: "asc" } }),
    prisma.seriePregacao.findMany({ orderBy: { titulo: "asc" } }),
    prisma.pregacao.findMany({
      where: { publicada: true, pregador: { not: null } },
      distinct: ["pregador"],
      select: { pregador: true },
      take: 30,
    }),
  ]);

  const membro = user
    ? await prisma.membro.findFirst({
        where: { email: { equals: user.email, mode: "insensitive" } },
        select: { id: true },
      })
    : null;

  const continuar = membro
    ? await prisma.pregacaoProgresso.findMany({
        where: { membroId: membro.id, concluido: false },
        include: {
          pregacao: { select: { id: true, titulo: true, youtubeId: true, capaUrl: true } },
        },
        orderBy: { ultimaVistaEm: "desc" },
        take: 3,
      })
    : [];

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-orange">
          <Mic className="size-3.5" /> Pregações
        </div>
        <h1 className="mt-1 text-2xl font-bold">A Palavra na Maranata</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} pregações no acervo.</p>
      </header>

      <form className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar por título"
          className="w-full rounded-full border border-input bg-background px-10 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none"
        />
      </form>

      <div className="flex flex-wrap gap-2 text-xs">
        <Chip href="/membro/pregacoes" ativo={!sp.categoria && !sp.serie && !sp.pregador}>
          Todas
        </Chip>
        {categorias.slice(0, 6).map((c) => (
          <Chip
            key={c.id}
            href={`/membro/pregacoes?categoria=${c.id}`}
            ativo={sp.categoria === c.id}
          >
            {c.nome}
          </Chip>
        ))}
        {series.slice(0, 4).map((s) => (
          <Chip
            key={s.id}
            href={`/membro/pregacoes?serie=${s.id}`}
            ativo={sp.serie === s.id}
          >
            🎬 {s.titulo}
          </Chip>
        ))}
        {pregadores
          .filter((p) => p.pregador)
          .slice(0, 4)
          .map((p) => (
            <Chip
              key={p.pregador!}
              href={`/membro/pregacoes?pregador=${encodeURIComponent(p.pregador!)}`}
              ativo={sp.pregador === p.pregador}
            >
              👤 {p.pregador}
            </Chip>
          ))}
      </div>

      {continuar.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Continuar assistindo
          </h2>
          <ul className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
            {continuar.map((c) => {
              const img = thumb(c.pregacao);
              return (
                <li key={c.id} className="w-48 shrink-0">
                  <Link
                    href={`/membro/pregacoes/${c.pregacao.id}`}
                    className="block overflow-hidden rounded-xl border border-border bg-card"
                  >
                    {img && (
                      <div
                        className="h-24 w-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${img})` }}
                      />
                    )}
                    <div className="p-2">
                      <p className="line-clamp-2 text-xs font-medium">{c.pregacao.titulo}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {Math.floor(c.posicaoSeg / 60)}min assistidos
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {pregacoes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhuma pregação encontrada com esses filtros.
        </div>
      ) : (
        <div className="space-y-3">
          {pregacoes.map((p) => {
            const img = thumb(p);
            return (
              <Link
                key={p.id}
                href={`/membro/pregacoes/${p.id}`}
                className="block overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40"
              >
                {img && (
                  <div className="relative h-40 w-full">
                    <Image
                      src={img}
                      alt={p.titulo}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/15">
                      <PlayCircle className="size-12 text-white/90 drop-shadow-lg" />
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{dataCurta(p.data)}</span>
                    <div className="flex items-center gap-2">
                      {p.serie && (
                        <span className="rounded-full bg-secondary/60 px-2 py-0.5">
                          🎬 {p.serie.titulo}
                        </span>
                      )}
                      {p.categoria && (
                        <span className="rounded-full bg-secondary/60 px-2 py-0.5">
                          {p.categoria.nome}
                        </span>
                      )}
                    </div>
                  </div>
                  <h2 className="mt-1 text-base font-semibold leading-tight">{p.titulo}</h2>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    {p.pregador && <span>{p.pregador}</span>}
                    <div className="flex items-center gap-3">
                      {p._count.favoritos > 0 && (
                        <span className="flex items-center gap-1">
                          <Heart className="size-3 fill-current text-rose-400" />
                          {p._count.favoritos}
                        </span>
                      )}
                      {p.execucoes > 0 && <span>{p.execucoes} ▶</span>}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({
  href,
  children,
  ativo,
}: {
  href: string;
  children: React.ReactNode;
  ativo?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full border px-3 py-1 transition ${
        ativo
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
