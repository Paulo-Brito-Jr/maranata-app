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
Cada item: branch dedicada, PR, preview Vercel, merge main.

3a. Push notifications real (M2)
3b. Public testimony + Prayer Clock (M1)
3c. Safe2Pay recurrence + divulgação (M2)
3d. Financeiro avançado: multi-conta + DRE + OFX + saídas (M3)
3e. Eventos recorrentes expandidos (M2)
3f. Buscador público de células (M1)
3g. Métricas células (9 tipos) (M3)
3h. Schemas novos: AtendimentoPastoral, CampoCustomizado, Subnomenclatura, MensagemSistema, PaginaMultiuso, HistoricoMembro (M3)
3i. Catálogo Feature Flags (21) (M1)
3j. Mídia completa: banners+atalhos+downloads completos + YouTube/SoundCloud integration (M2)

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
