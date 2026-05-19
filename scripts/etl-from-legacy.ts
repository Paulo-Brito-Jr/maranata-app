/* eslint-disable no-console */
/**
 * ETL — banco LEGADO (Supabase yszpvlfffkiguorwbyaw, snake_case)
 *     → banco NOVO (Supabase rvnzncwouhrwljzwuytr, PascalCase Prisma)
 *
 * Roda em Node 22+ via tsx. Lê env vars LEGACY_* e NEW_*.
 * Insere via SQL direto (pg) com ON CONFLICT DO NOTHING — idempotente.
 *
 * Uso:
 *   tsx scripts/etl-from-legacy.ts --dry            # só conta + sample
 *   tsx scripts/etl-from-legacy.ts                  # roda tudo
 *   tsx scripts/etl-from-legacy.ts --table membros  # uma tabela só
 */
import { Client } from "pg";
import { createHash, randomBytes } from "crypto";

// ---------- args ----------
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const ONLY = args.includes("--table") ? args[args.indexOf("--table") + 1] : null;
const VERBOSE = args.includes("--verbose");

// ---------- env ----------
const LEGACY_DB = process.env.LEGACY_DATABASE_URL!;
const NEW_DB = process.env.NEW_DATABASE_URL ?? process.env.DIRECT_URL!;
if (!LEGACY_DB) {
  console.error("LEGACY_DATABASE_URL não definida");
  process.exit(1);
}
if (!NEW_DB) {
  console.error("NEW_DATABASE_URL/DIRECT_URL não definida");
  process.exit(1);
}

// ---------- cuid2-lite (suficiente pra ID) ----------
function cuid(): string {
  return "c" + randomBytes(12).toString("hex");
}

// ---------- helpers ----------
// Supabase pooler usa cert da AWS RDS; aceitamos sem verify (mas com TLS).
// Removemos sslmode= da URL pra que a opção `ssl` do Client prevaleça.
function stripSslMode(u: string): string {
  return u.replace(/([?&])sslmode=[^&]*&?/g, "$1").replace(/[?&]$/, "");
}
const sslOpts = { rejectUnauthorized: false };
const legacy = new Client({ connectionString: stripSslMode(LEGACY_DB), ssl: sslOpts });
const novo = new Client({ connectionString: stripSslMode(NEW_DB), ssl: sslOpts });

type Counter = { lidos: number; inseridos: number; pulados: number; erros: number };
const counters: Record<string, Counter> = {};

function tally(table: string): Counter {
  counters[table] ??= { lidos: 0, inseridos: 0, pulados: 0, erros: 0 };
  return counters[table];
}

// ID maps: legacy_int_id → new_cuid
const idMap: Record<string, Map<number | string, string>> = {
  Igreja: new Map(),
  Regional: new Map(),
  Membro: new Map(),
  Usuario: new Map(),
  UsuarioApp: new Map(),
  Visitante: new Map(),
  Celula: new Map(),
  CategoriaEvento: new Map(),
  CategoriaPregacao: new Map(),
  CategoriaFinanceira: new Map(),
  SeriePregacao: new Map(),
  Sentimento: new Map(),
  ContaBancaria: new Map(),
  Fornecedor: new Map(),
  GrupoMinisterial: new Map(),
  Equipe: new Map(),
  Banner: new Map(),
  Pregacao: new Map(),
  Evento: new Map(),
  Trilha: new Map(),
  Transmissao: new Map(),
  PlanoLeitura: new Map(),
  Download: new Map(),
  Testemunho: new Map(),
  PedidoOracao: new Map(),
};

