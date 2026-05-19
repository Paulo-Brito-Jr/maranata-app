/**
 * WhatsApp Business via Meta Cloud API — stub seguro.
 *
 * Envs esperadas (vazias = dry-run):
 *   WHATSAPP_PHONE_NUMBER_ID
 *   WHATSAPP_TOKEN  (System User token Meta)
 *
 * Uso: enviarWhatsAppTemplate("5521999999999", "campanha_dizimo", "pt_BR", [...])
 */
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;

export type WaResultado = {
  ok: boolean;
  dryRun: boolean;
  messageId?: string;
  erro?: string;
};

export async function enviarWhatsAppTemplate(
  numero: string,
  template: string,
  lang: string = "pt_BR",
  componentes: unknown[] = [],
): Promise<WaResultado> {
  if (!PHONE_ID || !TOKEN) {
    console.warn(`[whatsapp] dry-run pra ${numero} template=${template}`);
    return { ok: true, dryRun: true };
  }

  try {
    const r = await fetch(
      `https://graph.facebook.com/v22.0/${PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: numero,
          type: "template",
          template: {
            name: template,
            language: { code: lang },
            components: componentes,
          },
        }),
      },
    );
    if (!r.ok) {
      const txt = await r.text().catch(() => "?");
      return { ok: false, dryRun: false, erro: `HTTP ${r.status}: ${txt}`.slice(0, 500) };
    }
    const j = (await r.json()) as { messages?: { id: string }[] };
    return { ok: true, dryRun: false, messageId: j.messages?.[0]?.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, dryRun: false, erro: msg };
  }
}
