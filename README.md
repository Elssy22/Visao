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
│   ├── web/          # PWA Next.js 14 (Vercel)
│   └── workers/      # Background jobs (Railway)
├── packages/
│   └── shared/       # Types et utilitaires partagés
└── supabase/         # Migrations SQL
```

## 🛠️ Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 14 (App Router) + TailwindCSS + shadcn/ui |
| PWA | @ducanh2912/next-pwa |
| State | Zustand + TanStack Query |
| Real-time | Supabase Realtime |
| Database | Supabase (PostgreSQL) + Prisma |
| Auth | Supabase Auth (OAuth, Magic Link, 2FA) |
| Storage | Supabase Storage |
| Queue | BullMQ + Upstash Redis |
| Workers | Railway |

## 💰 Coûts

### Développement (GRATUIT)

| Service | Plan | Coût |
|---------|------|------|
| Supabase | Free | 0$ |
| Upstash Redis | Free | 0$ |
| Railway | Free (5$ crédit) | 0$ |
| Vercel | Hobby | 0$ |
| **Total** | | **0$/mois** |

### Production

| Service | Plan | Coût |
|---------|------|------|
| Supabase | Pro | 25$ |
| Upstash Redis | Pro | 10$ |
| Railway | Pro | 10$ |
| Vercel | Pro | 20$ |
| Twitter API | Basic | 100$ |
| **Total** | | **~165$/mois** |

## 📊 Capacité avec Twitter API Basic (100$/mois)

| Ressource | Limite | Ce que ça permet |
|-----------|--------|------------------|
| Lecture | 10K tweets/mois | ~50-60 comptes Twitter |
| Écriture | 1.5K tweets/mois | ~50 publications/jour |
| RSS | Illimité | Autant que tu veux |

## 🚀 Démarrage rapide

### Prérequis

- Node.js 20+
- pnpm 8+
- Compte [Supabase](https://supabase.com) (gratuit)
- Compte [Upstash](https://upstash.com) (gratuit)

### Installation

```bash
# Cloner le repo
git clone https://github.com/Elssy22/Visao.git
cd Visao

# Installer les dépendances
pnpm install

# Copier les variables d'environnement
cp .env.example .env
# → Remplir avec tes clés Supabase et Upstash

# Appliquer les migrations
pnpm db:push

# Lancer en développement
pnpm dev
```

### Scripts disponibles

```bash
pnpm dev          # Lance le frontend
pnpm dev:workers  # Lance les workers
pnpm build        # Build production
pnpm db:push      # Push le schema vers Supabase
pnpm db:studio    # Ouvre Prisma Studio
pnpm db:generate  # Génère le client Prisma
```

## 📁 Documentation

- [Architecture complète](./docs/ARCHITECTURE.md)
- [API Endpoints](./docs/API.md)
- [Modèle de données](./docs/DATABASE.md)
- [Guide de déploiement](./docs/DEPLOYMENT.md)

## 🔐 Sécurité

- Authentification Supabase (OAuth, Magic Link, 2FA)
- Row Level Security (RLS) PostgreSQL
- Isolation des données par organisation
- Rate limiting
- Validation des données (Zod)
- Audit log des actions sensibles

## 📋 Roadmap

### Phase 1 - Foundation ✅
- [x] Architecture multi-tenant
- [x] Modèle de données complet
- [x] Documentation API
- [x] Stack Supabase + Upstash + Railway
- [ ] Setup monorepo pnpm
- [ ] Configuration Supabase
- [ ] Configuration Upstash Redis

### Phase 2 - Core Features
- [ ] CRUD Sources
- [ ] Système de soumission/approbation
- [ ] Worker Twitter
- [ ] Worker RSS
- [ ] Stockage médias (Supabase Storage)
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
