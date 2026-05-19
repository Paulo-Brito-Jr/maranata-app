/**
 * F-P0 — Confere se os usuários de teste estão configurados corretamente
 * no Maranata Key (SSO), e imprime o que falta.
 *
 * Não cria usuários direto no banco do MK (projeto separado). Em vez disso,
 * valida estado via endpoint público do MK e dá instruções acionáveis.
 *
 * Uso:
 *   pnpm tsx scripts/seed-test-users.ts
 */
import { verifyMaranataKeyToken } from "../lib/maranata-key-sso";

const MK = process.env.MARANATA_KEY_URL ?? "https://maranata-key.vercel.app";
const APP_ID = process.env.MARANATA_KEY_APP_ID ?? "maranata-app";

type AlvoTeste = {
  email: string;
  papelEsperado: "SUPER_ADMIN" | "MEMBRO";
  rotulo: string;
};

const ALVOS: AlvoTeste[] = [
  { email: "jubrito@gmail.com", papelEsperado: "SUPER_ADMIN", rotulo: "Paulo (admin)" },
  {
    email: "producao@maranata-app.com",
    papelEsperado: "MEMBRO",
    rotulo: "Conta produção (membro)",
  },
];

async function checarMembro(email: string): Promise<{ ok: boolean; papel?: string; raw?: unknown }> {
  try {
    const r = await fetch(`${MK}/api/admin/lookup?email=${encodeURIComponent(email)}&app=${APP_ID}`, {
      headers: { "x-mk-admin-token": process.env.MARANATA_KEY_ADMIN_TOKEN ?? "" },
      cache: "no-store",
    });
    if (!r.ok) return { ok: false };
    const j = (await r.json()) as { papel?: string };
    return { ok: true, papel: j.papel, raw: j };
  } catch {
    return { ok: false };
  }
}

async function main() {
  console.log("F-P0 — Verificação de usuários de teste");
  console.log("=====================================");
  console.log(`MK URL:   ${MK}`);
  console.log(`APP_ID:   ${APP_ID}`);
  console.log("");

  for (const alvo of ALVOS) {
    const r = await checarMembro(alvo.email);
    const status = r.ok && r.papel === alvo.papelEsperado ? "✓" : "✗";
    console.log(
      `${status} ${alvo.rotulo.padEnd(30)} ${alvo.email.padEnd(30)} esperado=${alvo.papelEsperado.padEnd(12)} atual=${r.papel ?? "?"}`,
    );
  }

  console.log("");
  console.log("Próximo passo se algum estiver ✗:");
  console.log("  cd ~/dev/maranata-key");
  console.log("  pnpm tsx scripts/promover-membro.ts --email <email> --papel <PAPEL> --app maranata-app");
  console.log("");
  console.log("Login pra testar:");
  console.log(`  ${MK}/login (use cada e-mail acima, senha no vault)`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("erro:", e);
    process.exit(1);
  });

// Compat: evita warning de import não usado quando o script é compilado standalone.
void verifyMaranataKeyToken;
