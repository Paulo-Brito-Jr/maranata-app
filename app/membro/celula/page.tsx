import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Sua célula" };
export const dynamic = "force-dynamic";

const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export default async function MembroCelula() {
  const user = await getCurrentUser();
  if (!user) return null;

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true, igrejaId: true },
  });

  const participante = membro
    ? await prisma.participanteCelula.findFirst({
        where: { membroId: membro.id, ativo: true },
        include: {
          celula: {
            include: {
              igreja: { select: { nome: true } },
              rede: { select: { nome: true, cor: true } },
              lideres: {
                include: { membro: { select: { nome: true } } },
              },
            },
          },
        },
      })
    : null;

  // Sem célula: oferecer células ativas da mesma igreja
  let sugestoes: Awaited<ReturnType<typeof prisma.celula.findMany>> = [];
  if (!participante && membro) {
    sugestoes = await prisma.celula.findMany({
      where: { igrejaId: membro.igrejaId, status: "ATIVA" },
      orderBy: { nome: "asc" },
      take: 10,
    });
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-brand-orange">
          Sua célula
        </p>
        <h1 className="mt-1 text-2xl font-bold">Comunhão</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A vida acontece na célula.
        </p>
      </header>

      {participante ? (
        <article className="rounded-2xl border border-brand-orange/30 bg-card p-5">
          {participante.celula.rede && (
            <span
              className="inline-block rounded-full px-2 py-0.5 text-xs"
              style={{
                backgroundColor:
                  (participante.celula.rede.cor ?? "#888") + "33",
              }}
            >
              {participante.celula.rede.nome}
            </span>
          )}
          <h2 className="mt-2 text-xl font-semibold">
            {participante.celula.nome}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {participante.celula.igreja.nome}
          </p>

          <dl className="mt-4 space-y-2 text-sm">
            {participante.celula.diaSemana !== null && (
              <div className="flex items-center gap-2">
                <dt className="text-muted-foreground">📅</dt>
                <dd>
                  {DIAS[participante.celula.diaSemana]}
                  {participante.celula.horario && ` às ${participante.celula.horario}`}
                </dd>
              </div>
            )}
            {participante.celula.endereco && (
              <div className="flex items-center gap-2">
                <dt className="text-muted-foreground">📍</dt>
                <dd>{participante.celula.endereco}</dd>
              </div>
            )}
            {participante.celula.lideres.length > 0 && (
              <div className="flex items-start gap-2">
                <dt className="text-muted-foreground">👤</dt>
                <dd>
                  {participante.celula.lideres
                    .map((l) => l.membro.nome)
                    .join(", ")}
                </dd>
              </div>
            )}
          </dl>
        </article>
      ) : (
        <>
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
            <p className="text-3xl">🏠</p>
            <h2 className="mt-2 text-base font-semibold">
              Você ainda não está em uma célula
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {membro
                ? "Encontre uma célula perto de você abaixo."
                : "Peça pro admin associar sua conta a um membro pra ver suas células."}
            </p>
          </div>

          {sugestoes.length > 0 && (
            <section>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Células ativas na sua igreja
              </h3>
              <div className="space-y-2">
                {sugestoes.map((c) => (
                  <article
                    key={c.id}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <h4 className="font-semibold">{c.nome}</h4>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {c.diaSemana !== null && (
                        <span>
                          {DIAS[c.diaSemana]}
                          {c.horario && ` · ${c.horario}`}
                        </span>
                      )}
                      {c.cidade && <span>{c.cidade}</span>}
                    </div>
                  </article>
                ))}
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Procura uma célula que combine com você?{" "}
                <Link href="/membro" className="text-primary underline">
                  Fala com a liderança da sua igreja
                </Link>
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
