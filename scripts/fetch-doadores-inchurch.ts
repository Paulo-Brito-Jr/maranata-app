/**
 * Importa 1.055 doadores/fornecedores históricos do InChurch entry_source
 * pra tabela Doador no Maranata App.
 *
 * Match com Membro via documento (CPF) ou nome. Idempotente via inchurchId.
 * Roda: pnpm tsx --env-file=.env.local scripts/fetch-doadores-inchurch.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const TOKEN = process.env.INCHURCH_API_TOKEN!;
const BASE = process.env.INCHURCH_BASE_API ?? "https://inradar.com.br/api";
const newDbUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: newDbUrl }) });

type EntrySource = {
  id: number;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  has_whatsapp: boolean | null;
  bank: string | null;
  agency: string | null;
  account_number: string | null;
  pix_key: string | null;
  is_payer: boolean | null;
  is_supplier: boolean | null;
  person_type: string | null;
  nationality: string | null;
  observations: string | null;
  tertiarygroup: { id: number } | null;
  member: { id: number } | null;
};

async function fetchWithRetry(url: string, attempts = 4): Promise<Response> {
  let lastErr: Error | null = null;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: TOKEN, channel: "control_panel", "User-Agent": "curl/8.7.1", Accept: "*/*" },
      });
      if (res.ok) return res;
      if (res.status >= 500 && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e as Error;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw lastErr ?? new Error("fetch fail");
}

async function fetchAll(): Promise<EntrySource[]> {
  const all: EntrySource[] = [];
  const limit = 100;
  let offset = 0;
  while (true) {
    const url = `${BASE}/v1/entry_source/?limit=${limit}&offset=${offset}`;
    const res = await fetchWithRetry(url);
    const json = (await res.json()) as { meta: { total_count: number }; objects: EntrySource[] };
    all.push(...json.objects);
    process.stdout.write(`  ${all.length}/${json.meta.total_count}\r`);
    if (all.length >= json.meta.total_count) break;
    offset += limit;
    await new Promise((r) => setTimeout(r, 80));
  }
  console.log(`  ${all.length} baixados                  `);
  return all;
}

async function main() {
  console.log("Baixando doadores do fornecedor...");
  const sources = await fetchAll();

  console.log("\nCarregando lookups locais...");
  const [igrejas, membros] = await Promise.all([
    prisma.igreja.findMany({
      where: { inchurchId: { not: null } },
      select: { id: true, inchurchId: true },
    }),
    prisma.membro.findMany({
      where: { OR: [{ cpf: { not: null } }, { inchurchId: { not: null } }] },
      select: { id: true, inchurchId: true, cpf: true, nome: true },
    }),
  ]);
  const igrejaByInchurch = new Map(igrejas.map((i) => [i.inchurchId!, i.id]));
  const membroByCpf = new Map(membros.filter((m) => m.cpf).map((m) => [m.cpf!, m.id]));
  const membroByInchurch = new Map(membros.filter((m) => m.inchurchId).map((m) => [m.inchurchId!, m.id]));
  console.log(`  ${igrejas.length} igrejas + ${membros.length} membros`);

  let inseridos = 0;
  let atualizados = 0;
  let comMembro = 0;
  let comIgreja = 0;
  let erros = 0;

  for (const s of sources) {
    try {
      const igrejaId = s.tertiarygroup ? igrejaByInchurch.get(s.tertiarygroup.id) ?? null : null;
      if (igrejaId) comIgreja++;

      let membroId: string | null = null;
      if (s.member?.id) membroId = membroByInchurch.get(s.member.id) ?? null;
      if (!membroId && s.document) membroId = membroByCpf.get(s.document) ?? null;
      if (membroId) comMembro++;

      const result = await prisma.doador.upsert({
        where: { inchurchId: s.id },
        create: {
          inchurchId: s.id,
          igrejaId,
          membroId,
          nome: s.name,
          documento: s.document,
          email: s.email,
          telefone: s.phone,
          hasWhatsapp: s.has_whatsapp ?? false,
          personType: s.person_type,
          nationality: s.nationality,
          banco: s.bank,
          agencia: s.agency,
          conta: s.account_number,
          pixKey: s.pix_key,
          isPayer: s.is_payer ?? true,
          isSupplier: s.is_supplier ?? false,
          observacoes: s.observations,
        },
        update: {
          nome: s.name,
          ...(s.document ? { documento: s.document } : {}),
          ...(s.email ? { email: s.email } : {}),
          ...(s.phone ? { telefone: s.phone } : {}),
          ...(igrejaId ? { igrejaId } : {}),
          ...(membroId ? { membroId } : {}),
          hasWhatsapp: s.has_whatsapp ?? false,
          ...(s.pix_key ? { pixKey: s.pix_key } : {}),
          isPayer: s.is_payer ?? true,
          isSupplier: s.is_supplier ?? false,
        },
      });
      if (result) {
        // upsert não diz se criou ou atualizou — checa via createdAt
        if (result.criadoEm.getTime() > Date.now() - 5000) inseridos++;
        else atualizados++;
      }
    } catch (e) {
      erros++;
      if (process.env.VERBOSE) console.error(s.name, (e as Error).message);
    }
  }

  console.log("\n=== RESULTADO ENTRY_SOURCE → Doador ===");
  console.log(`Sources fornecedor:   ${sources.length}`);
  console.log(`Inseridos/atualizados: ${inseridos + atualizados}`);
  console.log(`Com igreja:           ${comIgreja}`);
  console.log(`Com membro vinculado: ${comMembro}`);
  console.log(`Erros:                ${erros}`);

  const total = await prisma.doador.count();
  console.log(`\nTotal Doador no DB: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
