# Maranata App — Mobile (Expo)

App nativo iOS + Android da IME Maranata. Espelha funcionalidades-chave do PWA web (`/membro`) e usa o mesmo backend em `https://maranata.app`.

- Bundle ID: `org.maranata.app`
- SSO via Maranata Key (`https://auth.maranata.app`)
- Stack: Expo SDK 54 + expo-router 6 + React Native 0.81 + React 19

## Status

- ✅ F12.0 scaffold (este commit): package.json, app.json, eas.json, tsconfig, tela login SSO funcional
- ⏳ F12.1 Apple Developer wire-up: criar app no App Store Connect → Apple ID `digital@igrejamaranata.com.br` → preencher `ascAppId` + `appleTeamId` em `eas.json` + `extra.eas.projectId` em `app.json` via `eas init`
- ⏳ F12.2 EAS Build dev profile (TestFlight interno)
- ⏳ F12.3 Push APNs (link com Apple Developer existente)
- ⏳ F12.4 Telas: Eventos, Pregações, Testemunhos, Doar (lê do mesmo Supabase via API REST do maranata.app)
- ⏳ F12.5 Submit App Store + Play Store

## Como rodar

```bash
cd apps/mobile
pnpm install        # (ou npm/yarn)
pnpm start          # abre o Expo Dev Menu, escaneia QR no iPhone com Expo Go
```

Pra iOS simulador (Mac): `pnpm ios`.

## Configurar EAS (primeiro setup)

```bash
cd apps/mobile
npx eas-cli@latest login     # paulocbrito@gmail.com ou conta digital@
npx eas-cli@latest init      # gera projectId e preenche app.json
npx eas-cli@latest build:configure
```

Depois preencher manualmente `eas.json` com `appleId` + `ascAppId` + `appleTeamId` da conta `digital@igrejamaranata.com.br`.

## SSO flow

1. Botão "Entrar com Maranata Key" abre `auth.maranata.app/api/sso/start?app=maranata-app&return=<deeplink>` via `expo-web-browser`.
2. Usuário autentica no MK.
3. MK redireciona pra `maranata://auth/callback?token=<jwt>`.
4. App guarda token em `SecureStore` e considera logado.
5. APIs do `maranata.app` aceitam o token via header `Authorization: Bearer <jwt>` ou cookie `maranata_app_session`.

> Necessário: registrar `maranata-app` como cliente válido no `~/dev/maranata-key/src/lib/maranata-suite.ts` com origin `maranata://`.

## Por que pasta `apps/mobile` e não repo separado

O repo `maranata-app` vai virar monorepo aos poucos:
- `app/` — webapp Next 16 (já existe)
- `apps/mobile/` — Expo (este)
- `apps/admin/` — futuro?
- `packages/` — shared types/API client

Por enquanto cada `apps/*` é independente (próprio `package.json`, sem workspace). Quando consolidar, migrar pra pnpm workspaces.
