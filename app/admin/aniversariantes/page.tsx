import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";

export const metadata = { title: "Aniversariantes" };
export const dynamic = "force-dynamic";

function diaMes(d: Date): { dia: number; mes: number } {
  return { dia: d.getDate(), mes: d.getMonth() };
}

function calcularIdade(nasc: Date, ref: Date): number {
  let idade = ref.getFullYear() - nasc.getFullYear();
  const m = ref.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < nasc.getDate())) idade--;
  return idade;
}

type Search = { mes?: string };

const NOMES_MES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default async function AniversariantesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const hoje = new Date();
  const sp = await searchParams;
  const mesAlvo = sp.mes ? Number(sp.mes) - 1 : hoje.getMonth();

  // Busca todos com data de nascimento e filtra em memória (PostgreSQL não tem
  // "extract month" indexável trivial via Prisma — 2.731 membros é OK assim)
  const membros = await prisma.membro.findMany({
    where: { dataNascimento: { not: null }, status: "ATIVO" },
    select: {
      id: true,
      nome: true,
      dataNascimento: true,
      telefone: true,
      igreja: { select: { nome: true } },
    },
  });

  const doMes = membros
    .filter((m) => m.dataNascimento && m.dataNascimento.getMonth() === mesAlvo)
    .sort((a, b) => a.dataNascimento!.getDate() - b.dataNascimento!.getDate());

  const hojeMD = diaMes(hoje);
  const aniversariantesHoje = membros.filter(
    (m) =>
      m.dataNascimento &&
      m.dataNascimento.getDate() === hojeMD.dia &&
      m.dataNascimento.getMonth() === hojeMD.mes,
  );

  // Próximos 7 dias
  const proximos7: typeof membros = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date(hoje);
    d.setDate(d.getDate() + i);
    const dm = diaMes(d);
    for (const m of membros) {
      if (
        m.dataNascimento &&
        m.dataNascimento.getDate() === dm.dia &&
        m.dataNascimento.getMonth() === dm.mes
      ) {
        proximos7.push(m);
      }
    }
  }

  return (
    <ModuloShell
      titulo="Aniversariantes"
      descricao="Filhos de Deus celebrando vida. Push automático dispara no dia."
      stats={[
        { label: "Hoje", valor: aniversariantesHoje.length },
        { label: "Próximos 7 dias", valor: proximos7.length },
        { label: `${NOMES_MES[mesAlvo]}`, valor: doMes.length },
      ]}
    >
      {aniversariantesHoje.length > 0 && (
        <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-amber-200">
            🎂 Aniversariam HOJE
          </h2>
          <ul className="mt-3 space-y-1">
            {aniversariantesHoje.map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-amber-100">
                  {m.nome}
                  <span className="ml-2 text-xs opacity-70">
                    {calcularIdade(m.dataNascimento!, hoje)} anos
                  </span>
                </span>
                {m.telefone && (
                  <a
                    href={`https://wa.me/55${m.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Feliz aniversário, ${m.nome.split(" ")[0]}! Que Deus continue te abençoando.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-300 underline"
                  >
                    parabenizar WhatsApp
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="flex flex-wrap items-center gap-2 text-sm">
        {NOMES_MES.map((nome, i) => (
          <Link
            key={i}
            href={`/admin/aniversariantes?mes=${i + 1}`}
            className={`rounded-full px-3 py-1 ${
              i === mesAlvo
                ? "bg-primary/15 text-primary"
                : "border border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
          >
            {nome.slice(0, 3)}
          </Link>
        ))}
      </nav>

      {proximos7.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Próximos 7 dias
          </h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {proximos7.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm"
              >
                <span>{m.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {m.dataNascimento!.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          {NOMES_MES[mesAlvo]} ({doMes.length})
        </h2>
        {doMes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguém faz aniversário neste mês.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Dia</th>
                  <th className="px-3 py-2 text-left">Nome</th>
                  <th className="px-3 py-2 text-left">Igreja</th>
                  <th className="px-3 py-2 text-left">Idade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {doMes.map((m) => (
                  <tr key={m.id}>
                    <td className="px-3 py-2 font-mono">
                      {String(m.dataNascimento!.getDate()).padStart(2, "0")}
                    </td>
                    <td className="px-3 py-2 font-medium">{m.nome}</td>
                    <td className="px-3 py-2 text-muted-foreground">{m.igreja.nome}</td>
                    <td className="px-3 py-2">{calcularIdade(m.dataNascimento!, hoje)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ModuloShell>
  );
}
