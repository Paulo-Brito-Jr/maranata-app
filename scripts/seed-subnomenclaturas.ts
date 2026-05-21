/**
 * Seed: importa 7 nomenclaturas customizadas do espelho InChurch → Subnomenclatura.
 * Idempotente: upsert por chave.
 * Roda: pnpm tsx --env-file=.env.local scripts/seed-subnomenclaturas.ts
 */
import { Client } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const newDbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const legacyDbUrl =
  process.env.LEGACY_DATABASE_URL ??
  (process.env.INCHURCH_DIRECT_URL || process.env.INCHURCH_DATABASE_URL || "");

if (!legacyDbUrl) {
  console.error("Falta LEGACY_DATABASE_URL (espelho InChurch).");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: newDbUrl }) });
const legacy = new Client({
  connectionString: legacyDbUrl.replace(/([?&])sslmode=[^&]*&?/g, "$1").replace(/[?&]$/, ""),
  ssl: { rejectUnauthorized: false },
});

type Row = {
  id: number;
  field: string;
  singular: string | null;
  plural: string | null;
  default_singular: string | null;
  default_plural: string | null;
  descricao: string | null;
};

async function main() {
  await legacy.connect();
  const { rows } = await legacy.query<Row>("SELECT * FROM nomenclaturas_inchurch ORDER BY field");

  let inseridos = 0;
  let pulados = 0;

  for (const r of rows) {
    const padrao = [r.default_singular, r.default_plural].filter(Boolean).join(" / ") || r.field;
    const custom = [r.singular, r.plural].filter(Boolean).join(" / ") || padrao;
    if (padrao === custom) {
      pulados++;
      continue; // sem customização, não vale gravar
    }
    const inchurchId = Number(r.id);
    await prisma.subnomenclatura.upsert({
      where: { chave: r.field },
      create: {
        inchurchId,
        chave: r.field,
        padrao,
        customizado: custom,
        contexto: r.descricao ?? null,
      },
      update: {
        inchurchId,
        padrao,
        customizado: custom,
        contexto: r.descricao ?? null,
      },
    });
    console.log(`  ✓ ${r.field}: "${padrao}" → "${custom}"`);
    inseridos++;
  }

  console.log(`\nConcluído: ${inseridos} inseridos/atualizados, ${pulados} pulados (sem customização).`);
  await legacy.end();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
