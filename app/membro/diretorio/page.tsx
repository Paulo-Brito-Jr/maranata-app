import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Users } from "lucide-react";

export const metadata = { title: "Diretório" };
export const dynamic = "force-dynamic";

type Search = { q?: string; igreja?: string };

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function DiretorioPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redir=/membro/diretorio");

  const sp = await searchParams;
  const where: import("@prisma/client").Prisma.MembroWhereInput = {
    optDiretorio: true,
    status: "ATIVO",
  };
  if (sp.q) where.nome = { contains: sp.q, mode: "insensitive" };
  if (sp.igreja) where.igrejaId = sp.igreja;

  const [membros, igrejas] = await Promise.all([
    prisma.membro.findMany({
      where,
      select: {
        id: true,
        nome: true,
        fotoUrl: true,
        bio: true,
        profissao: true,
        igreja: { select: { nome: true } },
      },
      orderBy: { nome: "asc" },
      take: 100,
    }),
    prisma.igreja.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-brand-orange">
          <Users className="size-3.5" /> Diretório
        </div>
        <h1 className="mt-1 text-2xl font-bold">A família Maranata</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Membros que aceitaram aparecer no diretório. Pra entrar, ative em{" "}
          <Link href="/membro/perfil/editar" className="text-primary underline">
            editar perfil
          </Link>
          .
        </p>
      </header>

      <form className="space-y-3">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar por nome"
          className="w-full rounded-full border border-input bg-background px-4 py-2.5 text-sm shadow-sm focus:border-primary focus:outline-none"
        />
        <select
          name="igreja"
          defaultValue={sp.igreja ?? ""}
          className="w-full rounded-full border border-input bg-background px-4 py-2.5 text-sm"
        >
          <option value="">Todas as igrejas</option>
          {igrejas.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nome}
            </option>
          ))}
        </select>
      </form>

      {membros.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
          Nenhum membro encontrado. Seja o primeiro a aparecer aqui!
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {membros.map((m) => (
            <li
              key={m.id}
              className="rounded-2xl border border-border bg-card p-4 text-center"
            >
              {m.fotoUrl ? (
                <Image
                  src={m.fotoUrl}
                  alt={m.nome}
                  width={64}
                  height={64}
                  className="mx-auto size-16 rounded-full object-cover"
                />
              ) : (
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-brand-blue text-lg font-bold text-white">
                  {iniciais(m.nome)}
                </div>
              )}
              <p className="mt-2 line-clamp-2 font-medium">{m.nome}</p>
              <p className="text-xs text-muted-foreground">{m.igreja.nome}</p>
              {m.profissao && (
                <p className="text-[10px] text-muted-foreground">{m.profissao}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Privacidade respeitada — só aparece quem opta por entrar.
      </p>
    </div>
  );
}
