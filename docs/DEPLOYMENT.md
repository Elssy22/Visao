# Visao - Guide de déploiement

## 🚀 Options de déploiement

### Option 1: Railway (Recommandé pour débuter)

Railway permet de déployer facilement le backend, PostgreSQL et Redis en un seul endroit.

**Coût estimé**: ~15-30$/mois

#### Étapes

1. Créer un compte sur [Railway](https://railway.app/)

2. Créer un nouveau projet

3. Ajouter les services:
   - PostgreSQL (depuis le marketplace)
   - Redis (depuis le marketplace)
   - Web Service (depuis GitHub)

4. Configurer les variables d'environnement

5. Déployer

### Option 2: Render

**Coût estimé**: ~20-40$/mois

#### Services nécessaires

| Service | Type Render | Coût |
|---------|-------------|------|
| API Backend | Web Service | ~7$/mois |
| PostgreSQL | Managed DB | ~7$/mois |
| Redis | Managed Redis | ~10$/mois |
| Worker | Background Worker | ~7$/mois |

### Option 3: VPS (DigitalOcean, Hetzner)

**Coût estimé**: ~10-20$/mois (tout compris)

Plus de contrôle mais plus de maintenance.

---

## 🌐 Déploiement Frontend (Vercel)

Le frontend Next.js se déploie sur Vercel (gratuit pour les projets personnels).

### Étapes

1. Connecter le repo GitHub à Vercel

2. Configurer:
   - **Root Directory**: `apps/web`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`

3. Variables d'environnement:
   ```
   NEXT_PUBLIC_API_URL=https://api.visao.app
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
   ```

4. Déployer

---

## 🔧 Déploiement Backend (Railway)

### 1. Préparer le Dockerfile

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/ ./packages/
RUN pnpm install --frozen-lockfile

COPY apps/api/ ./apps/api/
RUN pnpm --filter api prisma generate
RUN pnpm --filter api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/apps/api/node_modules ./node_modules

EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### 2. Variables d'environnement Railway

```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<générer une clé sécurisée>
TWITTER_BEARER_TOKEN=<ton token>
R2_ACCOUNT_ID=<ton account id>
R2_ACCESS_KEY_ID=<ta clé>
R2_SECRET_ACCESS_KEY=<ton secret>
R2_BUCKET_NAME=visao-media
R2_PUBLIC_URL=https://media.visao.app
VAPID_PUBLIC_KEY=<ta clé publique>
VAPID_PRIVATE_KEY=<ta clé privée>
VAPID_SUBJECT=mailto:contact@visao.app
```

### 3. Déployer

```bash
# Railway CLI
railway login
railway link
railway up
```

---

## 💾 Configuration Cloudflare R2

### 1. Créer un bucket

1. Aller sur [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. R2 > Create Bucket
3. Nom: `visao-media`

### 2. Créer des API tokens

1. R2 > Manage R2 API Tokens
2. Create API Token
3. Permissions: Object Read & Write
4. Copier les clés

### 3. Configurer le domaine public (optionnel)

1. R2 > Bucket > Settings
2. Public Access > Connect Domain
3. Ajouter `media.visao.app`

---

## 🔔 Configuration Web Push

### Générer les clés VAPID

```bash
npx web-push generate-vapid-keys
```

Output:
```
Public Key: BLx...
Private Key: Kw...
```

Ajouter ces clés dans les variables d'environnement.

---

## 🐦 Configuration Twitter API

### 1. Créer une app Twitter Developer

1. Aller sur [developer.twitter.com](https://developer.twitter.com/)
2. Créer un projet et une app
3. Souscrire au plan Basic (100$/mois)

### 2. Configurer OAuth 2.0

Pour publier des tweets, il faut OAuth 2.0 User Context:

1. App Settings > User authentication settings
2. Activer OAuth 2.0
3. Type: Web App
4. Callback URL: `https://api.visao.app/api/auth/twitter/callback`
5. Permissions: Read and Write

### 3. Récupérer les tokens

- API Key
- API Secret
- Bearer Token
- Access Token (pour ton compte)
- Access Token Secret

---

## 📊 Monitoring

### Logs

- **Railway**: Dashboard > Deployments > Logs
- **Vercel**: Dashboard > Deployments > Functions

### Métriques recommandées

1. **Uptime**: UptimeRobot (gratuit)
2. **Errors**: Sentry (gratuit jusqu'à 5K events/mois)
3. **Analytics**: Vercel Analytics ou Plausible

### Configuration Sentry (optionnel)

```bash
# apps/api
pnpm add @sentry/node

# apps/web
pnpm add @sentry/nextjs
```

---

## 🔄 CI/CD avec GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: api

  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Vercel déploie automatiquement depuis GitHub
```

---

## 📝 Checklist pré-déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL créée
- [ ] Redis configuré
- [ ] Cloudflare R2 bucket créé
- [ ] Twitter API configurée (si publication)
- [ ] Clés VAPID générées
- [ ] Domaine configuré (optionnel)
- [ ] SSL activé (automatique sur Railway/Vercel)
- [ ] Migrations Prisma appliquées
