/**
 * F07: gera QR codes "Doação Maranata" — 1 PNG por igreja + 1 HTML
 * pronto pra imprimir (Chrome → Imprimir → PDF, formato A4).
 *
 * Cada QR aponta pra https://maranata.app/doar?ref=<slug-igreja>
 * pra futuro tracking de origem.
 *
 * Output:
 *   ~/dev/maranata-app/qrcodes/<slug>.png   (15 imagens 1200x1200)
 *   ~/dev/maranata-app/qrcodes/index.html   (15 páginas A4 pronto pra imprimir)
 *
 * Roda: pnpm tsx --env-file=.env.local scripts/gerar-qr-igrejas.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://maranata.app";
const OUT_DIR = join(process.cwd(), "qrcodes");

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const igrejas = await prisma.igreja.findMany({
    where: { ativa: true },
    orderBy: [{ ehSede: "desc" }, { nome: "asc" }],
  });

  console.log(`Gerando QR codes pra ${igrejas.length} igrejas...`);

  const items: { nome: string; slug: string; url: string; pngPath: string; endereco: string | null }[] = [];

  for (const ig of igrejas) {
    const slug = slugify(ig.apelido ?? ig.nome);
    const url = `${APP_URL}/doar?ref=${slug}`;
    const pngPath = join(OUT_DIR, `${slug}.png`);
    await QRCode.toFile(pngPath, url, {
      width: 1200,
      margin: 2,
      color: { dark: "#1E3A5F", light: "#FFFFFF" }, // azul Maranata
      errorCorrectionLevel: "H",
    });
    console.log(`  ✓ ${ig.nome.padEnd(30)} → /doar?ref=${slug}`);
    items.push({ nome: ig.nome, slug, url, pngPath: `${slug}.png`, endereco: ig.endereco });
  }

  // Gera index.html com 1 QR por página A4
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>QR Codes Doação · Maranata</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, system-ui, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #1E3A5F; }
  .page { width: 210mm; height: 297mm; page-break-after: always; padding: 18mm; display: flex; flex-direction: column; justify-content: space-between; }
  .page:last-child { page-break-after: auto; }
  .header { text-align: center; }
  .header .brand { font-size: 14pt; letter-spacing: 8px; color: #F0641E; font-weight: 800; }
  .header .igreja { font-size: 28pt; font-weight: 800; margin-top: 14pt; line-height: 1.1; }
  .header .endereco { font-size: 11pt; color: #6b6182; margin-top: 6pt; }
  .qr-wrap { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; }
  .qr-wrap img { width: 130mm; height: 130mm; }
  .cta { text-align: center; margin-top: 14pt; }
  .cta .titulo { font-size: 22pt; font-weight: 700; }
  .cta .sub { font-size: 13pt; color: #6b6182; margin-top: 6pt; }
  .footer { text-align: center; font-size: 10pt; color: #6b6182; }
  .footer .url { font-family: "SF Mono", "Menlo", monospace; font-size: 9pt; }
  .footer .versiculo { font-style: italic; margin-top: 8pt; font-size: 11pt; color: #1E3A5F; }
  @media screen {
    body { background: #f5f5f5; padding: 20px; }
    .page { background: white; margin: 0 auto 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  }
</style>
</head>
<body>
${items
  .map(
    (it) => `
<section class="page">
  <header class="header">
    <p class="brand">MARANATA</p>
    <h1 class="igreja">${it.nome}</h1>
    ${it.endereco ? `<p class="endereco">${it.endereco}</p>` : ""}
  </header>

  <div class="qr-wrap">
    <img src="${it.pngPath}" alt="QR doação ${it.nome}">
    <div class="cta">
      <p class="titulo">Seja parceiro da obra</p>
      <p class="sub">Aponte a câmera do celular pra contribuir</p>
    </div>
  </div>

  <footer class="footer">
    <p class="url">${it.url}</p>
    <p class="versiculo">"Trazei todos os dízimos à casa do tesouro." (Ml 3.10)</p>
  </footer>
</section>`,
  )
  .join("")}
</body>
</html>`;
  await writeFile(join(OUT_DIR, "index.html"), html, "utf8");

  console.log(`\n✅ ${items.length} QR codes + 1 index.html em ${OUT_DIR}`);
  console.log(`\nPra imprimir:`);
  console.log(`  open ${OUT_DIR}/index.html`);
  console.log(`  → Chrome → Imprimir → Salvar como PDF (A4) → enviar pra gráfica`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
