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
├── Real-time: Supabase Realtime
├── Auth: Supabase Auth
└── Notifications: Web Push API

BACKEND (Workers)
├── Runtime: Node.js 20+
├── Framework: Express.js (API routes customs)
├── Job Queue: BullMQ + Upstash Redis
├── ORM: Prisma (avec Supabase PostgreSQL)
└── Validation: Zod

SERVICES MANAGÉS
├── Database: Supabase (PostgreSQL)
├── Auth: Supabase Auth
├── Storage: Supabase Storage
├── Real-time: Supabase Realtime
├── Cache/Queue: Upstash Redis
└── Workers: Railway

SERVICES EXTERNES
├── Twitter/X API v2
├── Web Scraping: Puppeteer (si besoin)
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
                    │    (Vercel)     │
                    │                 │
                    │ • Pages/Routes  │
                    │ • API Routes    │
                    │ • Supabase SDK  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   SUPABASE    │   │    UPSTASH    │   │   RAILWAY     │
│               │   │     REDIS     │   │   WORKERS     │
│ • PostgreSQL  │   │               │   │               │
│ • Auth        │   │ • Job Queue   │   │ • Twitter     │
│ • Storage     │   │ • Cache       │   │ • RSS         │
│ • Realtime    │   │               │   │ • Scraper     │
│               │   │               │   │               │
│   (gratuit    │   │   (gratuit    │   │   (gratuit    │
│    ou 25$)    │   │    ou 10$)    │   │    ou 10$)    │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## 💰 Coûts par environnement

### Développement (GRATUIT)

| Service | Plan | Coût | Limites |
|---------|------|------|---------|
| Supabase | Free | 0$ | 500 MB DB, pause 7j |
| Upstash Redis | Free | 0$ | 10K cmd/jour |
| Railway | Free | 0$ | 5$ crédit/mois |
| Vercel | Hobby | 0$ | Usage personnel |
| **TOTAL DEV** | | **0$** | |

### Production

| Service | Plan | Coût | Ce que tu obtiens |
|---------|------|------|-------------------|
| Supabase | Pro | 25$ | 8 GB DB, pas de pause |
| Upstash Redis | Pro | 10$ | Illimité |
| Railway | Pro | 10$ | Workers 24/7 |
| Vercel | Pro | 20$ | Usage commercial |
| Twitter API | Basic | 100$ | 10K tweets/mois |
| **TOTAL PROD** | | **~165$/mois** | |

---

## 📁 Structure du projet (simplifiée avec Supabase)

```
visao/
├── apps/
│   ├── web/                      # PWA Next.js
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── callback/     # OAuth callback Supabase
│   │   │   ├── (dashboard)/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── sources/
│   │   │   │   ├── alerts/
│   │   │   │   ├── saved/
│   │   │   │   └── settings/
│   │   │   ├── api/
│   │   │   │   ├── webhooks/     # Webhooks Supabase
│   │   │   │   └── cron/         # Cron jobs (Vercel)
│   │   │   ├── layout.tsx
│   │   │   └── manifest.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   │   ├── use-supabase.ts   # Client Supabase
│   │   │   ├── use-realtime.ts   # Supabase Realtime
│   │   │   └── use-auth.ts       # Supabase Auth
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── client.ts     # Client browser
│   │   │   │   ├── server.ts     # Client server
│   │   │   │   └── admin.ts      # Client admin
│   │   │   └── utils.ts
│   │   └── ...
│   │
│   └── workers/                  # Workers (Railway)
│       ├── src/
│       │   ├── index.ts
│       │   ├── jobs/
│       │   │   ├── twitter.job.ts
│       │   │   ├── rss.job.ts
│       │   │   └── media.job.ts
│       │   ├── services/
│       │   │   ├── twitter.service.ts
│       │   │   ├── rss.service.ts
│       │   │   └── notification.service.ts
│       │   └── lib/
│       │       ├── supabase.ts
│       │       ├── redis.ts
│       │       └── queue.ts
│       └── package.json
│
├── packages/
│   └── shared/
│       └── types/
│
├── supabase/
│   ├── migrations/               # Migrations SQL
│   └── seed.sql                  # Données de test
│
├── docker-compose.yml            # Pour dev local (optionnel)
├── package.json
└── pnpm-workspace.yaml
```

