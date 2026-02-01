# Visao

**Outil de veille mode/sneakers en temps réel** - PWA permettant de surveiller des sources sur X/Twitter, Instagram, TikTok et sites web, avec notifications push et publication rapide.

## 🎯 Fonctionnalités

- **Feed temps réel** type Instagram avec alertes instantanées
- **Multi-sources** : X/Twitter, Instagram, TikTok, RSS, sites web
- **Notifications push** sur mobile et desktop
- **Extraction média** automatique (images, vidéos)
- **Publication rapide** sur X/Twitter
- **Veille concurrentielle** : voir si un sujet a déjà été traité
- **Multi-utilisateurs** avec rôles (Admin, Editor, Viewer)

## 🏗️ Architecture

```
visao/
├── apps/
│   ├── web/          # PWA Next.js 14
│   └── api/          # Backend Express.js
├── packages/
│   └── shared/       # Types et utilitaires partagés
└── docker-compose.yml
```

## 🛠️ Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 14 (App Router) + TailwindCSS + shadcn/ui |
| PWA | @ducanh2912/next-pwa |
| State | Zustand + TanStack Query |
| Real-time | Socket.io |
| Backend | Express.js + BullMQ |
| Database | PostgreSQL + Prisma |
| Cache/Queue | Redis |
| Storage | Cloudflare R2 |
| Auth | JWT |

## 💰 Coûts estimés

| Service | Coût/mois |
|---------|-----------|
| VPS (Railway/Render) | ~10-25$ |
| PostgreSQL | ~0-15$ |
| Redis | ~0-10$ |
| Cloudflare R2 | ~5-20$ |
| Twitter API Basic | 100$ |
| **Total** | **~115-170$/mois** |

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20+
- pnpm
- Docker & Docker Compose

### Installation

```bash
# Cloner le repo
git clone https://github.com/Elssy22/Visao.git
cd Visao

# Installer les dépendances
pnpm install

# Démarrer les services (PostgreSQL, Redis)
docker-compose up -d

# Appliquer les migrations
pnpm --filter api prisma migrate dev

# Lancer en développement
pnpm dev
```

## 📁 Documentation

- [Architecture complète](./docs/ARCHITECTURE.md)
- [API Endpoints](./docs/API.md)
- [Guide de déploiement](./docs/DEPLOYMENT.md)
- [Modèle de données](./docs/DATABASE.md)

## 📋 Roadmap

### Phase 1 - Foundation
- [ ] Setup monorepo pnpm
- [ ] Configuration PostgreSQL + Prisma
- [ ] Configuration Redis
- [ ] Authentification JWT
- [ ] Structure PWA Next.js

### Phase 2 - Core Features
- [ ] CRUD Sources
- [ ] Worker Twitter
- [ ] Worker RSS
- [ ] Stockage médias (R2)
- [ ] Dashboard + feed temps réel
- [ ] Notifications push

### Phase 3 - Publication
- [ ] Intégration Twitter API (publication)
- [ ] Interface publication rapide
- [ ] Templates de tweets
- [ ] Historique publications

### Phase 4 - Polish
- [ ] UI/UX responsive
- [ ] Mode sombre
- [ ] Veille concurrentielle
- [ ] Tests
- [ ] Documentation

## 📄 Licence

Propriétaire - Tous droits réservés
