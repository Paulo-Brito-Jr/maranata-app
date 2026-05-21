import { cookies } from "next/headers";
import type { MinisterioGeral } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, type EffectiveUser } from "@/lib/auth";

export const IGREJA_CONTEXTO_COOKIE = "maranata_app_igreja_atual";

export type IgrejaAcessivel = {
  id: string;
  nome: string;
  apelido: string | null;
  ehSede: boolean;
};

export type IgrejaContexto =
  | { tipo: "todas"; igrejas: IgrejaAcessivel[] }
  | { tipo: "selecionada"; igreja: IgrejaAcessivel; igrejas: IgrejaAcessivel[] }
  | { tipo: "unica"; igreja: IgrejaAcessivel }
  | { tipo: "sem-acesso" };

/**
 * Lista as igrejas que o usuário pode visualizar dado seu papel + (opcional)
 * ministério geral que ele cobre.
 *
 * Estrutura: 1 Sede (administrativa, ehSede=true) + 14 Congregações.
 *
 * - SUPER_ADMIN / PASTOR_DIRETORIA: vê todas (Sede + 14 congregações).
 * - PastorGeralMinisterio do ministerioPagina: vê todas, mas só naquela área.
 * - ADMIN_IGREJA / outros: só a sua igrejaId (vindo do JWT).
 *
 * Por padrão exclui a Sede do retorno (`incluirSede=false`), porque pra fins
 * de filtro local "Sede" é o equivalente a "Geral" — listar como opção
 * separada confunde. Quando precisar incluir (ex: navegação topbar), passar
 * `incluirSede=true`.
 */
export async function getIgrejasAcessiveis(
  user: EffectiveUser,
  opts?: { ministerioPagina?: MinisterioGeral; incluirSede?: boolean },
): Promise<IgrejaAcessivel[]> {
  const incluirSede = opts?.incluirSede ?? false;
  const todas = await prisma.igreja.findMany({
    where: { ativa: true, ...(incluirSede ? {} : { ehSede: false }) },
    orderBy: [{ ehSede: "desc" }, { nome: "asc" }],
    select: { id: true, nome: true, apelido: true, ehSede: true },
  });

  if (user.role === "SUPER_ADMIN" || user.role === "PASTOR_DIRETORIA") {
    return todas;
  }

  if (opts?.ministerioPagina) {
    const usuario = await prisma.usuario.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        pastorGeralMinisterios: {
          where: { ministerio: opts.ministerioPagina, ativo: true },
          select: { ministerio: true },
        },
      },
    });
    if (usuario && usuario.pastorGeralMinisterios.length > 0) {
      return todas;
    }
  }

  if (user.igrejaId) {
    const minha = todas.find((i) => i.id === user.igrejaId);
    return minha ? [minha] : [];
  }

  return [];
}

/**
 * Resolve o contexto atual de igreja: combina o cookie de seleção
 * com o que o user pode acessar. Retorna 'unica' quando só tem acesso a
 * uma; 'todas' quando pode ver todas e não filtrou; 'selecionada' quando
 * pode ver várias mas escolheu uma.
 */
export async function getIgrejaContexto(opts?: {
  ministerioPagina?: MinisterioGeral;
  incluirSede?: boolean;
}): Promise<IgrejaContexto> {
  const user = await getCurrentUser();
  if (!user) return { tipo: "sem-acesso" };

  const igrejas = await getIgrejasAcessiveis(user, opts);
  if (igrejas.length === 0) return { tipo: "sem-acesso" };
  if (igrejas.length === 1) return { tipo: "unica", igreja: igrejas[0] };

  const cookieStore = await cookies();
  const escolhida = cookieStore.get(IGREJA_CONTEXTO_COOKIE)?.value;
  const igreja = escolhida ? igrejas.find((i) => i.id === escolhida) : undefined;
  if (igreja) return { tipo: "selecionada", igreja, igrejas };

  return { tipo: "todas", igrejas };
}

/**
 * Helper pra construir filtro `where` Prisma respeitando o contexto.
 * Quando 'todas' retorna {} (sem filtro), quando 'unica'/'selecionada'
 * retorna { igrejaId }, quando 'sem-acesso' retorna filtro vazio
 * (callers devem verificar tipo antes).
 */
export function filtroIgrejaWhere(ctx: IgrejaContexto): { igrejaId?: string } {
  if (ctx.tipo === "unica" || ctx.tipo === "selecionada") {
    return { igrejaId: ctx.igreja.id };
  }
  return {};
}
