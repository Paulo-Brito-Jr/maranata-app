import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CriarPedidoForm } from "./criar-form";

export const metadata = { title: "Oração" };
export const dynamic = "force-dynamic";

function dataRelativa(d: Date): string {
  const diff = Date.now() - d.getTime();
  const dias = Math.floor(diff / 86400000);
  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `${dias}d atrás`;
  if (dias < 30) return `${Math.floor(dias / 7)}sem atrás`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const STATUS_LABEL: Record<string, { label: string; cor: string }> = {
  ABERTO: { label: "Aberto", cor: "bg-secondary/60 text-muted-foreground" },
  EM_ORACAO: { label: "Em oração", cor: "bg-brand-orange/15 text-brand-orange" },
  RESPONDIDO: { label: "Respondido", cor: "bg-emerald-500/15 text-emerald-300" },
  ARQUIVADO: { label: "Arquivado", cor: "bg-secondary/40 text-muted-foreground/60" },
};

export default async function MembroOracao() {
  const user = await getCurrentUser();

  const membro = user
    ? await prisma.membro.findFirst({
        where: { email: { equals: user.email, mode: "insensitive" } },
        select: { id: true },
      })
    : null;

  const meusPedidos = membro
    ? await prisma.pedidoOracao.findMany({
        where: { membroId: membro.id },
        include: { respostas: { select: { id: true } } },
        orderBy: { criadoEm: "desc" },
        take: 20,
      })
    : [];

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-brand-orange">
          Oração
        </p>
        <h1 className="mt-1 text-2xl font-bold">Pedidos & intercessão</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A casa Maranata ora por você. Compartilhe seu pedido.
        </p>
      </header>

      <CriarPedidoForm />

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Meus pedidos
        </h2>

        {!membro ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Pra ver seus pedidos, peça pro admin associar sua conta a um membro.
          </div>
        ) : meusPedidos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Você ainda não fez nenhum pedido. Compartilhe acima.
          </div>
        ) : (
          <div className="space-y-2">
            {meusPedidos.map((p) => {
              const tag = STATUS_LABEL[p.status] ?? STATUS_LABEL.ABERTO;
              return (
                <article
                  key={p.id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-3 text-sm leading-relaxed">
                      {p.pedido}
                    </p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${tag.cor}`}
                    >
                      {tag.label}
                    </span>
                  </div>
                  <footer className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{dataRelativa(p.criadoEm)}</span>
                    {p.respostas.length > 0 && (
                      <span>{p.respostas.length} resposta(s) recebida(s)</span>
                    )}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
