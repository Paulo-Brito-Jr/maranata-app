import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { dataPtBR } from "@/lib/utils";
import { PushToggle } from "@/components/push-toggle";

export const metadata = { title: "Início" };
export const dynamic = "force-dynamic";

function saudacao(hora = new Date().getHours()): string {
  if (hora < 5) return "Boa madrugada";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function primeiroNome(nome: string): string {
  return nome.split(/\s+/)[0] ?? nome;
}

export default async function MembroHome() {
  const user = await getCurrentUser();
  const inicioAno = new Date(new Date().getFullYear(), 0, 1);

  const membro = user
    ? await prisma.membro.findFirst({
        where: { email: { equals: user.email, mode: "insensitive" } },
        select: { id: true, dataNascimento: true },
      })
    : null;

  const proxEvento = await prisma.evento.findFirst({
    where: { publicado: true, inicio: { gte: new Date() } },
    orderBy: { inicio: "asc" },
    select: { titulo: true, slug: true, inicio: true },
  });

  const proxPregacao = await prisma.pregacao.findFirst({
    where: { publicada: true },
    orderBy: [{ data: "desc" }, { criadaEm: "desc" }],
    select: { titulo: true, id: true, pregador: true },
  });

  const stats = membro
    ? await prisma.$transaction([
        prisma.inscricaoEvento.count({
          where: { membroId: membro.id, criadoEm: { gte: inicioAno } },
        }),
        prisma.pedidoOracao.count({
          where: { membroId: membro.id, criadoEm: { gte: inicioAno } },
        }),
        prisma.doacao.count({
          where: {
            membroId: membro.id,
            status: "PAGA",
            criadaEm: { gte: inicioAno },
          },
        }),
        prisma.testemunho.count({
          where: { membroId: membro.id, criadoEm: { gte: inicioAno } },
        }),
      ])
    : null;

  const aniversarioHoje =
    membro?.dataNascimento &&
    membro.dataNascimento.getDate() === new Date().getDate() &&
    membro.dataNascimento.getMonth() === new Date().getMonth();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-brand-orange to-brand-blue p-6 text-brand-orange-foreground shadow-xl">
        <p className="text-xs uppercase tracking-widest opacity-80">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long" })}
        </p>
        <h1 className="mt-2 text-2xl font-bold">
          {saudacao()}, {user ? primeiroNome(user.name) : "família"}!
        </h1>
        {aniversarioHoje && (
          <p className="mt-1 text-sm font-medium">
            🎂 Hoje é seu aniversário! A família Maranata celebra com você.
          </p>
        )}
        {proxEvento && (
          <p className="mt-1 text-sm opacity-90">
            Próximo evento: <strong>{proxEvento.titulo}</strong> ·{" "}
            {dataPtBR(proxEvento.inicio)}
          </p>
        )}
        <Link
          href="/membro/eventos"
          className="mt-4 inline-block rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/30"
        >
          Ver agenda →
        </Link>
      </section>

      {stats && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Seu {new Date().getFullYear()} na Maranata
          </h2>
          <div className="grid grid-cols-4 gap-2">
            <MiniStat valor={stats[0]} label="eventos" />
            <MiniStat valor={stats[1]} label="orações" />
            <MiniStat valor={stats[2]} label="doações" />
            <MiniStat valor={stats[3]} label="testemunhos" />
          </div>
          <Link
            href="/membro/historico"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            ver histórico completo →
          </Link>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-semibold">🤝 Seja parceiro da Maranata</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua semente faz a diferença. Doe uma vez ou de forma recorrente.
        </p>
        <Link
          href="/doar"
          className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Doar agora
        </Link>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Pra você
        </h2>
        <div className="grid gap-3">
          {proxPregacao && (
            <Card
              titulo={`🎙 ${proxPregacao.titulo}`}
              desc={proxPregacao.pregador ?? "Última pregação"}
              href="/membro/pregacoes"
            />
          )}
          <Card titulo="❤️ Pedidos de oração" desc="Sua fé fortalece outros" href="/membro/oracao" />
          <Card
            titulo="✨ Testemunhos"
            desc="O que Deus tem feito"
            href="/membro/testemunhos"
          />
          <Card titulo="👥 Sua célula" desc="Encontros e relatos" href="/membro/celula" />
        </div>
      </section>

      <PushToggle />
    </div>
  );
}

function Card({ titulo, desc, href }: { titulo: string; desc: string; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-secondary/40"
    >
      <div className="font-medium">{titulo}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}

function MiniStat({ valor, label }: { valor: number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-2 py-3 text-center">
      <div className="text-xl font-bold">{valor}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
