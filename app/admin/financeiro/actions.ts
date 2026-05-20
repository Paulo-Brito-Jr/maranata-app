"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  TipoLancamento,
  StatusLancamento,
  FormaPagamento,
  Prisma,
} from "@prisma/client";

const LancamentoInput = z.object({
  igrejaId: z.string().min(1),
  categoriaId: z.string().optional().or(z.literal("")),
  contaId: z.string().optional().or(z.literal("")),
  tipo: z.nativeEnum(TipoLancamento),
  status: z.nativeEnum(StatusLancamento).default(StatusLancamento.PENDENTE),
  formaPagamento: z.nativeEnum(FormaPagamento).optional().or(z.literal("")),
  valor: z.string().min(1),
  data: z.string().min(1),
  descricao: z.string().optional().or(z.literal("")),
});

export async function criarLancamento(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = LancamentoInput.parse(raw);
  await prisma.lancamentoFinanceiro.create({
    data: {
      igrejaId: data.igrejaId,
      categoriaId: data.categoriaId || null,
      contaId: data.contaId || null,
      tipo: data.tipo,
      status: data.status,
      formaPagamento: (data.formaPagamento as FormaPagamento) || null,
      valor: data.valor,
      data: new Date(data.data),
      descricao: data.descricao || null,
    },
  });
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/financeiro/lancamentos");
  redirect("/admin/financeiro/lancamentos");
}

export async function deletarLancamento(id: string) {
  await prisma.lancamentoFinanceiro.delete({ where: { id } });
  revalidatePath("/admin/financeiro");
  revalidatePath("/admin/financeiro/lancamentos");
  redirect("/admin/financeiro/lancamentos");
}

const CampanhaInput = z.object({
  igrejaId: z.string().optional().or(z.literal("")),
  titulo: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífen"),
  descricao: z.string().optional().or(z.literal("")),
  meta: z.string().optional().or(z.literal("")),
  inicio: z.string().optional().or(z.literal("")),
  fim: z.string().optional().or(z.literal("")),
});

export async function criarCampanha(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const data = CampanhaInput.parse(raw);
  const c = await prisma.campanha.create({
    data: {
      igrejaId: data.igrejaId || null,
      titulo: data.titulo,
      slug: data.slug,
      descricao: data.descricao || null,
      meta: data.meta || null,
      inicio: data.inicio ? new Date(data.inicio) : null,
      fim: data.fim ? new Date(data.fim) : null,
    },
  });
  revalidatePath("/admin/financeiro/campanhas");
  redirect(`/admin/financeiro/campanhas/${c.id}`);
}

// =============================================================================
// IMPORTAÇÃO OFX
// =============================================================================

type OfxTx = {
  fitId?: string;
  data: Date;
  valor: number; // pode ser negativo
  memo?: string;
  tipo: "ENTRADA" | "SAIDA";
};