function dateOrNull(v: string | null | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

async function loadIgrejasNew() {
  const r = await novo.query<{ id: string; inchurchId: number | null; nome: string }>(
    `SELECT id, "inchurchId", nome FROM "Igreja"`,
  );
  for (const row of r.rows) {
    if (row.inchurchId != null) idMap.Igreja.set(row.inchurchId, row.id);
    idMap.Igreja.set(`name:${row.nome.toLowerCase()}`, row.id);
  }
}

async function loadRefsNew() {
  const lookups = [
    { tbl: "CategoriaEvento", target: "CategoriaEvento" },
    { tbl: "CategoriaPregacao", target: "CategoriaPregacao" },
    { tbl: "CategoriaFinanceira", target: "CategoriaFinanceira" },
    { tbl: "Sentimento", target: "Sentimento" },
  ];
  for (const l of lookups) {
    const r = await novo.query<{ id: string; nome: string; inchurchId: number | null }>(
      `SELECT id, nome, ${l.tbl === "CategoriaFinanceira" ? "NULL" : `"inchurchId"`}::int as "inchurchId" FROM "${l.tbl}"`,
    );
    for (const row of r.rows) {
      idMap[l.target].set(`name:${row.nome.toLowerCase()}`, row.id);
      if (row.inchurchId != null) idMap[l.target].set(row.inchurchId, row.id);
    }
  }
}

// Resolve igrejaId — fallback pra Sede (Tijuca, inchurchId 25524)
function resolveIgreja(legacyIgrejaId: number | null | undefined): string {
  if (legacyIgrejaId != null && idMap.Igreja.has(legacyIgrejaId)) {
    return idMap.Igreja.get(legacyIgrejaId)!;
  }
  // fallback: Tijuca (sede)
  return idMap.Igreja.get(25524) ?? idMap.Igreja.get(`name:tijuca`)!;
}

async function run<T = unknown>(q: string, params: unknown[] = []): Promise<T[]> {
  const r = await novo.query(q, params);
  return r.rows as T[];
}

async function readLegacy<T = unknown>(table: string, cols = "*", order = "id"): Promise<T[]> {
  const r = await legacy.query(`SELECT ${cols} FROM ${table} ORDER BY ${order}`);
  return r.rows as T[];
}

// =============================================================================
// FASES
// =============================================================================

async function etlRegional() {
  const t = tally("Regional");
  const rows = await readLegacy<{ id: number; nome: string; criado_em: string }>("regionais");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Regional: ${rows.length} rows; sample=${JSON.stringify(rows[0])}`);
    return;
  }
  for (const r of rows) {
    try {
      const id = cuid();
      await run(
        `INSERT INTO "Regional" (id, nome, "criadaEm") VALUES ($1, $2, $3)
         ON CONFLICT (nome) DO UPDATE SET nome = EXCLUDED.nome RETURNING id`,
        [id, r.nome, dateOrNull(r.criado_em) ?? new Date()],
      );
      const got = await run<{ id: string }>(`SELECT id FROM "Regional" WHERE nome = $1`, [r.nome]);
      idMap.Regional.set(r.id, got[0].id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Regional err:", (e as Error).message);
    }
  }
}

async function etlIgreja() {
  // Igrejas já existem (14 do seed). Atualizar inchurchId match.
  // Legacy tem 15 igrejas — fazer upsert por nome.
  const t = tally("Igreja");
  type R = { id: number; nome: string; endereco: string | null; cnpj: string | null; criado_em: string };
  const rows = await readLegacy<R>("igrejas");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Igreja: ${rows.length} rows (UPSERT por nome). sample=${JSON.stringify(rows[0])}`);
    return;
  }
  for (const r of rows) {
    try {
      // upsert por nome (case-insensitive)
      const existing = await run<{ id: string }>(
        `SELECT id FROM "Igreja" WHERE lower(nome) = lower($1) LIMIT 1`,
        [r.nome],
      );
      if (existing.length) {
        await run(
          `UPDATE "Igreja" SET "inchurchId" = COALESCE($2, "inchurchId"), endereco = COALESCE("Igreja".endereco, $3)
           WHERE id = $1`,
          [existing[0].id, r.id, r.endereco],
        );
        idMap.Igreja.set(r.id, existing[0].id);
      } else {
        const id = cuid();
        const now = new Date();
        await run(
          `INSERT INTO "Igreja" (id, "inchurchId", nome, endereco, ativa, "ehSede", "criadaEm", "atualizadaEm")
           VALUES ($1, $2, $3, $4, true, false, $5, $5)`,
          [id, r.id, r.nome, r.endereco, now],
        );
        idMap.Igreja.set(r.id, id);
      }
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Igreja err:", (e as Error).message);
    }
  }
}

async function etlSimpleRef(opts: {
  legacyTable: string;
  newTable: string;
  cuidMap: string;
  mapping: (r: any) => { nome: string; cols: Record<string, unknown> };
  conflictCol?: string;
  hasInchurchId?: boolean;
  nameCol?: string;  // coluna pra lookup case-insensitive ("nome" default ou "titulo")
}) {
  const t = tally(opts.newTable);
  const nameCol = opts.nameCol ?? "nome";
  const rows = await readLegacy<any>(opts.legacyTable);
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] ${opts.newTable}: ${rows.length} rows; sample=${JSON.stringify(rows[0])}`);
    return;
  }
  for (const r of rows) {
    try {
      const m = opts.mapping(r);
      const cols = m.cols;
      // Se já existe (por nome ou inchurchId), buscar ID e mapear
      let existingId: string | null = null;
      if (opts.hasInchurchId) {
        const found = await run<{ id: string }>(
          `SELECT id FROM "${opts.newTable}" WHERE "inchurchId" = $1 LIMIT 1`,
          [r.id],
        );
        if (found.length) existingId = found[0].id;
      }
      if (!existingId) {
        const found = await run<{ id: string }>(
          `SELECT id FROM "${opts.newTable}" WHERE lower("${nameCol}") = lower($1) LIMIT 1`,
          [m.nome],
        );
        if (found.length) existingId = found[0].id;
      }
      if (existingId) {
        // só atualiza inchurchId se faltar
        if (opts.hasInchurchId) {
          await run(`UPDATE "${opts.newTable}" SET "inchurchId" = COALESCE("inchurchId", $2) WHERE id = $1`, [existingId, r.id]);
        }
        idMap[opts.cuidMap].set(r.id, existingId);
        t.pulados++;
        continue;
      }
      const id = cuid();
      const colList = Object.keys(cols);
      const placeholders = colList.map((_, i) => `$${i + 2}`).join(", ");
      const colNames = colList.map((c) => `"${c}"`).join(", ");
      await run(
        `INSERT INTO "${opts.newTable}" (id, ${colNames}) VALUES ($1, ${placeholders})`,
        [id, ...Object.values(cols)],
      );
      idMap[opts.cuidMap].set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error(`${opts.newTable} err:`, (e as Error).message);
    }
  }
}

async function etlUsuario() {
  const t = tally("Usuario");
  type R = {
    id: string;
    nome: string;
    email: string | null;
    cpf: string | null;
    eh_admin: boolean;
    eh_lider: boolean;
    criado_em: string;
  };
  const rows = await readLegacy<R>("usuarios");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Usuario: ${rows.length} rows; sample=${JSON.stringify(rows[0])}`);
    return;
  }
  for (const r of rows) {
    try {
      if (!r.email) {
        t.pulados++;
        continue;
      }
      // Extract numeric id from "/api/v1/basic_user/1907158/" — pegar último número
      const matches = r.id.match(/(\d+)/g);
      const inchurchId = matches ? Number(matches[matches.length - 1]) || null : null;
      const papel = r.eh_admin ? "ADMIN_IGREJA" : r.eh_lider ? "LIDER_CELULA" : "MEMBRO";
      const id = cuid();
      const now = new Date();
      const res = await run<{ id: string }>(
        `INSERT INTO "Usuario" (id, "inchurchId", email, nome, papel, ativo, "criadoEm", "atualizadoEm")
         VALUES ($1, $2, $3, $4, $5::"PapelSistema", true, $6, $6)
         ON CONFLICT (email) DO UPDATE SET "inchurchId" = COALESCE("Usuario"."inchurchId", EXCLUDED."inchurchId")
         RETURNING id`,
        [id, inchurchId, r.email, r.nome, papel, dateOrNull(r.criado_em) ?? now],
      );
      idMap.Usuario.set(r.id, res[0].id);
      if (inchurchId) idMap.Usuario.set(inchurchId, res[0].id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Usuario err:", (e as Error).message, r.email);
    }
  }
}

