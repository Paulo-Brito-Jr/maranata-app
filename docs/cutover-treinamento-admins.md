# Cutover · Roteiro de treinamento dos 42 admins

Sessão única de **60 minutos via Zoom** (ou presencial) pra migrar os 42 admins do InChurch pra Maranata App. Conteúdo cobre os 22 módulos da sidebar admin.

---

## 0. Pré-requisitos antes da sessão

- [ ] Lista nominal dos 42 admins (nome, e-mail, igreja, papel) — pedir secretaria
- [ ] Criar conta Maranata Key pra cada (https://auth.maranata.app — convite por e-mail)
- [ ] Atribuir papel correto: `SUPER_ADMIN` · `PASTOR_DIRETORIA` · `ADMIN_IGREJA` · `LIDER_CELULA` · `SECRETARIA` · `FINANCEIRO` · `KIDS_RESPONSAVEL` · `MEMBRO`
- [ ] Garantir acesso a `https://maranata.app/admin` antes da sessão
- [ ] Gravar a sessão pra quem não puder vir

---

## 1. Cronograma (60 min)

| Bloco | Tempo | O que mostrar |
|---|---:|---|
| **Boas-vindas + por que mudamos** | 5 min | "Plataforma própria, sem terceiros, total cuidado com nossos dados" |
| **Login + tela inicial** | 5 min | https://auth.maranata.app → /admin · Tour pela sidebar (22 itens) |
| **Membros** | 7 min | Buscar, criar, editar, histórico timeline ([[F20]]) |
| **Células** | 5 min | Lista, redes, métricas (9 dim), buscador público |
| **Eventos** | 7 min | Criar, lotes, ingressos, check-in QR ([[F3]]) |
| **Financeiro** | 8 min | DRE 12m, fluxo caixa, OFX, multi-conta (15 igrejas), Doadores |
| **Intercessão & Testemunhos** | 5 min | Atribuir intercessor, escala 7×24, bulk publish testemunhos |
| **Kids** | 4 min | Check-in com QR, etiquetas, histórico |
| **Push, Banners, Config, Auditoria** | 8 min | Templates push, criar banner, feature flags, AuditLog |
| **Perguntas + próximos passos** | 6 min | — |

---

## 2. Fluxos críticos pra demonstrar (drag-and-drop checklist)

### Membros (`/admin/membros`)
- [ ] Buscar membro por nome/CPF
- [ ] Editar campo → ver histórico criado automaticamente em `/admin/membros/[id]/historico`
- [ ] Status: ATIVO, INATIVO, TRANSFERIDO, FALECIDO, AFASTADO

### Células (`/admin/celulas` + `/admin/celulas/metricas`)
- [ ] Listar 218 células ativas
- [ ] Ver métricas 30 dias (presentes, visitantes, conversões)
- [ ] Buscador público em `/celulas` (link InChurch substituído)

### Eventos (`/admin/eventos`)
- [ ] Criar evento com lote pago
- [ ] Configurar perguntas customizadas
- [ ] Check-in via QR `/admin/eventos/[id]/checkin`

### Financeiro (`/admin/financeiro`)
- [ ] DRE 12 meses (`/admin/financeiro/dre`) com filtro por igreja
- [ ] Fluxo caixa 90 dias (`/admin/financeiro/fluxo-caixa`)
- [ ] Importar OFX (`/admin/financeiro/importar-ofx`) — conciliação automática por valor + data
- [ ] 15 contas bancárias (1 por igreja) com saldo
- [ ] **Doadores** (`/admin/doadores`) — 1.055 importados do InChurch

### Intercessão (`/admin/intercessao`)
- [ ] Top 20 pedidos mais antigos (alerta vermelho +48h)
- [ ] Atribuir intercessor em lote
- [ ] Cadastrar escala 7×24 em `/admin/intercessao/escala`
- [ ] Cron `prayer-sla-check` roda a cada 6h e avisa intercessor

### Testemunhos (`/admin/testemunhos`)
- [ ] 1.343 testemunhos publicados (todos online em `/testemunhos`)
- [ ] Bulk actions: destaques · últimos 60d · TODOS · despublicar

### Kids (`/admin/kids`)
- [ ] Cadastrar criança com alergias + autorização imagem
- [ ] Check-in com etiqueta + QR
- [ ] Histórico de frequência

### Push (`/admin/push`)
- [ ] 8 templates default seedados (Bom dia Domingo, Quinta Viva, etc)
- [ ] Criar push manual com filtro
- [ ] 5 crons já agendados (domingo 8h, quinta 14h, sexta 18h, mensal, aniversário)

### Config (`/admin/config`)
- [ ] 26 feature flags (8 ON: cell_finder, journey, kids, multi-conta, prayer_clock, public_testimony, safe2pay, smart_store)
- [ ] 15 igrejas

### Auditoria (`/admin/audit`)
- [ ] Trilha completa de ações (filtros por tipo, badges coloridas)

---

## 3. Papéis e o que cada um vê

| Papel | Acesso |
|---|---|
| `SUPER_ADMIN` | Tudo, todas as 15 igrejas, pode impersonar |
| `PASTOR_DIRETORIA` | Tudo, exceto config sistêmico |
| `ADMIN_IGREJA` | Apenas sua igreja: membros, células, eventos, financeiro local |
| `LIDER_CELULA` | Sua célula apenas: participantes, relatórios |
| `SECRETARIA` | Pessoas + eventos da sua igreja |
| `FINANCEIRO` | Financeiro da sua igreja + DRE consolidado |
| `KIDS_RESPONSAVEL` | Apenas /admin/kids da sua igreja |
| `MEMBRO` | Não vê /admin (redirecionado pra /membro) |

---

## 4. Perguntas frequentes (antecipar)

**Q: O que acontece com meus dados no InChurch antigo?**
R: Tudo migrou. 2.745 membros, 6.668 usuários, 2.731 eventos, 1.376 lançamentos. Backup completo guardado.

**Q: Vou perder o histórico?**
R: Não. Cada Membro tem campo `inchurchId` que cruza com o ID antigo. Histórico timeline em `/admin/membros/[id]/historico` registra toda mudança a partir de agora.

**Q: Doações já funcionam?**
R: Sim, Safe2Pay integrado. Toggle ANUAL adicionado. QR codes prontos pra impressão em todas as 15 igrejas.

**Q: E o app no celular?**
R: PWA pronto (basta acessar `maranata.app` no celular). App nativo Expo (iOS/Android) em desenvolvimento.

**Q: Quando o InChurch antigo será desligado?**
R: 30-37 dias após o anúncio. Período de transição com banner pedindo migração.

---

## 5. Material de apoio

- **Docs**: `~/dev/maranata-app/PARIDADE-INCHURCH.md` (playbook técnico completo)
- **PRs entregues**: https://github.com/Paulo-Brito-Jr/maranata-app/pulls?q=is%3Apr+paridade
- **Status Skynet**: projeto `prj_UvJRqxWz5S` (Maranata App)
- **Backup pré-cutover**: `~/dev/maranata-app-paridade-backups/2026-05-20/`

---

## 6. Pós-treinamento (checklist Paulo)

- [ ] Gravação do treino disponível no Drive
- [ ] FAQ atualizada com perguntas reais
- [ ] Canal WhatsApp/Slack pra dúvidas dos 42 admins
- [ ] Smoke test agendado: cada admin executa 3 ações em 7 dias
- [ ] Cancelar contrato InChurch após 30 dias (F23)
