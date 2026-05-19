import Link from "next/link";
import { PushToggle } from "@/components/push-toggle";

export const metadata = { title: "Início" };

export default function MembroHome() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-brand-orange to-brand-blue p-6 text-brand-orange-foreground shadow-xl">
        <p className="text-xs uppercase tracking-widest opacity-80">Hoje na Maranata</p>
        <h1 className="mt-2 text-2xl font-bold">Bom dia, família!</h1>
        <p className="mt-1 text-sm opacity-90">
          Domingo · Veja os horários da sua igreja local
        </p>
        <Link
          href="/membro/eventos/hoje"
          className="mt-4 inline-block rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-white/30"
        >
          Ver agenda →
        </Link>
      </section>

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
          {[
            { titulo: "Últimas pregações", desc: "Pr. da Sede", href: "/membro/pregacoes" },
            { titulo: "Pedidos de oração", desc: "Sua fé fortalece outros", href: "/membro/oracao" },
            { titulo: "Testemunhos", desc: "O que Deus tem feito", href: "/membro/testemunhos" },
            { titulo: "Sua célula", desc: "Encontros e relatos", href: "/membro/celula" },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-secondary/40"
            >
              <div className="font-medium">{c.titulo}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      <PushToggle />
    </div>
  );
}