async function etlMembro() {
  const t = tally("Membro");
  type R = {
    matricula: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    genero: string | null;
    data_nascimento: string | null;
    situacao: string | null;
    status: string | null;
    foto_url: string | null;
    igreja_id: number | null;
    criado_em: string;
    atualizado_em: string;
    cpf: string | null;
    rg: string | null;
    estado_civil: string | null;
    profissao: string | null;
    data_batismo: string | null;
    endereco: string | null;
    bairro: string | null;
    cidade: string | null;
    cep: string | null;
    observacoes: string | null;
    celula_id: number | null;
  };
  // matricula é a "PK" no legado — pegamos ela como pseudo-id
  const rows = await readLegacy<R>("membros", "*", "matricula");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Membro: ${rows.length} rows; sample=${JSON.stringify(rows[0])}`);
    return;
  }

  // CPFs duplicados podem dar conflito — track
  const cpfSeen = new Set<string>();
  for (const r of rows) {
    try {
      const igrejaId = resolveIgreja(r.igreja_id);
      const status =
        r.situacao === "inactive" ? "INATIVO" :
        r.status === "approved" ? "ATIVO" :
        "ATIVO";
      const estadoCivil = mapEstadoCivil(r.estado_civil);
      const cpf = r.cpf && !cpfSeen.has(r.cpf) ? r.cpf : null;
      if (r.cpf) cpfSeen.add(r.cpf);

      const id = cuid();
      const matNum = Number(r.matricula) || null;
      const now = new Date();
      const res = await run<{ id: string }>(
        `INSERT INTO "Membro" (
            id, "inchurchId", "igrejaId", nome, "fotoUrl", email, telefone, "dataNascimento",
            cpf, rg, profissao, "estadoCivil", "dataBatismo", status, observacoes,
            endereco, cidade, "criadoEm", "atualizadoEm"
         ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12::"EstadoCivil", $13, $14::"StatusMembro", $15,
            $16, $17, $18, $19
         )
         ON CONFLICT (cpf) DO NOTHING
         RETURNING id`,
        [
          id, matNum, igrejaId, r.nome, r.foto_url, r.email, r.telefone, dateOrNull(r.data_nascimento),
          cpf, r.rg, r.profissao, estadoCivil, dateOrNull(r.data_batismo), status, r.observacoes,
          r.endereco, r.cidade, dateOrNull(r.criado_em) ?? now, dateOrNull(r.atualizado_em) ?? now,
        ],
      );
      if (res.length) {
        idMap.Membro.set(r.matricula, res[0].id);
        if (matNum) idMap.Membro.set(matNum, res[0].id);
        t.inseridos++;
      } else {
        t.pulados++;
      }
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Membro err:", (e as Error).message, r.matricula);
    }
  }
}

function mapEstadoCivil(v: string | null): string | null {
  if (!v) return null;
  const m: Record<string, string> = {
    solteiro: "SOLTEIRO",
    casado: "CASADO",
    divorciado: "DIVORCIADO",
    viuvo: "VIUVO",
    "viúvo": "VIUVO",
    uniao_estavel: "UNIAO_ESTAVEL",
    "união estável": "UNIAO_ESTAVEL",
  };
  return m[v.toLowerCase()] ?? null;
}

async function etlUsuarioApp() {
  const t = tally("UsuarioApp");
  type R = {
    id: number;
    nome: string;
    email: string | null;
    cpf: string | null;
    telefone: string | null;
    foto_url: string | null;
    igreja_id: number | null;
    verificado: boolean;
    criado_em_app: string | null;
    importado_em: string;
  };
  const rows = await readLegacy<R>("usuarios_app");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] UsuarioApp: ${rows.length} rows; sample=${JSON.stringify(rows[0])}`);
    return;
  }
  // Faz em batches de INSERT múltiplo para ser rápido
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const values: unknown[] = [];
    const placeholders: string[] = [];
    chunk.forEach((r, idx) => {
      const o = idx * 9;
      placeholders.push(
        `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5}, $${o + 6}, $${o + 7}, $${o + 8}, $${o + 9})`,
      );
      values.push(
        cuid(),
        r.id,
        r.igreja_id != null ? idMap.Igreja.get(r.igreja_id) ?? null : null,
        r.email,
        r.telefone,
        r.nome,
        r.foto_url,
        dateOrNull(r.criado_em_app) ?? dateOrNull(r.importado_em) ?? new Date(),
        true,
      );
    });
    try {
      const res = await run<{ id: string; inchurchId: number }>(
        `INSERT INTO "UsuarioApp" (id, "inchurchId", "igrejaId", email, telefone, nome, "fotoUrl", "registradoEm", ativo)
         VALUES ${placeholders.join(", ")}
         ON CONFLICT ("inchurchId") DO NOTHING
         RETURNING id, "inchurchId"`,
        values,
      );
      for (const row of res) idMap.UsuarioApp.set(row.inchurchId, row.id);
      t.inseridos += res.length;
      t.pulados += chunk.length - res.length;
    } catch (e) {
      t.erros += chunk.length;
      if (VERBOSE) console.error("UsuarioApp batch err:", (e as Error).message);
    }
  }
}

