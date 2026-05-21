import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { MaranataLogo } from "@/components/maranata-logo";
import {
  getCurrentUser,
  getDefaultRedirectForUser,
  rolesPodemAdministrar,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BannerCarousel } from "./_components/banner-carousel";

export const dynamic = "force-dynamic";

const UNIDADES = [
  "Sede Tijuca",
  "Méier",
  "Duque de Caxias",
  "Copacabana",
  "Jacarepaguá",
  "Irajá",
  "Campo Grande",
  "São João de Meriti",
  "Recreio",
  "Nova Iguaçu",
  "Jardim Primavera",
  "Vila São Luiz",
  "Lote XV",
  "Rio das Ostras",
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const areaHref = user ? getDefaultRedirectForUser(user) : "/login";
  const areaLabel = user
    ? rolesPodemAdministrar(user.role)
      ? "Abrir painel"
      : "Meu espaço"
    : "Entrar";
  const greeting = user ? `Entrou como ${user.name.split(" ")[0]}.` : null;

  const agora = new Date();
  const [banners, atalhos] = await Promise.all([
    prisma.banner.findMany({
      where: {
        ativo: true,
        AND: [
          { OR: [{ inicio: null }, { inicio: { lte: agora } }] },
          { OR: [{ fim: null }, { fim: { gte: agora } }] },
        ],
      },
      orderBy: [{ ordem: "asc" }, { criadoEm: "desc" }],
      take: 5,
    }),
    prisma.atalho.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: "asc" }, { titulo: "asc" }],
      take: 80,
    }),
  ]);

  return (
    <main className="min-h-screen">
      <header className="faixa-brand text-brand-blue-foreground">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm uppercase tracking-widest opacity-80">
                IME
              </div>
              <div className="text-lg font-semibold">Maranata App</div>
            </div>
            <MaranataLogo size={40} className="bg-white/95 rounded-full p-1" />
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/eventos" className="hover:underline">
              Eventos
            </Link>
            <Link href="/downloads" className="hover:underline">
              Downloads
            </Link>
            <Link href="/loja" className="hover:underline">
              Loja
            </Link>
            <Link href="/doar" className="hover:underline">
              Doar
            </Link>
            <Link
              href={areaHref}
              className="rounded-full bg-white/20 px-4 py-1.5 hover:bg-white/30"
            >
              {areaLabel}
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-brand-orange">
              Igreja Missionária Evangélica Maranata
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Tudo da sua igreja num só lugar.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              15 unidades · 2.731 membros · 6.662 usuários no app. Eventos,
              células, pregações, intercessão e contribuição — feitos por nós,
              pra nós.
            </p>
            {greeting ? (
              <p className="mt-3 text-sm font-medium text-brand-blue">
                {greeting}
              </p>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={areaHref}
                className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90"
              >
                {user ? "Continuar no app" : "🤝 Seja parceiro da Maranata"}
              </Link>
              <Link
                href="/eventos"
                className="rounded-full border border-border bg-card px-6 py-3 font-medium hover:bg-secondary"
              >
                Ver eventos
              </Link>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-border bg-card p-6 shadow-xl shadow-brand-blue/10">
            <h2 className="text-lg font-semibold">Nossas unidades</h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {UNIDADES.map((u) => (
                <li
                  key={u}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <span className="size-1.5 rounded-full bg-brand-orange" />
                  {u}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Sede administrativa: Rua Conde de Bonfim, 229 · Tijuca · RJ
            </p>
          </div>
        </div>
      </section>

      {banners.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-12">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Em destaque
          </h2>
          <BannerCarousel
            banners={banners.map((b) => ({
              id: b.id,
              titulo: b.titulo,
              subtitulo: b.subtitulo,
              imagemUrl: b.imagemUrl,
              linkUrl: b.linkUrl,
            }))}
          />
        </section>
      )}

      {atalhos.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Atalhos rápidos
          </h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {atalhos.map((a) => (
              <li key={a.id}>
                <a
                  href={a.linkUrl}
                  target={a.linkUrl.startsWith("http") ? "_blank" : undefined}
                  rel={
                    a.linkUrl.startsWith("http") ? "noreferrer" : undefined
                  }
                  className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-center text-sm transition hover:border-primary/40 hover:bg-secondary/30"
                >
                  {a.icone && /^https?:\/\//.test(a.icone) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.icone}
                      alt=""
                      className="size-10 rounded-lg object-contain"
                      loading="lazy"
                    />
                  ) : a.icone ? (
                    <span className="text-2xl" aria-hidden>
                      {a.icone}
                    </span>
                  ) : null}
                  <span className="line-clamp-2 text-xs font-medium">
                    {a.titulo}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Igreja Missionária Evangélica Maranata ·
          CNPJ 42.117.804/0001-15
        </p>
        <p className="mt-1 text-xs opacity-70">
          v0.1 · plataforma própria em construção
        </p>
      </footer>
    </main>
  );
}
