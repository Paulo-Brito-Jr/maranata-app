import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { brl, dataPtBR } from "@/lib/utils";

export const metadata = { title: "Meu histórico" };
export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redir=/membro/historico");

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true, nome: true },
  });

  const [doacoes, inscricoes, pedidos, jornadas] = await Promise.all([
    prisma.doacao.findMany({
      where: {
        OR: [
          membro ? { membroId: membro.id } : { id: "__none__" },
          { emailDoador: { equals: user.email, mode: "insensitive" } },
        ],
      },
      orderBy: { criadaEm: "desc" },
      take: 50,
      include: { campanha: { select: { titulo: true } } },
    }),
    membro
      ? prisma.inscricaoEvento.findMany({
          where: { membroId: membro.id },
          orderBy: { criadoEm: "desc" },
          take: 50,
          include: { evento: { select: { titulo: true, inicio: true, slug: true } } },
        })
      : Promise.resolve([]),
    membro
      ? prisma.pedidoOracao.findMany({
          where: { membroId: membro.id },
          orderBy: { criadoEm: "desc" },
          take: 50,
        })
      : Promise.resolve([]),
    membro
      ? prisma.pessoaJornada.findMany({
          where: { membroId: membro.id },
          orderBy: { iniciadaEm: "desc" },
          include: { trilha: { select: { titulo: true } } },
        })
      : Promise.resolve([]),
  ]);

  const totalDoado = doacoes
    .filter((d) => d.status === "PAGA")
    .reduce((acc, d) => acc + Number(d.valor), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Meu histórico</h1>
        <p className="text-sm text-muted-foreground">
          Tudo que você participou na Maranata.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3">
        <Stat label="Doações" valor={brl(totalDoado)} hint={`${doacoes.length} registro(s)`} />
        <Stat label="Eventos" valor={String(inscricoes.length)} hint="inscrições" />
        <Stat label="Oração" valor={String(pedidos.length)} hint="pedidos enviados" />
        <Stat label="Jornadas" valor={String(jornadas.length)} hint="trilhas em andamento/feitas" />
      </section>

      <Bloco titulo="Doações recentes" vazio="Você ainda não tem doações registradas.">
        {doacoes.length > 0 && (
          <ul className="divide-y divide-border">
            {doacoes.slice(0, 10).map((d) => (
              <li key={d.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.campanha?.titulo ?? "Doação avulsa"}</p>
                  <p className="text-xs text-muted-foreground">
                    {dataPtBR(d.criadaEm)} · {d.formaPagamento}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{brl(Number(d.valor))}</p>
                  <p className={`text-[10px] uppercase tracking-widest ${corStatus(d.status)}`}>
                    {d.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      <Bloco titulo="Eventos inscritos" vazio="Nenhuma inscrição em evento por enquanto.">
        {inscricoes.length > 0 && (
          <ul className="divide-y divide-border">
            {inscricoes.slice(0, 10).map((i) => (
              <li key={i.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <Link
                    href={`/eventos/${i.evento.slug}`}
                    className="block truncate font-medium hover:text-primary"
                  >
                    {i.evento.titulo}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {dataPtBR(i.evento.inicio)} · {i.status}
                  </p>
                </div>
                <code className="font-mono text-[10px] text-muted-foreground">
                  {i.qrCode.slice(0, 8)}
                </code>
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      <Bloco titulo="Pedidos de oração" vazio="Sem pedidos por enquanto.">
        {pedidos.length > 0 && (
          <ul className="divide-y divide-border">
            {pedidos.slice(0, 10).map((p) => (
              <li key={p.id} className="py-3">
                <p className="line-clamp-2 text-sm">{p.pedido}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {dataPtBR(p.criadoEm)} · {p.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Bloco>

      <Bloco titulo="Jornadas" vazio="Você ainda não começou uma jornada.">
        {jornadas.length > 0 && (
          <ul className="divide-y divide-border">
            {jornadas.map((j) => (
              <li key={j.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">{j.trilha.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Iniciada em {dataPtBR(j.iniciadaEm)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                    j.status === "CONCLUIDA"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {j.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Bloco>
    </div>
  );
}

function Stat({ label, valor, hint }: { label: string; valor: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{valor}</p>
      <p className="text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function Bloco({
  titulo,
  vazio,
  children,
}: {
  titulo: string;
  vazio: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
        {titulo}
      </h2>
      <div className="mt-3">
        {children ?? <p className="text-sm text-muted-foreground">{vazio}</p>}
      </div>
    </section>
  );
}

function corStatus(status: string): string {
  if (status === "PAGA") return "text-emerald-300";
  if (status === "PENDENTE") return "text-amber-300";
  if (status === "CANCELADA" || status === "FALHA") return "text-red-300";
  return "text-muted-foreground";
}
