import Link from "next/link";

export const metadata = { title: "Painel" };

const ATALHOS = [
  { href: "/admin/membros/novo", titulo: "Novo membro", desc: "Cadastrar pessoa" },
  { href: "/admin/eventos/novo", titulo: "Novo evento", desc: "Agendar celebração" },
  { href: "/admin/financeiro/lancamentos/novo", titulo: "Lançamento", desc: "Receita ou despesa" },
  { href: "/admin/push/novo", titulo: "Enviar push", desc: "Comunicar 6.662 usuários" },
];

const STATS = [
  { label: "Membros", valor: "—", referencia: "InChurch tinha 2.731" },
  { label: "Usuários no app", valor: "—", referencia: "InChurch tinha 6.662" },
  { label: "Eventos ativos", valor: "—", referencia: "InChurch tinha 315" },
  { label: "Células", valor: "—", referencia: "InChurch tinha 62" },
];

export default function AdminHome() {
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
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-2 text-3xl font-semibold">{s.valor}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.referencia}</div>
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
        <h2 className="font-semibold">Plataforma em construção</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Este painel substitui o InChurch (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            br.com.inchurch.missionariaevangmaranata
          </code>
          ). Cada módulo da sidebar abre seu shell — o CRUD operacional é construído nas
          próximas fases (F2-F10). Auditoria do InChurch continua em{" "}
          <Link href="https://maranata-app-paulo-brito.vercel.app" className="underline">
            maranata-app-dashboard
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
