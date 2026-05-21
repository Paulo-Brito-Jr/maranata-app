import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { dataPtBR } from "@/lib/utils";
import { getIgrejaContexto, filtroIgrejaWhere } from "@/lib/igreja-contexto";
import {
  atualizarStatusPedido,
  publicarTestemunho,
  criarPedido,
  responderPedido,
  runRoundRobinAction,
} from "./actions";
import { AtribuicaoIntercessor } from "./atribuicao-intercessor";

export const metadata = { title: "Intercessão" };
export const dynamic = "force-dynamic";

type SearchParams = {
  filtro?: "todos" | "sem-intercessor" | "antigos";
};

const MS_48H = 48 * 60 * 60 * 1000;

export default async function IntercessaoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filtro = params.filtro ?? "todos";

  const ctx = await getIgrejaContexto();
  const filtroIgreja = filtroIgrejaWhere(ctx);
  // PedidoOracao filtra via membro.igrejaId (modelo não tem campo direto)
  const pedidoIgrejaWhere = filtroIgreja.igrejaId
    ? { membro: { igrejaId: filtroIgreja.igrejaId } }
    : {};
  const testemIgrejaWhere = filtroIgreja.igrejaId
    ? { membro: { igrejaId: filtroIgreja.igrejaId } }
    : {};

  const [
    contagens,
    antigosNaoRespondidos,
    pedidosRecentes,
    pedidosSemIntercessor,
    intercessoresEscalados,
    testemunhos,
  ] = await Promise.all([
    Promise.all([
      prisma.pedidoOracao.count({ where: { status: "ABERTO", ...pedidoIgrejaWhere } }),
      prisma.pedidoOracao.count({ where: { status: "EM_ORACAO", ...pedidoIgrejaWhere } }),
      prisma.pedidoOracao.count({ where: { status: "RESPONDIDO", ...pedidoIgrejaWhere } }),
      prisma.pedidoOracao.count({ where: { status: "ARQUIVADO", ...pedidoIgrejaWhere } }),
      prisma.testemunho.count({ where: { publicado: true, ...testemIgrejaWhere } }),
    ]),
    // 20 mais antigos não respondidos (ABERTO ou EM_ORACAO)
    prisma.pedidoOracao.findMany({
      where: {
        status: { in: ["ABERTO", "EM_ORACAO"] },
        ...pedidoIgrejaWhere,
      },
      include: {
        sentimento: { select: { nome: true, emoji: true } },
        membro: { select: { nome: true } },
      },
      orderBy: { criadoEm: "asc" },
      take: 20,
    }),
    // 30 mais recentes (todos os status)
    prisma.pedidoOracao.findMany({
      where: pedidoIgrejaWhere,
      include: {
        sentimento: { select: { nome: true, emoji: true } },
        membro: { select: { nome: true } },
        respostas: { orderBy: { criadoEm: "desc" }, take: 3 },
      },
      orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
      take: 30,
    }),
    // Pedidos abertos sem intercessor
    prisma.pedidoOracao.findMany({
      where: { status: "ABERTO", intercessorId: null, ...pedidoIgrejaWhere },
      include: {
        sentimento: { select: { nome: true, emoji: true } },
        membro: { select: { nome: true } },
      },
      orderBy: { criadoEm: "asc" },
      take: 100,
    }),
    // Intercessores cadastrados na escala (membros distintos)
    prisma.escalaIntercessao.findMany({
      where: { ativo: true },
      select: { intercessorId: true },
      distinct: ["intercessorId"],
    }),
    prisma.testemunho.findMany({
      where: testemIgrejaWhere,
      include: { membro: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
      take: 15,
    }),
  ]);

  const [abertos, emOracao, respondidos, arquivados, testemPublicos] =
    contagens;

  // Lista de Membros que estão na escala — pra dropdown
  const intercessorIds = intercessoresEscalados
    .map((e) => e.intercessorId)
    .filter(Boolean);
  const membrosEscalados = intercessorIds.length
    ? await prisma.membro.findMany({
        where: { id: { in: intercessorIds } },
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
      })
    : [];

  // Aplica filtro à lista exibida (normaliza pra mesmo shape com respostas opcionais)
  // eslint-disable-next-line react-hooks/purity -- Server Component, snapshot do tempo na renderização
  const agora = Date.now();
  function idade(p: { criadoEm: Date }) {
    return agora - new Date(p.criadoEm).getTime();
  }

  type PedidoExibivel = {
    id: string;
    pedido: string;
    status: (typeof pedidosRecentes)[number]["status"];
    criadoEm: Date;
    intercessorId: string | null;
    nomeAvulso: string | null;
    membro: { nome: string } | null;
    sentimento: { nome: string; emoji: string | null } | null;
    respostas?: { id: string; texto: string; criadoEm: Date }[];
  };

  const pedidosExibir: PedidoExibivel[] =
    filtro === "sem-intercessor"
      ? pedidosSemIntercessor
      : filtro === "antigos"
        ? antigosNaoRespondidos
        : pedidosRecentes;

  return (
    <ModuloShell
      titulo="Intercessão"
      descricao="Pedidos de oração, testemunhos públicos, sentimentos e escala de intercessores."
      acoes={[{ href: "/admin/intercessao/escala", label: "Escala 7×24" }]}
      stats={[
        { label: "Abertos", valor: abertos, ref: "Sem intercessor / aguardando" },
        { label: "Em oração", valor: emOracao, ref: "Atribuídos a intercessor" },
        { label: "Respondidos", valor: respondidos },
        { label: "Arquivados", valor: arquivados },
      ]}
    >
      <section className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Round-robin
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Distribui automaticamente todos os pedidos{" "}
            <strong>ABERTO sem intercessor</strong> entre os{" "}
            <strong>{membrosEscalados.length}</strong> intercessor(es) da escala
            ativa. Marca SLA 48h.
          </p>
          <form action={runRoundRobinAction} className="mt-3">
            <button
              className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
              disabled={membrosEscalados.length === 0 || abertos === 0}
            >
              Rodar round-robin
            </button>
          </form>
          {membrosEscalados.length === 0 && (
            <p className="mt-2 text-xs text-amber-300">
              Nenhum intercessor na escala. Vá em{" "}
              <Link
                href="/admin/intercessao/escala"
                className="underline underline-offset-2"
              >
                Escala 7×24
              </Link>{" "}
              pra cadastrar.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Testemunhos públicos
          </h3>
          <div className="mt-2 text-3xl font-semibold">{testemPublicos}</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Modere todos em{" "}
            <Link
              href="/admin/testemunhos"
              className="underline underline-offset-2"
            >
              /admin/testemunhos
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Bloco "20 mais antigos não respondidos" — alerta */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Mais antigos não respondidos (top 20)
          </h2>
          {antigosNaoRespondidos.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Vermelho = mais de 48h sem resposta
            </span>
          )}
        </div>

        {antigosNaoRespondidos.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
            Tudo em dia — sem pedidos antigos sem resposta.
          </p>
        ) : (
          <ul className="space-y-2">
            {antigosNaoRespondidos.map((p) => {
              const passou48h = idade(p) > MS_48H;
              return (
                <li
                  key={p.id}
                  className={`flex items-start gap-3 rounded-2xl border p-3 text-sm ${
                    passou48h
                      ? "border-destructive/40 bg-destructive/5"
                      : "border-border bg-card"
                  }`}
                >
                  <span
                    className={`mt-1 inline-block size-2 shrink-0 rounded-full ${
                      passou48h ? "bg-destructive" : "bg-amber-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {p.membro?.nome ?? p.nomeAvulso ?? "Anônimo"}
                      </span>
                      {p.sentimento && (
                        <span className="text-xs text-muted-foreground">
                          {p.sentimento.emoji} {p.sentimento.nome}
                        </span>
                      )}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {p.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {dataPtBR(p.criadoEm)}
                      </span>
                      {passou48h && (
                        <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">
                          +48h
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {p.pedido}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Filtro + atribuição de intercessor */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Lista de pedidos
          </h2>
          <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs">
            {(
              [
                { v: "todos", l: "Recentes" },
                { v: "sem-intercessor", l: `Sem intercessor (${pedidosSemIntercessor.length})` },
                { v: "antigos", l: "Mais antigos" },
              ] as const
            ).map((o) => (
              <Link
                key={o.v}
                href={`/admin/intercessao?filtro=${o.v}`}
                className={`rounded-full px-3 py-1.5 transition ${
                  filtro === o.v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.l}
              </Link>
            ))}
          </div>
        </div>

        {filtro === "sem-intercessor" && pedidosSemIntercessor.length > 0 && (
          <AtribuicaoIntercessor
            pedidos={pedidosSemIntercessor.map((p) => ({
              id: p.id,
              nome: p.membro?.nome ?? p.nomeAvulso ?? "Anônimo",
              pedido: p.pedido,
              criadoEm: p.criadoEm.toISOString(),
            }))}
            intercessores={membrosEscalados}
          />
        )}

        <div className="mt-4 space-y-2">
          {pedidosExibir.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem pedidos.</p>
          ) : (
            pedidosExibir.map((p) => {
              const passou48h =
                p.status !== "RESPONDIDO" &&
                p.status !== "ARQUIVADO" &&
                idade(p) > MS_48H;
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border bg-card p-4 text-sm ${
                    passou48h
                      ? "border-destructive/40"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">
                      {p.membro?.nome ?? p.nomeAvulso ?? "Anônimo"}
                      {p.sentimento && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {p.sentimento.emoji} {p.sentimento.nome}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {dataPtBR(p.criadoEm)}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-line">{p.pedido}</p>
                  {"respostas" in p && p.respostas && p.respostas.length > 0 && (
                    <div className="mt-3 space-y-2 rounded-xl bg-secondary/40 p-3">
                      {p.respostas.map((resposta) => (
                        <div key={resposta.id}>
                          <div className="text-xs text-muted-foreground">
                            Resposta em {dataPtBR(resposta.criadoEm)}
                          </div>
                          <p className="mt-1 whitespace-pre-line text-sm">
                            {resposta.texto}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                      {p.status}
                    </span>
                    {passou48h && (
                      <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">
                        +48h
                      </span>
                    )}
                    {p.intercessorId && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                        Atribuído
                      </span>
                    )}
                    {p.status === "ABERTO" && (
                      <form
                        action={atualizarStatusPedido.bind(
                          null,
                          p.id,
                          "EM_ORACAO",
                        )}
                      >
                        <button className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-secondary">
                          Marcar em oração
                        </button>
                      </form>
                    )}
                    {p.status === "EM_ORACAO" && (
                      <form
                        action={atualizarStatusPedido.bind(
                          null,
                          p.id,
                          "RESPONDIDO",
                        )}
                      >
                        <button className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-secondary">
                          Marcar respondido
                        </button>
                      </form>
                    )}
                    {p.status !== "ARQUIVADO" && (
                      <form
                        action={atualizarStatusPedido.bind(
                          null,
                          p.id,
                          "ARQUIVADO",
                        )}
                      >
                        <button className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-secondary">
                          Arquivar
                        </button>
                      </form>
                    )}
                  </div>
                  {p.status !== "ARQUIVADO" && (
                    <form
                      action={responderPedido.bind(null, p.id)}
                      className="mt-3 flex gap-2"
                    >
                      <input
                        name="resposta"
                        required
                        minLength={3}
                        placeholder="Resposta pastoral/intercessão para este pedido"
                        className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      />
                      <button className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90">
                        Responder
                      </button>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Adicionar pedido manualmente</h2>
          <form action={criarPedido} className="space-y-3">
            <input
              name="nome"
              placeholder="Nome (opcional)"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            <textarea
              name="pedido"
              required
              rows={3}
              placeholder="O pedido..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
            <button className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground">
              Adicionar
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Últimos testemunhos</h2>
          <div className="space-y-2">
            {testemunhos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem testemunhos.</p>
            ) : (
              testemunhos.slice(0, 6).map((t) => (
                <div
                  key={t.id}
                  className="rounded-xl border border-border/60 bg-secondary/20 p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">
                      {t.membro?.nome ?? t.nomeAvulso ?? "Anônimo"}
                    </span>
                    <form
                      action={publicarTestemunho.bind(null, t.id, !t.publicado)}
                    >
                      <button className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-secondary">
                        {t.publicado ? "Despublicar" : "Publicar"}
                      </button>
                    </form>
                  </div>
                  <p className="mt-2 line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">
                    {t.texto}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </ModuloShell>
  );
}