async function etlVisitante() {
  const t = tally("Visitante");
  type R = {
    id: number;
    nome: string;
    email: string | null;
    telefone: string | null;
    igreja_id: number | null;
    primeira_visita: string | null;
    criado_em: string;
  };
  const rows = await readLegacy<R>("visitantes");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Visitante: ${rows.length} rows; sample=${JSON.stringify(rows[0])}`);
    return;
  }
  for (const r of rows) {
    try {
      const igrejaId = resolveIgreja(r.igreja_id);
      const id = cuid();
      await run(
        `INSERT INTO "Visitante" (id, "inchurchId", "igrejaId", nome, email, telefone, "dataPrimeiraVisita", "criadoEm")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT ("inchurchId") DO NOTHING`,
        [id, r.id, igrejaId, r.nome, r.email, r.telefone, dateOrNull(r.primeira_visita), dateOrNull(r.criado_em) ?? new Date()],
      );
      idMap.Visitante.set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Visitante err:", (e as Error).message);
    }
  }
}

async function etlGrupoMinisterial() {
  await etlSimpleRef({
    legacyTable: "grupos_ministeriais",
    newTable: "GrupoMinisterial",
    cuidMap: "GrupoMinisterial",
    hasInchurchId: true,
    mapping: (r: any) => ({
      nome: r.nome,
      cols: {
        inchurchId: r.id,
        nome: r.nome,
        descricao: r.descricao,
        ativo: true,
        criadoEm: dateOrNull(r.criado_em) ?? new Date(),
      },
    }),
  });
}

async function etlEquipe() {
  await etlSimpleRef({
    legacyTable: "equipes",
    newTable: "Equipe",
    cuidMap: "Equipe",
    hasInchurchId: true,
    mapping: (r: any) => ({
      nome: r.nome,
      cols: {
        inchurchId: r.id,
        nome: r.nome,
        descricao: r.descricao,
        ativa: true,
        criadaEm: dateOrNull(r.criado_em) ?? new Date(),
      },
    }),
  });
}

async function etlCelula() {
  const t = tally("Celula");
  type R = {
    id: number;
    nome: string;
    tipo: string | null;
    rede_id: number | null;
    rede_nome: string | null;
    igreja_id: number | null;
    ativa: boolean;
    endereco: string | null;
    dia_semana: number | null;
    horario: string | null;
    criado_em: string;
  };
  const rows = await readLegacy<R>("celulas");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Celula: ${rows.length} rows; sample=${JSON.stringify(rows[0])}`);
    return;
  }
  for (const r of rows) {
    try {
      const igrejaId = resolveIgreja(r.igreja_id);
      const status = r.ativa ? "ATIVA" : "INATIVA";
      const id = cuid();
      const res = await run<{ id: string }>(
        `INSERT INTO "Celula" (id, "inchurchId", "igrejaId", nome, descricao, endereco, "diaSemana", horario, status, "criadaEm")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::"StatusCelula", $10)
         ON CONFLICT ("inchurchId") DO NOTHING
         RETURNING id`,
        [id, r.id, igrejaId, r.nome, r.tipo, r.endereco, r.dia_semana, r.horario, status, dateOrNull(r.criado_em) ?? new Date()],
      );
      if (res.length) {
        idMap.Celula.set(r.id, res[0].id);
        t.inseridos++;
      } else {
        t.pulados++;
      }
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Celula err:", (e as Error).message);
    }
  }
}

async function etlVisitanteCelula() {
  // participantes_celulas no legado é só name+phone (sem membroId real)
  // Mapeamos pra VisitanteCelula (que aceita avulso)
  const t = tally("VisitanteCelula");
  type R = { id: number; nome: string; celula_id: number | null; telefone: string | null; papel: string };
  const rows = await readLegacy<R>("participantes_celulas");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] VisitanteCelula (from participantes_celulas): ${rows.length} rows`);
    return;
  }
  for (const r of rows) {
    try {
      const celulaId = r.celula_id != null ? idMap.Celula.get(r.celula_id) : null;
      if (!celulaId) {
        t.pulados++;
        continue;
      }
      const id = cuid();
      await run(
        `INSERT INTO "VisitanteCelula" (id, "celulaId", nome, telefone, "visitouEm", observacoes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, celulaId, r.nome, r.telefone, new Date(), `Participante legado (papel: ${r.papel ?? "n/d"})`],
      );
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("VisitanteCelula err:", (e as Error).message);
    }
  }

  // visitantes_celulas legado tem dados próprios
  const t2 = tally("VisitanteCelulaReal");
  type V = { id: number; nome: string; celula_id: number | null; telefone: string | null; data_visita: string | null };
  const v2 = await readLegacy<V>("visitantes_celulas");
  t2.lidos = v2.length;
  for (const r of v2) {
    try {
      const celulaId = r.celula_id != null ? idMap.Celula.get(r.celula_id) : null;
      if (!celulaId) {
        t2.pulados++;
        continue;
      }
      const id = cuid();
      await run(
        `INSERT INTO "VisitanteCelula" (id, "celulaId", nome, telefone, "visitouEm")
         VALUES ($1, $2, $3, $4, $5)`,
        [id, celulaId, r.nome, r.telefone, dateOrNull(r.data_visita) ?? new Date()],
      );
      t2.inseridos++;
    } catch (e) {
      t2.erros++;
      if (VERBOSE) console.error("VisitanteCelula(real) err:", (e as Error).message);
    }
  }
}

async function etlSeriePregacao() {
  await etlSimpleRef({
    legacyTable: "series_pregacoes",
    newTable: "SeriePregacao",
    cuidMap: "SeriePregacao",
    hasInchurchId: true,
    nameCol: "titulo",
    mapping: (r: any) => ({
      nome: r.nome,
      cols: {
        inchurchId: r.id,
        titulo: r.nome,
        descricao: r.descricao,
        criadaEm: dateOrNull(r.criado_em) ?? new Date(),
      },
    }),
  });
}

