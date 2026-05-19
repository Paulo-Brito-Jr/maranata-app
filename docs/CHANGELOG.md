# Changelog

## 2026-05-19

- Implementado Web Push real para o PWA do membro: inscrição do navegador em `/api/push/subscribe`, persistência em `PushSubscription` e disparo via `web-push`.
- Crons de comunicação agora criam o `PushNotification` e tentam disparar imediatamente quando VAPID está configurado.
- Admin `/admin/push` também dispara o push recém-criado.
- Build ficou independente de download do Google Fonts: fontes passaram para stack local/sistema com as mesmas CSS vars.
- Schema aplicado no Supabase com `pnpm db:push`.
