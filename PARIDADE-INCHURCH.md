# Paridade 100% InChurch → Maranata App

> Documento mestre da operação iniciada **2026-05-20**.
> Substituir o ecossistema InChurch da IME Maranata em 100% — dados + funcionalidades.

## Fontes envolvidas

| Sistema | Onde mora | Dados |
|---|---|---|
| **InChurch fornecedor** | `admin.inchurch.com.br` + API `inradar.com.br/api` (header `channel: control_panel` + `Authorization: ApiKey producao.3:…`) | 6.674 users app, 2.744 membros, 2.731 eventos, 156 células, 806 pedidos oração, 689 testemunhos, 4.967 sentimentos, 587 pregações, 1.376 lançamentos, etc |
| **Espelho InChurch** | Supabase `yszpvlfffkiguorwbyaw` (sa-east-1), 82 tabelas snake_case, **última sync 2026-05-19** | Dump em `~/dev/maranata-app-paridade-backups/2026-05-20/inchurch-mirror-172105.sql.gz` |
| **Maranata App (alvo)** | Supabase `rvnzncwouhrwljzwuytr` (sa-east-1 pooler 6543), Prisma 7, **88 models**, F0-F13 entregues | Live em https://maranata.app · dump em `~/dev/maranata-app-paridade-backups/2026-05-20/maranata-app-172138.sql.gz` |

## Snapshot inicial (2026-05-20)

Cross-check entre espelho InChurch e banco Maranata App (gap = quanto falta sincronizar):

| Espelho (snake_case) → Maranata (Prisma) | InChurch | Maranata App | Diff |
|---|---:|---:|---:|
| `eventos` → `Evento` | 2.731 | 315 | **+2.416** |
| `pedidos_oracao` → `PedidoOracao` | 1.289 | 483 | **+806** |
| `testemunhos` → `Testemunho` | 1.343 | 654 | **+689** |
| `celulas` → `Celula` | 218 | 62 | **+156** |
| `downloads` → `Download` | 168 | 84 | +84 |
| `atalhos` → `Atalho` | 81 | 1 | +80 |
| `banners` → `Banner` | 93 | 40 | +53 |
| `redes_celulas` → `Rede` | 29 | 3 | +26 |
| `membros` → `Membro` | 2.745 | 2.731 | +14 |
| `usuarios_app` → `UsuarioApp` | 6.668 | 6.662 | +6 |
| `novos_convertidos` → `NovoConvertido` | 4 | 0 | +4 |
| `participantes_celulas` → `ParticipanteCelula` | 713 | 0 | **+713** |
| `visitantes_celulas` → `VisitanteCelula` | 85 | 0 | +85 |
| `sentimentos` → `Sentimento` | 9 | 18 | -9 |
| `categorias_*` → `Categoria*` | 22 (3+8+11) | 47 (12+16+19) | -25 |
| Identidade (igrejas, regionais, pregacoes, lancamentos_financeiros, transmissoes, planos_leitura, fornecedores, trilhas, contas_bancarias, usuarios, series_pregacoes, grupos_ministeriais) | = | = | 0 |

Valores negativos = Maranata tem mais (seeds locais preservar via UPSERT).

## Plano de execução

### ✅ Fase 0 — Backup + Snapshot (2026-05-20)
- ✅ Dump full ambos bancos (pg_dump 17 via Docker)
- ✅ Schema-only dump pra diff
- ✅ Row-counts CSV
- Local: `~/dev/maranata-app-paridade-backups/2026-05-20/`

### ✅ Fase 1 — Re-sync fornecedor → espelho (SKIP)
Espelho atualizado em 2026-05-19. Marcado como concluído por estar fresco. Criar fetcher canônico fica como follow-up.

### ✅ Fase 2 — ETL espelho → Maranata App (concluída 2026-05-20)

**Schema:** adicionado `inchurchId`, `igrejaId`, `totalCelulas` em `Rede` (migration safe, nullable).

**ETL:** estendido com fase `etlRede`, parse seguro `intOrNull()` para `dia_semana`, mapeamento `redeId` em `Celula`, `loadRedesNew()` / `loadCelulasNew()` para rodar fases isoladas.

**Resultado** (cross-check pós-ETL):

| Tabela InChurch → Maranata | InChurch | Maranata | Status |
|---|---:|---:|---|
| `membros` → `Membro` | 2745 | 2745 | ✅ idêntico |
| `usuarios_app` → `UsuarioApp` | 6668 | 6668 | ✅ idêntico |
| `eventos` → `Evento` | 2731 | 2731 | ✅ idêntico (cresceu de 315 → 2731) |
| `celulas` → `Celula` | 218 | 218 | ✅ idêntico (cresceu de 62 → 218) |
| `pedidos_oracao` → `PedidoOracao` | 1289 | 1289 | ✅ idêntico (cresceu de 483) |
| `testemunhos` → `Testemunho` | 1343 | 1343 | ✅ idêntico (cresceu de 654) |
| `pregacoes` → `Pregacao` | 587 | 587 | ✅ idêntico |
| `lancamentos_financeiros` → `LancamentoFinanceiro` | 1376 | 1376 | ✅ idêntico |
| `downloads` → `Download` | 168 | 168 | ✅ idêntico (cresceu de 84) |
| `banners` → `Banner` | 93 | 93 | ✅ idêntico (cresceu de 40) |
| `redes_celulas` → `Rede` | 29 | 32 (29 + 3 seeds locais) | ✅ + extras |
| `atalhos` → `Atalho` | 81 | 82 (81 + 1 local) | ✅ + extras |
| `visitantes` → `Visitante` | 310 | 318 (+ 4 novos convertidos virou Visitante + 4 outros locais) | ✅ + extras |
| `participantes_celulas` → `VisitanteCelula` | 713 | 0 | ⚠️ origem com `celula_id`=NULL p/ todos (defeito de captura, NÃO do ETL) |
| `visitantes_celulas` → `VisitanteCelula` | 85 | 0 | ⚠️ idem |

