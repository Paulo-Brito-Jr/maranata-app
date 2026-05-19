# Maranata App — instruções pra agentes

## O que é

Plataforma própria da IME Maranata que substitui o InChurch. Cobre:

- **Admin web** (diretoria + 42 admins): membresia, células, eventos, mídia, intercessão, financeiro, kids, jornadas, loja
- **PWA membro** (6.662 usuários): feed, eventos, testemunhos, pedidos de oração, doação recorrente
- **Área pública**: inscrição em evento sem login, doação avulsa, loja

Fonte canônica do raio-X: `~/dev/Obsidian_Skynet/Setup/maranata-inchurch-raio-x-completo.md` (+ `maranata-app-banco-final.md`, `maranata-feature-flags-reais.md`, `maranata-3-acoes-impacto-imediato.md`, `inchurch-site-raio-x-completo.md`, `inchurch-kids-detalhes.md`, `inchurch-loja-inteligente-detalhes.md`).

## Stack

- **Next.js 16.2.6** (App Router). ⚠️ Tem breaking changes vs Next 15 — antes de escrever código, consultar `node_modules/next/dist/docs/`.
- React 19.2.4
- TypeScript strict
- Tailwind v4 (PostCSS plugin `@tailwindcss/postcss`) + tokens OKLCH + dark mode (`next-themes`)
- Prisma 7.8 (adapter `@prisma/adapter-pg`)
- Supabase SSR (`@supabase/ssr` 0.5)
- `@base-ui/react` (não shadcn puro — base-ui é a fundação)
- pnpm

## Convenções

- Sistema visual oficial Maranata (cópia do `festa-amor-maranata`): laranja `oklch(0.685 0.193 39)` + azul `oklch(0.354 0.107 264)` + dark mode obrigatório.
- Cor identitária Paulo no admin do super-admin (estatuto perpétuo).
- Credenciais sempre via `vault get "$VAULT_PASSWORD" <CHAVE>` — nunca hardcode.
- Auth: SSO via Maranata Key (`lib/maranata-key-sso.ts`); fallback magic link Supabase Auth pra membros.
- API routes em `app/api/<recurso>/route.ts` com `zod` na validação.
- Mutations via Server Actions sempre que possível.
- Todo `insert` crítico usa `.select().single()` pra capturar erro silencioso (memória `feedback_confirmar_insert_com_select`).
- Web Push PWA usa `web-push`, tabela `PushSubscription`, componente `PushToggle` e envs Vercel já existentes: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

## Domínio

- Produção: `https://maranata.app` (raiz, Cloudflare DNS-only → Vercel)
- Preview: `https://maranata-app-*.vercel.app`

## Banco de dados

- **Supabase novo**, projeto `maranata-app-prod` (criado na F0.2 via Management API).
- Credenciais no vault sob prefixo `MARANATA_APP_V2_*`.
- Não confundir com o Supabase legado `yszpvlfffkiguorwbyaw` (esse continua sendo a auditoria InChurch em `~/dev/maranata-app-dashboard`).

## Como rodar local

```bash
cd ~/dev/maranata-app
pnpm install
cp .env.example .env.local
# preencher .env.local via vault
pnpm db:push    # aplica schema no Supabase
pnpm dev
```

## Comunicação entre agentes

Vide `~/.claude/CLAUDE.md` (skynet_chamar_agente, skynet_ler_mensagens_agente). Em decisões cinzentas, registrar premissa via `skynet_registrar_conhecimento`.