async function etlCategoriaEvento() {
  await etlSimpleRef({
    legacyTable: "categorias_evento",
    newTable: "CategoriaEvento",
    cuidMap: "CategoriaEvento",
    hasInchurchId: true,
    mapping: (r: any) => ({
      nome: r.nome,
      cols: { inchurchId: r.id, nome: r.nome },
    }),
  });
}

async function etlCategoriaPregacao() {
  await etlSimpleRef({
    legacyTable: "categorias_pregacao",
    newTable: "CategoriaPregacao",
    cuidMap: "CategoriaPregacao",
    hasInchurchId: true,
    mapping: (r: any) => ({
      nome: r.nome,
      cols: { inchurchId: r.id, nome: r.nome },
    }),
  });
}

async function etlCategoriaFinanceira() {
  const t = tally("CategoriaFinanceira");
  type R = { id: number; nome: string; tipo: string; descricao: string | null };
  const rows = await readLegacy<R>("categorias_financeiras");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] CategoriaFinanceira: ${rows.length}`);
    return;
  }
  for (const r of rows) {
    try {
      const tipoEnum = (r.tipo ?? "").toLowerCase().includes("sa") ? "SAIDA" : "ENTRADA";
      // upsert por nome
      const existing = await run<{ id: string }>(
        `SELECT id FROM "CategoriaFinanceira" WHERE lower(nome) = lower($1) LIMIT 1`,
        [r.nome],
      );
      if (existing.length) {
        idMap.CategoriaFinanceira.set(r.id, existing[0].id);
        t.pulados++;
        continue;
      }
      const id = cuid();
      await run(
        `INSERT INTO "CategoriaFinanceira" (id, nome, tipo) VALUES ($1, $2, $3::"TipoLancamento")`,
        [id, r.nome, tipoEnum],
      );
      idMap.CategoriaFinanceira.set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("CategoriaFinanceira err:", (e as Error).message);
    }
  }
}

async function etlSentimento() {
  await etlSimpleRef({
    legacyTable: "sentimentos",
    newTable: "Sentimento",
    cuidMap: "Sentimento",
    hasInchurchId: true,
    mapping: (r: any) => ({
      nome: r.tipo,
      cols: { inchurchId: r.id, nome: r.tipo, emoji: r.emoji },
    }),
  });
}

async function etlPregacao() {
  const t = tally("Pregacao");
  type R = {
    id: number;
    titulo: string;
    pregador: string | null;
    data_pregacao: string | null;
    serie: any;
    categoria: any;
    tipo: string | null;
    duracao_seg: number | null;
    url_video: string | null;
    url_audio: string | null;
    execucoes: number | null;
    publicado: boolean;
    igreja_id: number | null;
    criado_em: string;
  };
  const rows = await readLegacy<R>("pregacoes");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Pregacao: ${rows.length} rows; sample=${JSON.stringify(rows[0])}`);
    return;
  }
  for (const r of rows) {
    try {
      const igrejaId = r.igreja_id != null ? idMap.Igreja.get(r.igreja_id) ?? null : null;
      // serie/categoria podem vir como nome (string) ou id (int) — tentar ambos
      let serieId: string | null = null;
      let categoriaId: string | null = null;
      if (r.serie != null) {
        if (typeof r.serie === "number") serieId = idMap.SeriePregacao.get(r.serie) ?? null;
        else if (typeof r.serie === "string") serieId = idMap.SeriePregacao.get(`name:${r.serie.toLowerCase()}`) ?? null;
      }
      if (r.categoria != null) {
        if (typeof r.categoria === "number") categoriaId = idMap.CategoriaPregacao.get(r.categoria) ?? null;
        else if (typeof r.categoria === "string") categoriaId = idMap.CategoriaPregacao.get(`name:${r.categoria.toLowerCase()}`) ?? null;
      }
      // youtube id extraction
      let youtubeId: string | null = null;
      if (r.url_video) {
        const m = r.url_video.match(/(?:youtu\.be\/|v=)([\w-]+)/);
        if (m) youtubeId = m[1];
      }
      const id = cuid();
      await run(
        `INSERT INTO "Pregacao" (
            id, "inchurchId", "igrejaId", "serieId", "categoriaId", titulo, pregador, data,
            "youtubeId", "duracaoSeg", execucoes, publicada, "criadaEm"
         ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
         ) ON CONFLICT ("inchurchId") DO NOTHING`,
        [
          id, r.id, igrejaId, serieId, categoriaId, r.titulo, r.pregador, dateOrNull(r.data_pregacao),
          youtubeId, r.duracao_seg, r.execucoes ?? 0, r.publicado ?? true, dateOrNull(r.criado_em) ?? new Date(),
        ],
      );
      idMap.Pregacao.set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Pregacao err:", (e as Error).message);
    }
  }
}