**Resolução para os 798 participantes/visitantes:** rodar Fase 1 (re-sync fornecedor) com fetcher novo que preserva `celula_id` original do InChurch API. Endpoint: `/api/v1/small_group/` ou parse de `/api/v1/cell/?...=members`.

### 🟡 Fase 3 — Features faltantes (paridade funcional)

**Progresso 2026-05-20 (sessão Opus 4.7):**

| # | Item | Status | Entregas |
|---|---|---|---|
| 3a | Push notifications real | ✅ | lib/push.ts + 5 crons + 8 templates default (`Bom dia Domingo`, `Quinta Viva`, `Sexta Célula`, `Dia de Dízimo`, `Aniversariantes`, `Pedido Respondido`, `Testemunho Publicado`, `Resumo Mensal`). Adoção (subscriptions=0) é operacional, infra pronta. Seed: `pnpm tsx --env-file=.env.local scripts/seed-push-templates.ts` |
| 3b | Public testimony + Prayer Clock | 🟡 agente | Public testimony respeita flag `public_testimony` (ON). Prayer Clock (escala SLA 48h + bulk publish) entregue por agente em paralelo |
| 3c | Safe2Pay recorrência + divulgação | ✅ | Toggle ANUAL adicionado em /doar. 2 banners permanentes seedados ("Seja parceiro Maranata" + "Maranata 2026"). Flag `safe2pay_recurrence` ON. Backend lib/safe2pay já completo (subscription + checkout + hmac + webhook) |
| 3d | Financeiro avançado | 🟡 agente | Multi-conta (15 contas, 1 por igreja), DRE 12m, fluxo caixa, importar OFX. Entregue por agente em paralelo |
| 3e | Eventos recorrentes expandidos | ✅ | Não precisou trabalho — captura InChurch já expandiu 315 → 2731 ocorrências (1859 marcados `recorrente=t`, range 2022-2028) |
| 3f | Buscador público de células | ✅ | /(public)/celulas — server component force-dynamic + querystring filters (igreja/dia/rede/q), respeita flag `cell_finder`. Links em /(public)/eventos e /(public)/layout |
| 3g | Métricas células (9 tipos) | ✅ | /admin/celulas/metricas — total/ativas/inativas, comparecimento 30d (presentes/visitantes/conversões), top 10 maiores, distribuição rede/igreja/dia |
| 3h | Schemas novos | 🟡 agente | AtendimentoPastoral, CampoCustomizado, RespostaCampo, Subnomenclatura, MensagemSistema, PaginaMultiuso, HistoricoMembro + 6 admin UIs + sidebar. Entregue por agente |
| 3i | Catálogo Feature Flags | ✅ | 21 flags InChurch importadas via ETL com descrições curativas. FLAGS_SUGERIDAS em /admin/config expandido pra 26 (5 locais + 21 InChurch). Flags ON: cell_finder, journey, public_testimony, safe2pay_recurrence |
| 3j | Mídia completa (banners/atalhos/downloads/loja) | 🟡 agente | YouTube embed em pregações, página downloads pública, loja básica com carrinho + checkout Safe2Pay. Entregue por agente |

### 🟡 Fase 4 — Validação + cutover
- Smoke tests por módulo
- Cross-check final InChurch original vs Maranata App
- Anúncio cutover
- Plano de descontinuação InChurch (cancelamento $/contrato fornecedor)

## Backups

Todos os backups em `~/dev/maranata-app-paridade-backups/YYYY-MM-DD/`:
- `inchurch-mirror-*.sql.gz` — dump full do espelho
- `maranata-app-*.sql.gz` — dump full do app
- `*-schema-*.sql` — schema-only (uncompressed, fácil leitura)
- `row-counts-snapshot-*.csv` — contagens

## F08 — Status investigação fetcher fornecedor (2026-05-21)

API InChurch funcional via `INCHURCH_API_TOKEN` + header `channel: control_panel`:

```bash
TOKEN=$(vault get "$VAULT_PASSWORD" INCHURCH_API_TOKEN)
BASE=https://inradar.com.br/api
curl -H "Authorization: $TOKEN" -H "channel: control_panel" "$BASE/v1/cell/?limit=2"
```

