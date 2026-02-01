# Visao

**Outil de veille mode/sneakers en temps réel** - PWA multi-tenant permettant de surveiller des sources sur X/Twitter, Instagram, TikTok et sites web, avec notifications push et publication rapide.

## 🎯 Fonctionnalités

### Core
- **Feed temps réel** type Instagram avec alertes instantanées
- **Multi-sources** : X/Twitter, Instagram, TikTok, RSS, sites web
- **Notifications push** sur mobile et desktop
- **Extraction média** automatique (images, vidéos)
- **Publication rapide** sur X/Twitter
- **Veille concurrentielle** : voir si un sujet a déjà été traité

### Multi-tenant & Collaboration
- **Organisations** : chaque équipe a son espace isolé
- **Rôles** : Owner, Admin, Editor, Viewer
- **Invitations** par email
- **Soumission de sources** : les membres proposent, les admins approuvent
- **Assignation d'alertes** : répartir le travail en équipe

### White-label (Phase 2)
- **Domaine personnalisé** : veille.votredomaine.com
- **Logo et couleurs** personnalisables
- **Plans tarifaires** : Free, Starter, Pro, Enterprise

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
| Auth | JWT (Access + Refresh tokens) |

## 💰 Coûts estimés

| Service | Coût/mois |
|---------|-----------|
| VPS (Railway/Render) | ~15-25$ |
| PostgreSQL | ~0-15$ |
| Redis | ~0-10$ |
| Cloudflare R2 | ~5-20$ |
| Twitter API Basic | 100$ |
| **Total** | **~120-170$/mois** |

## 📊 Plans tarifaires (pour vos clients)

| Plan | Prix | Users | Sources | Notifications |
|------|------|-------|---------|---------------|
| Free | 0€ | 1 | 3 | ❌ |
| Starter | 29€/mois | 3 | 10 | ✅ |
| Pro | 79€/mois | 10 | 50 | ✅ |
| Enterprise | Sur devis | ∞ | ∞ | ✅ |

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Installation

```bash
# Cloner le repo
git clone https://github.com/Elssy22/Visao.git
cd Visao

# Installer les dépendances
pnpm install

# Copier les variables d'environnement
cp .env.example .env

# Démarrer les services (PostgreSQL, Redis)
docker-compose up -d

# Appliquer les migrations
pnpm db:migrate

# Lancer en développement
pnpm dev
```

### Scripts disponibles

```bash
pnpm dev          # Lance frontend + backend
pnpm dev:web      # Lance seulement le frontend
pnpm dev:api      # Lance seulement le backend
pnpm build        # Build production
pnpm db:migrate   # Applique les migrations
pnpm db:studio    # Ouvre Prisma Studio
pnpm docker:up    # Démarre PostgreSQL + Redis
pnpm docker:down  # Arrête les containers
```

## 📁 Documentation

- [Architecture complète](./docs/ARCHITECTURE.md)
- [API Endpoints](./docs/API.md)
- [Modèle de données](./docs/DATABASE.md)
- [Guide de déploiement](./docs/DEPLOYMENT.md)

## 🔐 Sécurité

- Authentification JWT avec refresh tokens
- Mots de passe hashés (bcrypt)
- Rate limiting sur toutes les routes
- Validation des données (Zod)
- CORS configuré
- Audit log des actions sensibles

## 📋 Roadmap

### Phase 1 - Foundation ✅
- [x] Architecture multi-tenant
- [x] Modèle de données complet
- [x] Documentation API
- [ ] Setup monorepo pnpm
- [ ] Configuration PostgreSQL + Prisma
- [ ] Configuration Redis
- [ ] Authentification JWT

### Phase 2 - Core Features
- [ ] CRUD Sources
- [ ] Système de soumission/approbation
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

### Phase 4 - White-label
- [ ] Domaines personnalisés
- [ ] Personnalisation logo/couleurs
- [ ] Gestion des plans/abonnements
- [ ] Stripe integration

### Phase 5 - Polish
- [ ] UI/UX responsive
- [ ] Mode sombre
- [ ] Veille concurrentielle avancée
- [ ] Tests E2E
- [ ] Documentation utilisateur

## 📄 Licence

Propriétaire - Tous droits réservés
