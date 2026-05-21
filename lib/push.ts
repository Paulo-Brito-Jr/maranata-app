import webpush from "web-push";
import type { MinisterioGeral } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:digital@igrejamaranata.com.br";

let configurado = false;
function configurar() {
  if (configurado) return;
  if (!PUBLIC || !PRIVATE) {
    throw new Error("VAPID keys ausentes (NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY)");
  }
  webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);
  configurado = true;
}

export type PushPayload = {
  titulo: string;
  corpo: string;
  url?: string;
  tag?: string;
};

export type PushAlvo =
  | { tipo: "TODOS" }
  | { tipo: "USUARIO"; usuarioId: string }
  | { tipo: "USUARIOS"; usuarioIds: string[] }
  | { tipo: "USUARIO_APP"; usuarioAppId: string }
  | { tipo: "IGREJA"; igrejaId: string }
  /**
   * Targeting combinável e multi-seleção. Cada array adiciona um AND entre
   * dimensões; dentro do array é OR (qualquer item match).
   * - igrejaIds: lista de unidades específicas
   * - regionalIds: lista de regionais (todas igrejas das regionais)
   * - ministerios: lista de ministérios (Kids hoje, demais futuro)
   * Listas vazias = sem filtro nessa dimensão (broadcast).
   */
  | {
      tipo: "SEGMENTADO";
      igrejaIds?: string[];
      regionalIds?: string[];
      ministerios?: MinisterioGeral[];
    };

export async function enviarPush(
  alvo: PushAlvo,
  payload: PushPayload,
): Promise<{ enviados: number; falhas: number; removidos: number }> {
  configurar();

  const where = (() => {
    switch (alvo.tipo) {
      case "TODOS":
        return { ativa: true };
      case "USUARIO":
        return { ativa: true, usuarioId: alvo.usuarioId };
      case "USUARIOS":
        return { ativa: true, usuarioId: { in: alvo.usuarioIds } };
      case "USUARIO_APP":
        return { ativa: true, usuarioAppId: alvo.usuarioAppId };
      case "IGREJA":
        return {
          ativa: true,
          OR: [
            { usuario: { membro: { igrejaId: alvo.igrejaId } } },
            { usuarioApp: { igrejaId: alvo.igrejaId } },
          ],
        };
      case "SEGMENTADO": {
        const conditions: Record<string, unknown>[] = [];

        // Igrejas (lista): OR entre as escolhidas.
        const igrejaIds = alvo.igrejaIds ?? [];
        const regionalIds = alvo.regionalIds ?? [];
        const ministerios = alvo.ministerios ?? [];

        if (igrejaIds.length > 0 || regionalIds.length > 0) {
          const orUnidades: Record<string, unknown>[] = [];
          if (igrejaIds.length > 0) {
            orUnidades.push({
              usuario: { membro: { igrejaId: { in: igrejaIds } } },
            });
            orUnidades.push({ usuarioApp: { igrejaId: { in: igrejaIds } } });
          }
          if (regionalIds.length > 0) {
            orUnidades.push({
              usuario: { membro: { igreja: { regionalId: { in: regionalIds } } } },
            });
            orUnidades.push({
              usuarioApp: { igreja: { regionalId: { in: regionalIds } } },
            });
          }
          conditions.push({ OR: orUnidades });
        }

        // Ministério: hoje só Kids tem vínculo via Membro.responsaveisKids.
        // Outros ministérios virão quando tiverem tabela própria.
        if (ministerios.includes("KIDS")) {
          conditions.push({
            usuario: {
              membro: {
                responsaveisKids: { some: { crianca: { ativa: true } } },
              },
            },
          });
        }

        return conditions.length === 0
          ? { ativa: true }
          : { ativa: true, AND: conditions };
      }
    }
  })();

  const subs = await prisma.pushSubscription.findMany({ where });
  if (subs.length === 0) return { enviados: 0, falhas: 0, removidos: 0 };

  const body = JSON.stringify(payload);
  let enviados = 0;
  let falhas = 0;
  const expiradas: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.authKey },
          },
          body,
        );
        enviados++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          expiradas.push(sub.id);
        } else {
          falhas++;
        }
      }
    }),
  );

  if (expiradas.length > 0) {
    await prisma.pushSubscription.updateMany({
      where: { id: { in: expiradas } },
      data: { ativa: false },
    });
  }

  if (enviados > 0) {
    await prisma.pushSubscription.updateMany({
      where: { id: { in: subs.map((s) => s.id) } },
      data: { ultimoEnvio: new Date() },
    });
  }

  return { enviados, falhas, removidos: expiradas.length };
}