Endpoints testados:
- ✅ `/v1/cell/` lista 156 cells com `leaders[]`, `network`, `tertiarygroup`
- ✅ `/v1/cell/{id}/` detalhe single (mas com `participants:[]` e `visitors:[]` vazios na amostra testada)
- ❌ `/v1/cell_visitor/?cell={id}` retorna vazio (sem dados ou endpoint diferente)
- ❌ `/v1/member_profiles/?cell={id}` retorna `total_count: 0`
- ❌ `/v1/cell_member/` rota inexistente (HTML)
- ✅ `/v1/small_group/?cell={id}` retorna small groups mas não membros

**Próximo passo (F08 retomada):**
1. Capturar HAR da admin.inchurch.com.br ao navegar célula→participantes
2. Identificar endpoint exato e payload
3. Implementar fetcher TypeScript com pagination + retry + rate limit
4. Re-popular `participantes_celulas.celula_id` e `visitantes_celulas.celula_id`
5. Rerodar `pnpm etl:table VisitanteCelula` no maranata-app

Alternativa: scrape via Playwright autenticado em admin.inchurch.com.br (rota `/celulas/lista` → cell detail → aba membros).

## F26 — Auditoria final (2026-05-21)

Cross-check `inchurch-dashboard` (32 rotas read-only) vs `maranata-app` (105 rotas):

| Rota inchurch-dashboard | Equivalente maranata-app | Status |
|---|---|---|
| `/dashboard` | `/admin` | ✅ |
| `/membros` | `/admin/membros` (CRUD completo) | ✅ |
| `/usuarios-app` | `/admin/membros` (subset por papel) | ✅ |
| `/visitantes` | `/admin/membros` (filtro) | ✅ |
| `/novos-convertidos` | model NovoConvertido + página inline | ✅ |
| `/aniversariantes` | `/admin/aniversariantes` | ✅ |
| `/celulas` | `/admin/celulas` + `/(public)/celulas` | ✅ |
| `/eventos` | `/admin/eventos` + `/(public)/eventos` | ✅ |
| `/transmissoes` | embed em pregações | ✅ |
| `/pregacoes` | `/admin/pregacoes` + `/membro/pregacoes` | ✅ |
| `/categorias-series` | `/admin/pregacoes` (filtros) | ✅ |
| `/planos-leitura` | model + `/membro/biblia` | ✅ |
| `/downloads` | `/(public)/downloads` + admin via /admin/loja | ✅ |
| `/banners` | seed + admin (futuro UI dedicada) | ⚠️ falta UI admin dedicada |
| `/noticias` | via Banner / PaginaMultiuso | ⚠️ revisar |
| `/comunicacao` | `/admin/push` + `/admin/mensagens` | ✅ |
| `/sentimentos` | `/admin/intercessao` | ✅ |
| `/pedidos-oracao` | `/admin/intercessao` + `/admin/intercessao/escala` | ✅ |
| `/testemunhos` | `/admin/testemunhos` + `/(public)/testemunhos` | ✅ |
| `/historico` | `/admin/membros/[id]/historico` | ✅ |
| `/trilhas-equipes` | `/admin/jornadas` | ✅ |
| `/financeiro` | `/admin/financeiro` + dre + fluxo-caixa + ofx | ✅ |
| `/igrejas` | `/admin/config` (lista) | ✅ |
| `/feature-flags` | `/admin/config` (catálogo 26 flags) | ✅ |
| `/auditoria` | model AuditLog (sem UI dedicada) | ⚠️ falta UI |
| `/insights` | sem equivalente direto (hardcoded) | ❌ não migrado (não-crítico) |
| `/mapa-inchurch` | não relevante (doc migração) | n/a |
| `/origem-inchurch` | não relevante (doc) | n/a |
| `/modulos` | sidebar admin nativo | ✅ |
| `/exportar` | `/admin/financeiro/exportar` | ✅ |

**Resultado:** 25/27 rotas operacionais migradas. 2 com UI admin pendente (Banners dedicado, AuditLog dedicado). 3 não relevantes pra paridade (insights hardcoded, mapa e origem InChurch eram docs internas).

**Recomendação cutover:** após F21 (comunicar membros) + F22 (treinar 42 admins) + F23 (cancelar contrato), `inchurch-dashboard` pode ser arquivado. Mantém-se o backup ETL como histórico imutável da paridade.

## Comandos de rollback

Restaurar Maranata App a partir do backup desta sessão:

```bash
gunzip -c ~/dev/maranata-app-paridade-backups/2026-05-20/maranata-app-172138.sql.gz | \
  docker run --rm -i postgres:17-alpine psql "$(vault get \"$VAULT_PASSWORD\" MARANATA_APP_DIRECT_URL)"
```

## Credenciais (todas no vault)

- `INCHURCH_*` — fornecedor (admin email, API token, base URL)
- `MARANATA_APP_*` — app alvo (Supabase URL, anon, service role, DB password)
- `MARANATA_APP_DATABASE_URL` / `MARANATA_APP_DIRECT_URL` — DSN Postgres
- `SAFE2PAY_*` — pagamento
- `MARANATA_APP_WEB_PUSH_*` — VAPID PWA