---

## 🔐 Authentification avec Supabase

### Méthodes disponibles (incluses gratuitement)

- ✅ Email + Password
- ✅ Magic Link (connexion par email)
- ✅ OAuth (Google, GitHub, Twitter, Discord...)
- ✅ 2FA / TOTP
- ✅ Password recovery

### Exemple de code

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Utilisation dans un composant
const supabase = createClient()

// Inscription
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      name: 'John Doe',
      organization_name: 'Mon Équipe'
    }
  }
})

// Connexion
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// OAuth (Google)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})

// Déconnexion
await supabase.auth.signOut()
```

---

## 📡 Realtime avec Supabase

### Écouter les nouvelles alertes

```typescript
// hooks/use-realtime.ts
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAlertsRealtime(organizationId: string, onNewAlert: (alert: Alert) => void) {
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Alert',
          filter: `source.organizationId=eq.${organizationId}`
        },
        (payload) => {
          onNewAlert(payload.new as Alert)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId, onNewAlert])
}
```

---

## 📦 Storage avec Supabase

### Upload de médias

```typescript
// Télécharger une image depuis une URL et la stocker
async function storeMedia(alertId: string, imageUrl: string) {
  const supabase = createClient()

  // Télécharger l'image
  const response = await fetch(imageUrl)
  const blob = await response.blob()

  // Upload vers Supabase Storage
  const fileName = `alerts/${alertId}/${Date.now()}.jpg`
  const { data, error } = await supabase.storage
    .from('media')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      upsert: false
    })

  if (error) throw error

  // Obtenir l'URL publique
  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}
```

---

## ⚡ Workers avec BullMQ + Upstash

### Configuration de la queue

```typescript
// workers/src/lib/queue.ts
import { Queue, Worker } from 'bullmq'
import { Redis } from '@upstash/redis'

const connection = {
  host: process.env.UPSTASH_REDIS_HOST,
  port: 6379,
  password: process.env.UPSTASH_REDIS_PASSWORD,
  tls: {}
}

// Queue pour Twitter
export const twitterQueue = new Queue('twitter-monitoring', { connection })

// Worker Twitter
export const twitterWorker = new Worker(
  'twitter-monitoring',
  async (job) => {
    const { sourceId } = job.data
    // ... logique de vérification Twitter
  },
  { connection, concurrency: 5 }
)
```

### Ajouter un job récurrent

```typescript
// Vérifier une source toutes les 60 secondes
await twitterQueue.add(
  'check-source',
  { sourceId: 'xxx' },
  {
    repeat: {
      every: 60000 // 60 secondes
    },
    jobId: `twitter-${sourceId}`
  }
)
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

## 📝 Notes importantes

### Limites Twitter API Basic (100$/mois)

| Ressource | Limite | Capacité estimée |
|-----------|--------|------------------|
| Lecture | 10 000 tweets/mois | ~50-60 comptes Twitter |
| Écriture | 1 500 tweets/mois | ~50 publications/jour |
| Historique | 7 jours | Pas de vieux tweets |

### Supabase Free vs Pro

| Fonctionnalité | Free | Pro (25$) |
|----------------|------|-----------|
| Base de données | 500 MB | 8 GB |
| Storage | 1 GB | 100 GB |
| Pause inactivité | Après 7 jours | Jamais |
| Backups | Non | Quotidiens |
| Support | Community | Email |

### Upstash Redis Free vs Pro

| Fonctionnalité | Free | Pro (10$) |
|----------------|------|-----------|
| Commandes | 10K/jour | Illimité |
| Stockage | 256 MB | 1 GB+ |
| Connexions | 100 | 1000 |
