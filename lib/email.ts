/**
 * Email via Resend — stub seguro quando não há API key.
 * Logs em EmailEnvio sempre, mesmo em modo dry-run.
 */
import { prisma } from "@/lib/prisma";

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_DEFAULT = process.env.RESEND_FROM ?? "Maranata <no-reply@maranata.app>";

export type EmailPayload = {
  para: string;
  assunto: string;
  html: string;
  texto?: string;
  template?: string;
  payload?: Record<string, unknown>;
};

export async function enviarEmail(p: EmailPayload): Promise<{
  ok: boolean;
  dryRun: boolean;
  registroId: string;
  resendId?: string;
  erro?: string;
}> {
  const registro = await prisma.emailEnvio.create({
    data: {
      para: p.para,
      assunto: p.assunto,
      template: p.template ?? null,
      payloadJson: p.payload ? (p.payload as object) : undefined,
    },
  });

  if (!RESEND_KEY) {
    await prisma.emailEnvio.update({
      where: { id: registro.id },
      data: { status: "PENDENTE", erroMsg: "RESEND_API_KEY ausente — modo dry-run" },
    });
    return { ok: true, dryRun: true, registroId: registro.id };
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_DEFAULT,
        to: p.para,
        subject: p.assunto,
        html: p.html,
        text: p.texto,
      }),
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => "?");
      await prisma.emailEnvio.update({
        where: { id: registro.id },
        data: { status: "FALHA", erroMsg: `HTTP ${r.status}: ${txt}`.slice(0, 500) },
      });
      return { ok: false, dryRun: false, registroId: registro.id, erro: `HTTP ${r.status}` };
    }
    const j = (await r.json()) as { id?: string };
    await prisma.emailEnvio.update({
      where: { id: registro.id },
      data: { status: "ENVIADO", enviadoEm: new Date(), resendId: j.id ?? null },
    });
    return { ok: true, dryRun: false, registroId: registro.id, resendId: j.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.emailEnvio.update({
      where: { id: registro.id },
      data: { status: "FALHA", erroMsg: msg.slice(0, 500) },
    });
    return { ok: false, dryRun: false, registroId: registro.id, erro: msg };
  }
}