async function etlTransmissao() {
  const t = tally("Transmissao");
  type R = {
    id: number; titulo: string; data_transmissao: string;
    url_video: string | null; total_visualizacoes: number;
    ao_vivo: boolean; criado_em: string;
  };
  const rows = await readLegacy<R>("transmissoes");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Transmissao: ${rows.length}`);
    return;
  }
  for (const r of rows) {
    try {
      const status = r.ao_vivo ? "ao_vivo" : "encerrada";
      const id = cuid();
      await run(
        `INSERT INTO "Transmissao" (id, "inchurchId", titulo, inicio, "streamUrl", status, visualizacoes, "criadaEm")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT ("inchurchId") DO NOTHING`,
        [id, r.id, r.titulo, dateOrNull(r.data_transmissao) ?? new Date(), r.url_video, status, r.total_visualizacoes ?? 0, dateOrNull(r.criado_em) ?? new Date()],
      );
      idMap.Transmissao.set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Transmissao err:", (e as Error).message);
    }
  }
}

async function etlBanner() {
  const t = tally("Banner");
  type R = {
    id: number; titulo: string; imagem_url: string; url_destino: string | null;
    data_inicio: string | null; data_fim: string | null; ativo: boolean; criado_em: string;
  };
  const rows = await readLegacy<R>("banners");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Banner: ${rows.length}`);
    return;
  }
  for (const r of rows) {
    try {
      const id = cuid();
      await run(
        `INSERT INTO "Banner" (id, "inchurchId", titulo, "imagemUrl", "linkUrl", inicio, fim, ativo, "criadoEm")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT ("inchurchId") DO NOTHING`,
        [id, r.id, r.titulo, r.imagem_url, r.url_destino, dateOrNull(r.data_inicio), dateOrNull(r.data_fim), r.ativo ?? true, dateOrNull(r.criado_em) ?? new Date()],
      );
      idMap.Banner.set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Banner err:", (e as Error).message);
    }
  }
}

async function etlPlanoLeitura() {
  const t = tally("PlanoLeitura");
  type R = { id: number; nome: string; livro_biblico: string | null; criado_em: string };
  const rows = await readLegacy<R>("planos_leitura");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] PlanoLeitura: ${rows.length}`);
    return;
  }
  for (const r of rows) {
    try {
      const id = cuid();
      await run(
        `INSERT INTO "PlanoLeitura" (id, "inchurchId", titulo, descricao, publicado, "criadoEm")
         VALUES ($1, $2, $3, $4, true, $5) ON CONFLICT ("inchurchId") DO NOTHING`,
        [id, r.id, r.nome, r.livro_biblico, dateOrNull(r.criado_em) ?? new Date()],
      );
      idMap.PlanoLeitura.set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("PlanoLeitura err:", (e as Error).message);
    }
  }
}

async function etlDownload() {
  const t = tally("Download");
  type R = {
    id: number; nome: string; descricao: string | null; arquivo_url: string | null;
    total_downloads: number; criado_em: string;
  };
  const rows = await readLegacy<R>("downloads");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Download: ${rows.length}`);
    return;
  }
  for (const r of rows) {
    try {
      // arquivoUrl é obrigatório no schema (não null)
      const url = r.arquivo_url ?? "https://maranata.app/download-pendente";
      const id = cuid();
      await run(
        `INSERT INTO "Download" (id, "inchurchId", titulo, descricao, "arquivoUrl", downloads, "criadoEm")
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT ("inchurchId") DO NOTHING`,
        [id, r.id, r.nome, r.descricao, url, r.total_downloads ?? 0, dateOrNull(r.criado_em) ?? new Date()],
      );
      idMap.Download.set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Download err:", (e as Error).message);
    }
  }
}

async function etlAtalho() {
  const t = tally("Atalho");
  type R = { id: number; nome: string; url_destino: string | null; icone: string | null; ordem: number; ativo: boolean };
  const rows = await readLegacy<R>("atalhos");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Atalho: ${rows.length}`);
    return;
  }
  for (const r of rows) {
    try {
      const url = r.url_destino ?? "https://maranata.app/";
      const id = cuid();
      await run(
        `INSERT INTO "Atalho" (id, titulo, "linkUrl", icone, ordem, ativo) VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, r.nome, url, r.icone, r.ordem ?? 0, r.ativo ?? true],
      );
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Atalho err:", (e as Error).message);
    }
  }
}

async function etlContaBancaria() {
  const t = tally("ContaBancaria");
  type R = { id: number; nome: string; banco: string | null; agencia: string | null; conta: string | null; saldo: number; igreja_id: number | null };
  const rows = await readLegacy<R>("contas_bancarias");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] ContaBancaria: ${rows.length}`);
    return;
  }
  for (const r of rows) {
    try {
      const igrejaId = r.igreja_id != null ? idMap.Igreja.get(r.igreja_id) ?? null : null;
      const id = cuid();
      await run(
        `INSERT INTO "ContaBancaria" (id, "igrejaId", nome, banco, agencia, conta, "saldoInicial", ativa)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
        [id, igrejaId, r.nome, r.banco, r.agencia, r.conta, r.saldo ?? 0],
      );
      idMap.ContaBancaria.set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("ContaBancaria err:", (e as Error).message);
    }
  }
}

async function etlFornecedor() {
  const t = tally("Fornecedor");
  type R = { id: number; nome: string; cnpj: string | null; email: string | null; telefone: string | null };
  const rows = await readLegacy<R>("fornecedores");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Fornecedor: ${rows.length}`);
    return;
  }
  for (const r of rows) {
    try {
      const id = cuid();
      await run(
        `INSERT INTO "Fornecedor" (id, nome, documento, email, telefone, "criadoEm")
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, r.nome, r.cnpj, r.email, r.telefone, new Date()],
      );
      idMap.Fornecedor.set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Fornecedor err:", (e as Error).message);
    }
  }
}

