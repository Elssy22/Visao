# Visao - Architecture Technique

## 📋 Vue d'ensemble

Outil de veille média en temps réel permettant à une équipe de :
- Surveiller des sources sur X/Twitter, Instagram, TikTok et sites web
- Recevoir des alertes instantanées lors de nouveaux contenus
- Sauvegarder les médias (images/vidéos) et métadonnées
- Publier rapidement sur X/Twitter
- Vérifier si les concurrents ont déjà traité un sujet

### Type d'application
**Progressive Web App (PWA)** - Application web installable sur tous les appareils avec support des notifications push.

---

## 🏗️ Stack technologique

```
FRONTEND (PWA)
├── Framework: Next.js 14 (App Router)
├── PWA: @ducanh2912/next-pwa
├── UI: Tailwind CSS + shadcn/ui
├── State: Zustand
├── Data fetching: TanStack Query (React Query)
├── Real-time: Socket.io-client
└── Notifications: Web Push API

BACKEND
├── Runtime: Node.js 20+
├── Framework: Express.js
├── Real-time: Socket.io
├── Job Queue: BullMQ
├── ORM: Prisma
└── Validation: Zod

BASE DE DONNÉES
├── Principal: PostgreSQL
├── Cache/Queue: Redis
└── Stockage médias: Cloudflare R2

SERVICES EXTERNES
├── Twitter/X API v2
├── Web Scraping: Puppeteer + Browserless
└── Push Notifications: web-push
```

---

## 📐 Schéma d'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ PWA iOS  │  │PWA Android│  │PWA Desktop│  │ Browser │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
                    ┌────────▼────────┐
                    │   NEXT.JS PWA   │
                    │   (Frontend)    │
                    │   Port: 3000    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   API BACKEND   │
                    │   (Express)     │
                    │   Port: 4000    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│   WORKERS     │   │   DATABASE    │   │   STORAGE     │
│   (BullMQ)    │   │  PostgreSQL   │   │  Cloudflare   │
│               │   │    Redis      │   │      R2       │
│ • Twitter     │   │               │   │               │
│ • Scraper     │   │               │   │  • Images     │
│ • RSS         │   │               │   │  • Videos     │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 📁 Structure du projet

```
visao/
├── apps/
│   ├── web/                      # PWA Next.js
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── page.tsx           # Dashboard principal
│   │   │   │   ├── sources/
│   │   │   │   │   └── page.tsx       # Gestion des sources
│   │   │   │   ├── alerts/
│   │   │   │   │   └── page.tsx       # Historique alertes
│   │   │   │   ├── saved/
│   │   │   │   │   └── page.tsx       # Contenus sauvegardés
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx       # Paramètres
│   │   │   ├── api/
│   │   │   │   └── [...proxy]/        # Proxy vers backend
│   │   │   ├── layout.tsx
│   │   │   ├── manifest.ts            # PWA Manifest
│   │   │   └── sw.ts                  # Service Worker
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── dashboard/
│   │   │   │   ├── feed-card.tsx
│   │   │   │   ├── alert-item.tsx
│   │   │   │   └── quick-publish.tsx
│   │   │   ├── sources/
│   │   │   │   ├── source-form.tsx
│   │   │   │   └── source-list.tsx
│   │   │   └── layout/
│   │   │       ├── header.tsx
│   │   │       ├── sidebar.tsx
│   │   │       └── mobile-nav.tsx
│   │   ├── hooks/
│   │   │   ├── use-notifications.ts
│   │   │   ├── use-sources.ts
│   │   │   └── use-realtime.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── socket.ts
│   │   │   └── utils.ts
│   │   ├── stores/
│   │   │   ├── alerts-store.ts
│   │   │   └── user-store.ts
│   │   ├── public/
│   │   │   ├── icons/
│   │   │   └── images/
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   └── api/                      # Backend Express
│       ├── src/
│       │   ├── index.ts               # Entry point
│       │   ├── config/
│       │   │   ├── database.ts
│       │   │   ├── redis.ts
│       │   │   └── env.ts
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── sources.routes.ts
│       │   │   ├── alerts.routes.ts
│       │   │   ├── media.routes.ts
│       │   │   └── publish.routes.ts
│       │   ├── controllers/
│       │   │   ├── auth.controller.ts
│       │   │   ├── sources.controller.ts
│       │   │   ├── alerts.controller.ts
│       │   │   └── publish.controller.ts
│       │   ├── services/
│       │   │   ├── twitter.service.ts
│       │   │   ├── scraper.service.ts
│       │   │   ├── rss.service.ts
│       │   │   ├── storage.service.ts
│       │   │   └── notification.service.ts
│       │   ├── workers/
│       │   │   ├── twitter.worker.ts
│       │   │   ├── scraper.worker.ts
│       │   │   ├── rss.worker.ts
│       │   │   └── media.worker.ts
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts
│       │   │   ├── rate-limit.middleware.ts
│       │   │   └── error.middleware.ts
│       │   ├── utils/
│       │   │   ├── logger.ts
│       │   │   └── helpers.ts
│       │   └── types/
│       │       └── index.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── package.json
│
├── packages/
│   └── shared/                   # Code partagé
│       ├── types/
│       │   └── index.ts
│       ├── validators/
│       │   └── index.ts
│       └── constants/
│           └── index.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 🔔 Configuration PWA

### Manifest

```typescript
// apps/web/app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Visao - Veille Mode & Sneakers',
    short_name: 'Visao',
    description: 'Outil de veille mode et sneakers en temps réel',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#3b82f6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
}
```

### Service Worker (notifications)

```javascript
// apps/web/public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    tag: data.tag || 'default',
    renotify: true,
    requireInteraction: data.priority === 'high',
    data: {
      url: data.url,
      alertId: data.alertId,
    },
    actions: [
      { action: 'view', title: 'Voir' },
      { action: 'publish', title: 'Publier' },
      { action: 'dismiss', title: 'Ignorer' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const { action } = event;
  const { url, alertId } = event.notification.data;

  if (action === 'view') {
    event.waitUntil(clients.openWindow(url));
  } else if (action === 'publish') {
    event.waitUntil(clients.openWindow(`/publish/${alertId}`));
  }
});
```

---

## 🔌 WebSocket Events

### Client → Server
```
subscribe:alerts          # S'abonner aux alertes temps réel
unsubscribe:alerts        # Se désabonner
```

### Server → Client
```
alert:new                 # Nouvelle alerte détectée
alert:updated             # Alerte mise à jour
source:status             # Changement statut source
publish:result            # Résultat publication
```

---

## 📝 Notes importantes

### Limitations Instagram/TikTok
Les APIs officielles ne permettent pas de surveiller facilement des comptes publics. Options :
1. **Scraping** via Puppeteer/Browserless
2. **Services tiers** comme Apify, Bright Data
3. **RSS alternatifs** (Bibliogram, Proxigram)

### Rate Limits Twitter
- API v2 Basic (100$/mois) : 10,000 tweets/mois en lecture
- Système de cache et priorisation des sources nécessaire

### Stockage des médias
- Politique de rétention recommandée : 30-90 jours
- Compression des images avant stockage
- Les vidéos peuvent être volumineuses (prévoir l'espace)
