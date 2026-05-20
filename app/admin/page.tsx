import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { brl } from "@/lib/utils";

export const metadata = { title: "Painel" };
export const dynamic = "force-dynamic";

const ATALHOS = [
  { href: "/admin/membros/novo", titulo: "Novo membro", desc: "Cadastrar pessoa" },
  { href: "/admin/eventos/novo", titulo: "Novo evento", desc: "Agendar celebração" },
  { href: "/admin/financeiro/lancamentos/novo", titulo: "Lançamento", desc: "Receita ou despesa" },
  { href: "/admin/push", titulo: "Enviar push", desc: "Comunicar usuários do app" },
];

export default async function AdminHome() {
  const [membros, usuariosApp, eventos, celulas, doacoesPagas, pedidos] = await Promise.all([
    prisma.membro.count(),
    prisma.usuarioApp.count(),
    prisma.evento.count({ where: { inicio: { gte: new Date() } } }),
    prisma.celula.count({ where: { status: "ATIVA" } }),
    prisma.doacao.aggregate({ _sum: { valor: true }, where: { status: "PAGA" } }),
    prisma.pedidoOracao.count({ where: { status: "ABERTO" } }),
  ]);

  const STATS = [
    { label: "Membros", valor: membros, ref: "InChurch tinha 2.731" },
    { label: "Usuários no app", valor: usuariosApp, ref: "InChurch tinha 6.662" },
    { label: "Eventos ativos", valor: eventos, ref: "InChurch tinha 315" },
    { label: "Células ativas", valor: celulas, ref: "InChurch tinha 62" },
    { label: "Doações arrecadadas", valor: brl(Number(doacoesPagas._sum.valor ?? 0)) },
    { label: "Pedidos de oração", valor: pedidos, ref: "InChurch: 483 (14 atrasados!)" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
        <p className="mt-1 text-muted-foreground">
          Sua plataforma da Maranata. Tudo num só lugar.
        </p>
      </header>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Visão geral
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-2 text-3xl font-semibold">{s.valor}</div>
              {s.ref && <div className="mt-1 text-xs text-muted-foreground">{s.ref}</div>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Atalhos
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {ATALHOS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-secondary/50"
            >
              <div className="font-medium group-hover:text-primary">{a.titulo}</div>
              <div className="mt-1 text-xs text-muted-foreground">{a.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-dashed border-border bg-accent/20 p-6">
        <h2 className="font-semibold">Substituindo o InChurch</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta é a versão própria da Maranata. Os 9 módulos ({" "}
          <Link href="/admin/membros" className="underline">membresia</Link>,{" "}
          <Link href="/admin/celulas" className="underline">células</Link>,{" "}
          <Link href="/admin/eventos" className="underline">eventos</Link>,{" "}
          <Link href="/admin/pregacoes" className="underline">pregações</Link>,{" "}
          <Link href="/admin/financeiro" className="underline">financeiro</Link>,{" "}
          <Link href="/admin/intercessao" className="underline">intercessão</Link>,{" "}
          <Link href="/admin/kids" className="underline">kids</Link>,{" "}
          <Link href="/admin/jornadas" className="underline">jornadas</Link> e{" "}
          <Link href="/admin/loja" className="underline">loja</Link>) já estão funcionais nesta
          plataforma com CRUDs operacionais.
        </p>
      </section>
    </div>
  );
}