function parseOfxDate(raw: string): Date | null {
  // OFX usa formato YYYYMMDD[HHMMSS[.XXX][TZ]] (ex: 20251015103000[-3:BRT])
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function parseOfxAmount(raw: string): number {
  // OFX usa ponto ou vírgula como separador decimal
  const clean = raw.replace(/\s/g, "").replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

export function parseOfx(text: string): OfxTx[] {
  const txs: OfxTx[] = [];
  // Match cada bloco <STMTTRN>...</STMTTRN> (tolerante a SGML sem fechamento explícito)
  const blockRegex = /<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|<\/STMTTRN>)/gi;
  const matches = [...text.matchAll(blockRegex)];

  // Fallback: tenta capturar por linha-a-linha caso SGML não-padrão
  const blocks =
    matches.length > 0
      ? matches.map((m) => m[1])
      : text.split(/<STMTTRN>/i).slice(1);

  for (const blk of blocks) {
    const trntype = blk.match(/<TRNTYPE>\s*([^<\r\n]+)/i)?.[1]?.trim();
    const dtposted = blk.match(/<DTPOSTED>\s*([^<\r\n]+)/i)?.[1]?.trim();
    const trnamt = blk.match(/<TRNAMT>\s*([^<\r\n]+)/i)?.[1]?.trim();
    const fitid = blk.match(/<FITID>\s*([^<\r\n]+)/i)?.[1]?.trim();
    const memo = blk.match(/<MEMO>\s*([^<\r\n]+)/i)?.[1]?.trim();

    if (!dtposted || !trnamt) continue;
    const data = parseOfxDate(dtposted);
    if (!data) continue;
    const valor = parseOfxAmount(trnamt);
    if (valor === 0) continue;

    // Tipo: prioridade explícita TRNTYPE, fallback ao sinal
    let tipo: "ENTRADA" | "SAIDA";
    if (trntype) {
      const t = trntype.toUpperCase();
      if (["CREDIT", "DEP", "INT", "DIV", "OTHER"].includes(t)) {
        tipo = valor >= 0 ? "ENTRADA" : "SAIDA";
      } else if (["DEBIT", "FEE", "SRVCHG", "ATM", "POS", "CASH", "CHECK", "PAYMENT", "XFER"].includes(t)) {
        tipo = valor >= 0 ? "ENTRADA" : "SAIDA";
      } else {
        tipo = valor >= 0 ? "ENTRADA" : "SAIDA";
      }
    } else {
      tipo = valor >= 0 ? "ENTRADA" : "SAIDA";
    }

    txs.push({ fitId: fitid, data, valor, memo, tipo });
  }

  return txs;
}

export type ResumoOfx = {
  conciliadas: number;
  novas: number;
  conflitos: number;
  total: number;
  erro?: string;
};

const ProcessarOfxInput = z.object({
  igrejaId: z.string().min(1, "Selecione uma igreja"),
  contaId: z.string().min(1, "Selecione uma conta"),
  conteudo: z.string().min(10, "Arquivo OFX vazio ou inválido"),
});

export async function processarOfx(_prev: ResumoOfx | null, formData: FormData): Promise<ResumoOfx> {
  try {
    const arquivo = formData.get("arquivo");
    let conteudo = "";
    if (arquivo instanceof File) {
      conteudo = await arquivo.text();
    } else if (typeof arquivo === "string") {
      conteudo = arquivo;
    }
    const input = ProcessarOfxInput.parse({
      igrejaId: formData.get("igrejaId"),
      contaId: formData.get("contaId"),
      conteudo,
    });

    const txs = parseOfx(input.conteudo);
    if (txs.length === 0) {
      return { conciliadas: 0, novas: 0, conflitos: 0, total: 0, erro: "Nenhuma transação encontrada no arquivo OFX." };
    }

    let conciliadas = 0;
    let novas = 0;
    let conflitos = 0;

    for (const tx of txs) {
      const valorAbs = Math.abs(tx.valor);
      const dataMin = new Date(tx.data);
      dataMin.setDate(dataMin.getDate() - 1);
      const dataMax = new Date(tx.data);
      dataMax.setDate(dataMax.getDate() + 1);
      dataMax.setHours(23, 59, 59, 999);

      // Busca matches: mesma conta + tipo + valor em ±1 dia + status != CANCELADO
      const matches = await prisma.lancamentoFinanceiro.findMany({
        where: {
          igrejaId: input.igrejaId,
          contaId: input.contaId,
          tipo: tx.tipo,
          valor: new Prisma.Decimal(valorAbs),
          data: { gte: dataMin, lte: dataMax },
          status: { not: "CANCELADO" },
        },
        select: { id: true, status: true },
      });

      if (matches.length === 0) {
        // Novo lançamento pendente
        await prisma.lancamentoFinanceiro.create({
          data: {
            igrejaId: input.igrejaId,
            contaId: input.contaId,
            tipo: tx.tipo,
            status: "PENDENTE",
            valor: new Prisma.Decimal(valorAbs),
            data: tx.data,
            descricao: tx.memo ?? `OFX${tx.fitId ? ` · ${tx.fitId}` : ""}`,
          },
        });
        novas += 1;
      } else if (matches.length === 1) {
        // Match único — concilia
        const target = matches[0];
        if (target.status !== "CONCILIADO") {
          await prisma.lancamentoFinanceiro.update({
            where: { id: target.id },
            data: { status: "CONCILIADO" },
          });
        }
        conciliadas += 1;
      } else {
        // Múltiplos matches — conflito; concilia o primeiro não-conciliado se houver, senão o primeiro
        const naoConciliado = matches.find((m) => m.status !== "CONCILIADO");
        const alvo = naoConciliado ?? matches[0];
        await prisma.lancamentoFinanceiro.update({
          where: { id: alvo.id },
          data: { status: "CONCILIADO" },
        });
        conflitos += 1;
      }
    }

    revalidatePath("/admin/financeiro");
    revalidatePath("/admin/financeiro/lancamentos");
    revalidatePath("/admin/financeiro/fluxo-caixa");

    return { conciliadas, novas, conflitos, total: txs.length };
  } catch (e: unknown) {
    const erro = e instanceof Error ? e.message : "Falha ao processar OFX";
    return { conciliadas: 0, novas: 0, conflitos: 0, total: 0, erro };
  }
}
