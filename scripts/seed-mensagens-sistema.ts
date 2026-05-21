/**
 * Seed: 5 mensagens de sistema + 4 páginas multiuso default.
 * Idempotente: upsert por chave/slug.
 * Roda: pnpm tsx --env-file=.env.local scripts/seed-mensagens-sistema.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL! }),
});

const MENSAGENS = [
  {
    chave: "boas_vindas_membro",
    titulo: "Bem-vindo(a) à família Maranata",
    conteudo: "Estamos muito felizes em te receber. Acesse seu perfil pra ver eventos, células e devocional do dia.",
  },
  {
    chave: "boas_vindas_visitante",
    titulo: "Bem-vindo(a) à Maranata",
    conteudo: "Que bom te ter aqui! Conheça nossas 15 igrejas, encontre uma célula perto de você e faça parte da família.",
  },
  {
    chave: "doacao_obrigado",
    titulo: "Obrigado pelo seu cuidado com a obra",
    conteudo: "Sua contribuição é uma semente preciosa. Que Deus multiplique cada porção honrada.",
  },
  {
    chave: "inscricao_evento_confirmada",
    titulo: "Inscrição confirmada",
    conteudo: "Seu lugar está garantido. Você receberá lembretes próximos da data. Tudo pronto pra te ver lá.",
  },
  {
    chave: "pedido_oracao_recebido",
    titulo: "Seu pedido foi recebido",
    conteudo: "A equipe de intercessão da Maranata vai orar por você nas próximas 48 horas. Em Cristo, nada é em vão.",
  },
];

const PAGINAS = [
  {
    slug: "sobre",
    titulo: "Sobre a Maranata",
    conteudo: `# Igreja Missionária Evangélica Maranata

Somos a IGREJA MISSIONÁRIA EVANGÉLICA MARANATA (CNPJ 42.117.804/0001-15), com 15 unidades no Rio de Janeiro e Baixada Fluminense.

## Nossa missão

Servir a Deus e ao próximo, fazer discípulos de todas as nações, anunciar o Evangelho de Cristo.

## Unidades

- Tijuca (Sede)
- Méier · Duque de Caxias · Copacabana · Jacarepaguá · Irajá
- Campo Grande · São João de Meriti · Recreio · Nova Iguaçu
- Jardim Primavera · Vila São Luiz · Lote XV · Rio das Ostras
`,
    publicada: true,
  },
  {
    slug: "privacidade",
    titulo: "Política de Privacidade",
    conteudo: `# Política de Privacidade — Maranata App

Seus dados são tratados conforme a Lei Geral de Proteção de Dados (LGPD).

## O que coletamos

- Dados de cadastro (nome, e-mail, telefone) — pra te identificar e comunicar.
- Dados de doação (CPF, endereço) — exigidos por lei pra recibo fiscal.
- Dados Kids (alergias, autorização imagem) — pra cuidado pastoral.

## Como protegemos

- Dados criptografados em trânsito (HTTPS).
- Storage em servidor restrito (Supabase, Brasil).
- Acesso somente por equipe pastoral e administrativa autorizada.

## Seus direitos

Você pode pedir exclusão, correção ou acesso aos seus dados a qualquer momento via secretaria@igrejamaranata.com.br.
`,
    publicada: true,
  },
  {
    slug: "termos",
    titulo: "Termos de Uso",
    conteudo: `# Termos de Uso — Maranata App

Ao usar este aplicativo, você concorda com os termos abaixo.

## Conta

- Acesso por SSO Maranata Key.
- Mantenha seus dados atualizados.
- Não compartilhe sua senha.

## Conteúdo

- Pregações, devocional e materiais são de uso pessoal — não republique sem autorização.
- Testemunhos podem ser tornados públicos com seu consentimento.

## Doações

- Processadas via Safe2Pay (gateway certificado).
- Recibos disponíveis no e-mail cadastrado.
`,
    publicada: true,
  },
  {
    slug: "faq",
    titulo: "Perguntas Frequentes",
    conteudo: `# Perguntas Frequentes

## Como me cadastro?

Toque em "Entrar" e escolha "Criar conta" no Maranata Key. Use o e-mail que recebe os comunicados.

## Como ativar notificações?

No menu Membro → Mais → "Notificações". Habilita pra receber lembrete de evento, devocional e quando seu pedido for respondido.

## Como dar dízimo recorrente?

Em /doar, escolha "Mensal" e preencha. Você pode cancelar a qualquer momento.

## Esqueci minha senha

Acesse https://auth.maranata.app e clique em "Esqueci a senha".
`,
    publicada: true,
  },
];

async function main() {
  console.log(`Seedando ${MENSAGENS.length} mensagens...`);
  for (const m of MENSAGENS) {
    await prisma.mensagemSistema.upsert({
      where: { chave: m.chave },
      create: { ...m, ativa: true },
      update: { titulo: m.titulo, conteudo: m.conteudo },
    });
    console.log(`  ✓ ${m.chave}`);
  }
  console.log(`\nSeedando ${PAGINAS.length} páginas multiuso...`);
  for (const p of PAGINAS) {
    await prisma.paginaMultiuso.upsert({
      where: { slug: p.slug },
      create: p,
      update: { titulo: p.titulo, conteudo: p.conteudo, publicada: p.publicada },
    });
    console.log(`  ✓ /${p.slug}`);
  }
  console.log("Concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