async function etlLancamento() {
  const t = tally("LancamentoFinanceiro");
  type R = {
    id: number; tipo: string; descricao: string | null; pagador: string | null;
    categoria: string | null; valor: number; data_vencimento: string | null; data_pagamento: string | null;
    status: string | null; igreja_id: number | null; evento_id: number | null; conta_id: number | null;
    criado_em: string;
  };
  const rows = await readLegacy<R>("lancamentos_financeiros");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] LancamentoFinanceiro: ${rows.length} rows; sample=${JSON.stringify(rows[0])}`);
    return;
  }
  // Precisa de igrejaId obrigatório; fallback Tijuca
  const fallbackIgreja = resolveIgreja(null);
  for (const r of rows) {
    try {
      const igrejaId = r.igreja_id != null ? idMap.Igreja.get(r.igreja_id) ?? fallbackIgreja : fallbackIgreja;
      const tipoEnum = (r.tipo ?? "").toLowerCase().includes("sa") ? "SAIDA" : "ENTRADA";
      let statusEnum = "PENDENTE";
      const s = (r.status ?? "").toLowerCase();
      if (s === "recebido" || s === "pago" || s === "conciliado") statusEnum = "CONCILIADO";
      else if (s === "cancelado") statusEnum = "CANCELADO";
      const categoriaId = r.categoria
        ? idMap.CategoriaFinanceira.get(`name:${r.categoria.toLowerCase()}`) ?? null
        : null;
      const contaId = r.conta_id != null ? idMap.ContaBancaria.get(r.conta_id) ?? null : null;
      const dataLanc = dateOrNull(r.data_pagamento) ?? dateOrNull(r.data_vencimento) ?? dateOrNull(r.criado_em) ?? new Date();
      const id = cuid();
      await run(
        `INSERT INTO "LancamentoFinanceiro" (
            id, "inchurchId", "igrejaId", "categoriaId", "contaId", tipo, status, valor, data, descricao, "criadoEm"
         ) VALUES (
            $1, $2, $3, $4, $5, $6::"TipoLancamento", $7::"StatusLancamento", $8, $9, $10, $11
         ) ON CONFLICT ("inchurchId") DO NOTHING`,
        [
          id, r.id, igrejaId, categoriaId, contaId, tipoEnum, statusEnum, r.valor ?? 0,
          dataLanc, r.descricao, dateOrNull(r.criado_em) ?? new Date(),
        ],
      );
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("LancamentoFinanceiro err:", (e as Error).message);
    }
  }
}

async function etlEvento() {
  const t = tally("Evento");
  type R = {
    id: number; nome: string; inicio: string; fim: string | null;
    status_inscricao: string | null; publicado: boolean | null; tem_recorrencia: boolean;
    ao_vivo: boolean; url_transmissao: string | null; categorias: any; criado_em: string; atualizado_em: string;
  };
  const rows = await readLegacy<R>("eventos");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Evento: ${rows.length} rows`);
    return;
  }
  const fallbackIgreja = resolveIgreja(null);
  for (const r of rows) {
    try {
      const id = cuid();
      const slug = slugify(`${r.nome}-${r.id}`);
      const inicio = dateOrNull(r.inicio) ?? new Date();
      const now = new Date();
      await run(
        `INSERT INTO "Evento" (
            id, "inchurchId", "igrejaId", titulo, slug, inicio, fim,
            recorrente, "inscricoesAbertas", publicado, "criadoEm", "atualizadoEm"
         ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11
         ) ON CONFLICT ("inchurchId") DO NOTHING`,
        [
          id, r.id, fallbackIgreja, r.nome, slug, inicio, dateOrNull(r.fim),
          r.tem_recorrencia ?? false,
          (r.status_inscricao ?? "no_subscriptions") !== "no_subscriptions",
          r.publicado ?? true,
          dateOrNull(r.criado_em) ?? now,
        ],
      );
      idMap.Evento.set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Evento err:", (e as Error).message);
    }
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 100);
}

async function etlTestemunho() {
  const t = tally("Testemunho");
  type R = {
    id: number; titulo: string | null; texto: string | null; autor: string | null;
    autor_id: number | null; publicado: boolean; data_publicacao: string | null; criado_em: string;
  };
  const rows = await readLegacy<R>("testemunhos");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] Testemunho: ${rows.length} rows`);
    return;
  }
  for (const r of rows) {
    try {
      const texto = r.texto ?? r.titulo ?? "(sem texto)";
      const id = cuid();
      await run(
        `INSERT INTO "Testemunho" (id, "inchurchId", "nomeAvulso", texto, publicado, "criadoEm")
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT ("inchurchId") DO NOTHING`,
        [id, r.id, r.autor, texto, r.publicado ?? false, dateOrNull(r.criado_em) ?? new Date()],
      );
      idMap.Testemunho.set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("Testemunho err:", (e as Error).message);
    }
  }
}

async function etlPedidoOracao() {
  const t = tally("PedidoOracao");
  type R = {
    id: number; titulo: string | null; pedido: string | null; solicitante: string | null;
    solicitante_id: number | null; email: string | null; status: string | null;
    data_pedido: string | null; criado_em: string; anonimo: boolean;
  };
  const rows = await readLegacy<R>("pedidos_oracao");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] PedidoOracao: ${rows.length} rows`);
    return;
  }
  for (const r of rows) {
    try {
      const pedido = r.pedido ?? r.titulo ?? "(sem descrição)";
      const status = (r.status ?? "").toLowerCase() === "respondido" ? "RESPONDIDO" :
                     (r.status ?? "").toLowerCase() === "arquivado" ? "ARQUIVADO" :
                     "ABERTO";
      const id = cuid();
      await run(
        `INSERT INTO "PedidoOracao" (id, "inchurchId", "nomeAvulso", pedido, status, "criadoEm")
         VALUES ($1, $2, $3, $4, $5::"StatusOracao", $6) ON CONFLICT ("inchurchId") DO NOTHING`,
        [id, r.id, r.anonimo ? null : r.solicitante, pedido, status, dateOrNull(r.criado_em) ?? new Date()],
      );
      idMap.PedidoOracao.set(r.id, id);
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("PedidoOracao err:", (e as Error).message);
    }
  }
}

async function etlTrilha() {
  await etlSimpleRef({
    legacyTable: "trilhas",
    newTable: "Trilha",
    cuidMap: "Trilha",
    hasInchurchId: true,
    nameCol: "titulo",
    mapping: (r: any) => ({
      nome: r.nome,
      cols: {
        inchurchId: r.id,
        titulo: r.nome,
        descricao: r.descricao,
        ativa: r.ativa ?? true,
        criadaEm: new Date(),
      },
    }),
  });
}

