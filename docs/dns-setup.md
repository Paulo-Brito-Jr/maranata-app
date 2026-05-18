# Conectar `maranata.app` ao Vercel

Domínio comprado em `Cloudflare Registrar conta pcbweb` (ver `setup_dominio_canonico_maranata_app` na memória). Como o token Cloudflare disponível no vault só tem acesso à zona `britos.app`, Paulo precisa adicionar os registros abaixo manualmente.

## Passo 1 — Verificação (TXT records)

Vercel já adicionou os domínios `maranata.app` e `www.maranata.app` ao projeto `maranata-app-v2`. Falta provar que somos donos. No Cloudflare, na zona `maranata.app`, criar:

| Tipo | Nome     | Valor                                                  | Proxy   |
|------|----------|--------------------------------------------------------|---------|
| TXT  | _vercel  | `vc-domain-verify=maranata.app,f2f0bb2e4841488f088b`   | DNS-only |
| TXT  | _vercel  | `vc-domain-verify=www.maranata.app,82cba7b91a345e6126b0` | DNS-only |

## Passo 2 — Apontar tráfego

Na mesma zona:

| Tipo  | Nome | Valor                  | Proxy    |
|-------|------|------------------------|----------|
| A     | @    | `76.76.21.21`          | DNS-only |
| CNAME | www  | `cname.vercel-dns.com` | DNS-only |

`DNS-only` (nuvem cinza) é obrigatório — proxy laranja do Cloudflare conflita com TLS auto-managed do Vercel.

## Passo 3 — Aguardar e validar

Após propagar (1-30 min normalmente), rodar:

```bash
vercel domains inspect maranata.app
```

Quando ambos virarem `verified`, o site responde em https://maranata.app e https://www.maranata.app.

## Passo 4 — Atualizar NEXT_PUBLIC_APP_URL

Quando estiver online:

```bash
cd ~/dev/maranata-app
printf "https://maranata.app" | vercel env add NEXT_PUBLIC_APP_URL production --force
vercel deploy --prod --yes
```

Isso faz os links de SSO callback (`/api/auth/callback?next=...`) e os shareables de campanha (`/doar/<slug>`) usarem o domínio raiz em vez do `*.vercel.app`.
