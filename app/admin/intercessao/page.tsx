import { prisma } from "@/lib/prisma";
import { ModuloShell } from "@/components/modulo-shell";
import { dataPtBR } from "@/lib/utils";
import { atualizarStatusPedido, publicarTestemunho, criarPedido, responderPedido } from "./actions";

export const metadata = { title: "Intercessão" };
export const dynamic = "force-dynamic";

export default async function IntercessaoPage() {
  const [pedidos, testemunhos, contagens] = await Promise.all([
    prisma.pedidoOracao.findMany({
      include: {
        sentimento: { select: { nome: true, emoji: true } },
        membro: { select: { nome: true } },
        respostas: { orderBy: { criadoEm: "desc" }, take: 3 },
      },
      orderBy: [{ status: "asc" }, { criadoEm: "desc" }],
      take: 50,
    }),
    prisma.testemunho.findMany({
      include: { membro: { select: { nome: true } } },
      orderBy: { criadoEm: "desc" },
      take: 30,
    }),
    Promise.all([
      prisma.pedidoOracao.count({ where: { status: "ABERTO" } }),
      prisma.pedidoOracao.count({ where: { status: "EM_ORACAO" } }),
      prisma.pedidoOracao.count({ where: { status: "RESPONDIDO" } }),
      prisma.testemunho.count({ where: { publicado: true } }),
    ]),
  ]);

  const [abertos, emOracao, respondidos, testemPublicos] = contagens;

  return (
    <ModuloShell
      titulo="Intercessão"
      descricao="Pedidos de oração, testemunhos públicos, sentimentos e escala de intercessores."
      stats={[
        { label: "Abertos", valor: abertos, ref: "InChurch: 483 (14 desde out/2025!)" },
        { label: "Em oração", valor: emOracao },
        { label: "Respondidos", valor: respondidos },
        { label: "Testemunhos públicos", valor: testemPublicos, ref: "InChurch: 654 todos privados" },
      ]}
    >
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
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Pedidos recentes
        </h2>
        <div className="space-y-2">
          {pedidos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem pedidos.</p>
          ) : (
            pedidos.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-border bg-card p-4 text-sm"
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
                  <span className="text-xs text-muted-foreground">{dataPtBR(p.criadoEm)}</span>
                </div>
                <p className="mt-2 whitespace-pre-line">{p.pedido}</p>
                {p.respostas.length > 0 && (
                  <div className="mt-3 space-y-2 rounded-xl bg-secondary/40 p-3">
                    {p.respostas.map((resposta) => (
                      <div key={resposta.id}>
                        <div className="text-xs text-muted-foreground">
                          Resposta em {dataPtBR(resposta.criadoEm)}
                        </div>
                        <p className="mt-1 whitespace-pre-line text-sm">{resposta.texto}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{p.status}</span>
                  {p.status === "ABERTO" && (
                    <form action={atualizarStatusPedido.bind(null, p.id, "EM_ORACAO")}>
                      <button className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-secondary">
                        Marcar em oração
                      </button>
                    </form>
                  )}
                  {p.status === "EM_ORACAO" && (
                    <form action={atualizarStatusPedido.bind(null, p.id, "RESPONDIDO")}>
                      <button className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-secondary">
                        Marcar respondido
                      </button>
                    </form>
                  )}
                  {p.status !== "ARQUIVADO" && (
                    <form action={atualizarStatusPedido.bind(null, p.id, "ARQUIVADO")}>
                      <button className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-secondary">
                        Arquivar
                      </button>
                    </form>
                  )}
                </div>
                {p.status !== "ARQUIVADO" && (
                  <form action={responderPedido.bind(null, p.id)} className="mt-3 flex gap-2">
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
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Testemunhos
        </h2>
        <div className="space-y-2">
          {testemunhos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem testemunhos.</p>
          ) : (
            testemunhos.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-border bg-card p-4 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{t.membro?.nome ?? t.nomeAvulso ?? "Anônimo"}</span>
                  <form action={publicarTestemunho.bind(null, t.id, !t.publicado)}>
                    <button className="rounded-full border border-border bg-card px-3 py-1 text-xs hover:bg-secondary">
                      {t.publicado ? "Despublicar" : "Publicar"}
                    </button>
                  </form>
                </div>
                <p className="mt-2 whitespace-pre-line">{t.texto}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </ModuloShell>
  );
}
