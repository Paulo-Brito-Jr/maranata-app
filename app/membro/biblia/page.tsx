import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LIVROS, versiculoDoDia } from "@/lib/biblia";
import { BookOpen, Share2 } from "lucide-react";

export const metadata = { title: "Bíblia" };
export const dynamic = "force-dynamic";

export default async function BibliaIndex() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redir=/membro/biblia");

  const v = versiculoDoDia();

  const membro = await prisma.membro.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
    select: { id: true },
  });

  const [planos, minhasInscricoes] = await Promise.all([
    prisma.planoLeitura.findMany({
      where: { publicado: true },
      orderBy: { criadoEm: "desc" },
      take: 6,
    }),
    membro
      ? prisma.planoLeituraInscricao.findMany({
          where: { membroId: membro.id, concluidaEm: null },
          include: { plano: { select: { titulo: true, id: true } } },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  const at = LIVROS.filter((l) => l.testamento === "AT");
  const nt = LIVROS.filter((l) => l.testamento === "NT");

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-br from-brand-blue via-brand-blue/95 to-brand-orange p-6 text-white shadow-xl">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-80">
          <BookOpen className="size-4" /> Versículo do dia
        </div>
        <p className="mt-3 text-lg leading-relaxed">«{v.texto}»</p>
        <p className="mt-2 text-sm font-semibold opacity-90">— {v.ref}</p>
        <div className="mt-4 flex gap-2">
          <Link
            href={`/membro/biblia/${v.slug}/${v.cap}#v${v.v}`}
            className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-white/30"
          >
            Ler em contexto
          </Link>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`"${v.texto}" — ${v.ref}\n\nhttps://maranata.app`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-white/30"
          >
            <Share2 className="size-3" /> Compartilhar
          </a>
        </div>
      </section>

      {minhasInscricoes.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Seus planos de leitura
          </h2>
          <ul className="space-y-2">
            {minhasInscricoes.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-3"
              >
                <div>
                  <p className="font-medium">{i.plano.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    dia {i.diaAtual} · {i.diasConcluidos.length} concluído(s)
                  </p>
                </div>
                <span className="text-primary">→</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {planos.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Planos disponíveis
          </h2>
          <ul className="space-y-2">
            {planos.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl border border-border bg-card p-3 hover:border-primary/40"
              >
                <p className="font-medium">{p.titulo}</p>
                {p.descricao && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {p.descricao}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Antigo Testamento ({at.length})
        </h2>
        <ul className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-4">
          {at.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/membro/biblia/${l.slug}`}
                className="block rounded-xl border border-border bg-card px-2 py-2 text-center hover:border-primary/40 hover:bg-secondary/40"
              >
                {l.nome}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Novo Testamento ({nt.length})
        </h2>
        <ul className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-4">
          {nt.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/membro/biblia/${l.slug}`}
                className="block rounded-xl border border-border bg-card px-2 py-2 text-center hover:border-primary/40 hover:bg-secondary/40"
              >
                {l.nome}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Texto base: João Ferreira de Almeida — fonte aberta. Outras versões em breve.
      </p>
    </div>
  );
}