async function etlNovoConvertido() {
  // No schema novo, NovoConvertido EXIGE membroId. Como os 4 do legado não estão linkados a Membros,
  // criamos um Visitante para cada (com flag "convertido" no observacoes) — mais fiel ao caso real.
  const t = tally("NovoConvertido_as_Visitante");
  type R = {
    id: number; nome: string; email: string | null; telefone: string | null;
    igreja_id: number | null; data_decisao: string | null; status: string | null;
    acompanhante: string | null; criado_em: string;
  };
  const rows = await readLegacy<R>("novos_convertidos");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] NovoConvertido→Visitante: ${rows.length} rows`);
    return;
  }
  for (const r of rows) {
    try {
      const igrejaId = resolveIgreja(r.igreja_id);
      const id = cuid();
      await run(
        `INSERT INTO "Visitante" (id, "igrejaId", nome, email, telefone, observacoes, "criadoEm")
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          id, igrejaId, r.nome, r.email, r.telefone,
          `[novo convertido legado] decisão: ${r.data_decisao ?? "n/d"}; status: ${r.status ?? "n/d"}; acompanhante: ${r.acompanhante ?? "n/d"}`,
          dateOrNull(r.criado_em) ?? new Date(),
        ],
      );
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("NovoConvertido→Visitante err:", (e as Error).message);
    }
  }
}

async function etlImportacaoLog() {
  const t = tally("ImportacaoLog");
  type R = { id: number; tabela: string; registros: number; erros: number; iniciado_em: string; concluido_em: string | null; status: string; detalhes: any };
  const rows = await readLegacy<R>("importacoes_log");
  t.lidos = rows.length;
  if (DRY) {
    console.log(`[DRY] ImportacaoLog: ${rows.length}`);
    return;
  }
  for (const r of rows) {
    try {
      const id = cuid();
      await run(
        `INSERT INTO "ImportacaoLog" (id, fonte, tipo, "totalLinhas", sucesso, erros, "detalhesJson", "iniciadaEm", "concluidaEm")
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)`,
        [id, "InChurch", r.tabela, r.registros ?? 0, (r.registros ?? 0) - (r.erros ?? 0), r.erros ?? 0,
         JSON.stringify(r.detalhes ?? {}), dateOrNull(r.iniciado_em) ?? new Date(), dateOrNull(r.concluido_em)],
      );
      t.inseridos++;
    } catch (e) {
      t.erros++;
      if (VERBOSE) console.error("ImportacaoLog err:", (e as Error).message);
    }
  }
}

// =============================================================================
// ORQUESTRAÇÃO
// =============================================================================

const PHASES: Record<string, () => Promise<void>> = {
  Regional: etlRegional,
  Igreja: etlIgreja,
  CategoriaEvento: etlCategoriaEvento,
  CategoriaPregacao: etlCategoriaPregacao,
  CategoriaFinanceira: etlCategoriaFinanceira,
  Sentimento: etlSentimento,
  Banner: etlBanner,
  PlanoLeitura: etlPlanoLeitura,
  Download: etlDownload,
  Atalho: etlAtalho,
  Usuario: etlUsuario,
  Membro: etlMembro,
  UsuarioApp: etlUsuarioApp,
  Visitante: etlVisitante,
  GrupoMinisterial: etlGrupoMinisterial,
  Equipe: etlEquipe,
  SeriePregacao: etlSeriePregacao,
  Pregacao: etlPregacao,
  Transmissao: etlTransmissao,
  Celula: etlCelula,
  VisitanteCelula: etlVisitanteCelula,
  Evento: etlEvento,
  Testemunho: etlTestemunho,
  PedidoOracao: etlPedidoOracao,
  ContaBancaria: etlContaBancaria,
  Fornecedor: etlFornecedor,
  LancamentoFinanceiro: etlLancamento,
  Trilha: etlTrilha,
  NovoConvertido: etlNovoConvertido,
  ImportacaoLog: etlImportacaoLog,
};

async function main() {
  console.log(`ETL ${DRY ? "[DRY-RUN]" : "[LIVE]"} - legacy → novo`);
  await legacy.connect();
  await novo.connect();
  try {
    await loadIgrejasNew();
    await loadRefsNew();
    console.log(`Igrejas atuais: ${idMap.Igreja.size} entradas no map (${[...idMap.Igreja.keys()].filter(k => typeof k === "number").length} com inchurchId)`);

    const phases = ONLY ? [ONLY] : Object.keys(PHASES);
    for (const phase of phases) {
      const fn = PHASES[phase];
      if (!fn) {
        console.warn(`[skip] fase "${phase}" não encontrada`);
        continue;
      }
      const start = Date.now();
      try {
        await fn();
        const t = counters[phase] ?? counters[Object.keys(counters).slice(-1)[0]];
        const ms = Date.now() - start;
        console.log(`✓ ${phase.padEnd(28)} ${ms}ms`);
      } catch (e) {
        console.error(`✗ ${phase}:`, (e as Error).message);
      }
    }

    // Report
    console.log("\n=== RELATÓRIO ETL ===");
    console.log("Tabela                          lidos   inseridos  pulados  erros");
    for (const [k, v] of Object.entries(counters)) {
      console.log(`${k.padEnd(32)} ${String(v.lidos).padStart(6)}  ${String(v.inseridos).padStart(8)}  ${String(v.pulados).padStart(7)}  ${String(v.erros).padStart(5)}`);
    }
  } finally {
    await legacy.end();
    await novo.end();
  }
}

main().catch((e) => {
  console.error("ETL falhou:", e);
  process.exit(1);
});
