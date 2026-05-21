export type OfxTx = {
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
  const blockRegex = /<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|<\/STMTTRN>)/gi;
  const matches = [...text.matchAll(blockRegex)];

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
