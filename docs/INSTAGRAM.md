# Visao - Support Instagram

> ⚠️ **STATUT : DÉSACTIVÉ PAR DÉFAUT**
>
> Le support Instagram nécessite un service tiers payant (Apify).
> Cette fonctionnalité est préparée mais désactivée jusqu'à activation manuelle.

---

## 🔒 Pourquoi Instagram est compliqué ?

Meta a volontairement fermé l'accès aux données Instagram :

| Méthode | Statut | Problème |
|---------|--------|----------|
| API officielle | ❌ | Seulement tes propres comptes business |
| Scraping direct | ❌ | Ban rapide (détection aggressive) |
| RSS natif | ❌ | N'existe pas |
| Bibliogram | ❌ | Projet mort |

**Seule solution viable : Services de scraping managés (Apify, Bright Data)**

---

## 💰 Coût estimé

| Usage | Fréquence | Coût Apify/mois |
|-------|-----------|-----------------|
| 5 profils | Toutes les 4h | ~15-25$ |
| 10 profils | Toutes les 4h | ~30-50$ |
| 10 profils | Toutes les 2h | ~60-100$ |
| 20 profils | Toutes les 2h | ~120-200$ |

**Recommandation : Commencer avec 10 profils, check toutes les 4h (~50$/mois)**

---

## 🛠️ Configuration

### 1. Créer un compte Apify

1. Aller sur [apify.com](https://apify.com)
2. Créer un compte (5$ de crédit gratuit)
3. Récupérer ton API token dans Settings > Integrations

### 2. Variables d'environnement

```env
# Activer Instagram
INSTAGRAM_ENABLED=true

# Apify
APIFY_TOKEN=your-apify-token

# Optionnel : intervalle de check (défaut: 4h)
INSTAGRAM_CHECK_INTERVAL=14400
```

### 3. Activer dans le code

```typescript
// workers/src/config.ts
export const config = {
  instagram: {
    enabled: process.env.INSTAGRAM_ENABLED === 'true',
    checkInterval: parseInt(process.env.INSTAGRAM_CHECK_INTERVAL || '14400'),
  }
};
```

---

## 📦 Intégration Apify

### Installation

```bash
pnpm add apify-client
```

### Code du worker

```typescript
// workers/src/jobs/instagram.job.ts
import { ApifyClient } from 'apify-client';
import { prisma } from '../lib/supabase';
import { redis } from '../lib/redis';

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN!,
});

interface InstagramPost {
  id: string;
  shortCode: string;
  caption: string;
  timestamp: string;
  url: string;
  displayUrl: string;
  videoUrl?: string;
  ownerUsername: string;
  ownerFullName: string;
  ownerProfilePicUrl: string;
  likesCount: number;
  commentsCount: number;
}

export async function scrapeInstagramProfile(username: string): Promise<InstagramPost[]> {
  // Vérifier le cache (éviter de scraper trop souvent)
  const cacheKey = `instagram:${username}:lastScrape`;
  const lastScrape = await redis.get(cacheKey);

  if (lastScrape) {
    const elapsed = Date.now() - parseInt(lastScrape);
    const minInterval = 60 * 60 * 1000; // 1 heure minimum entre les scrapes

    if (elapsed < minInterval) {
      console.log(`Skipping ${username}, scraped ${elapsed / 1000}s ago`);
      return [];
    }
  }

  try {
    // Lancer le scraper Instagram d'Apify
    const run = await client.actor("apify/instagram-profile-scraper").call({
      usernames: [username],
      resultsLimit: 12, // 12 derniers posts
    });

    // Récupérer les résultats
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    // Mettre à jour le cache
    await redis.set(cacheKey, Date.now().toString());

    return items as InstagramPost[];
  } catch (error) {
    console.error(`Error scraping Instagram @${username}:`, error);
    throw error;
  }
}

export async function processInstagramSource(sourceId: string) {
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    include: { organization: true },
  });

  if (!source || source.type !== 'INSTAGRAM') {
    return;
  }

  // Extraire le username du URL (ex: @username ou instagram.com/username)
  const username = source.url.replace('@', '').replace('https://instagram.com/', '');

  const posts = await scrapeInstagramProfile(username);

  for (const post of posts) {
    // Vérifier si le post existe déjà
    const existing = await prisma.alert.findUnique({
      where: {
        sourceId_externalId: {
          sourceId: source.id,
          externalId: post.id,
        },
      },
    });

    if (existing) continue;

    // Créer l'alerte
    const alert = await prisma.alert.create({
      data: {
        sourceId: source.id,
        externalId: post.id,
        content: post.caption || '',
        authorName: post.ownerFullName,
        authorHandle: `@${post.ownerUsername}`,
        authorAvatar: post.ownerProfilePicUrl,
        permalink: post.url,
        postedAt: new Date(post.timestamp),
        media: {
          create: [
            {
              type: post.videoUrl ? 'VIDEO' : 'IMAGE',
              originalUrl: post.videoUrl || post.displayUrl,
            },
          ],
        },
      },
    });

    // TODO: Envoyer notification push
    console.log(`New Instagram alert: ${alert.id}`);
  }

  // Mettre à jour lastCheckedAt
  await prisma.source.update({
    where: { id: sourceId },
    data: { lastCheckedAt: new Date() },
  });
}
```

### Scheduler

```typescript
// workers/src/schedulers/instagram.scheduler.ts
import { Queue } from 'bullmq';
import { prisma } from '../lib/supabase';
import { config } from '../config';

const instagramQueue = new Queue('instagram-scraping', {
  connection: redisConnection,
});

export async function scheduleInstagramJobs() {
  if (!config.instagram.enabled) {
    console.log('Instagram scraping is disabled');
    return;
  }

  // Récupérer toutes les sources Instagram actives
  const sources = await prisma.source.findMany({
    where: {
      type: 'INSTAGRAM',
      isActive: true,
    },
  });

  for (const source of sources) {
    await instagramQueue.add(
      `scrape-${source.id}`,
      { sourceId: source.id },
      {
        repeat: {
          every: config.instagram.checkInterval * 1000,
        },
        jobId: `instagram-${source.id}`,
      }
    );
  }

  console.log(`Scheduled ${sources.length} Instagram sources`);
}
```

---

## ⚠️ Limitations

| Limitation | Impact |
|------------|--------|
| **Pas de temps réel** | Délai de 2-4h entre le post et la détection |
| **Coût variable** | Dépend du nombre de profils et de la fréquence |
| **Rate limits Apify** | Max ~1000 scrapes/jour sur le plan Starter |
| **Stories non supportées** | Apify ne scrape que les posts du feed |
| **Zone grise légale** | Scraping de données publiques (risque faible) |

---

## 🔄 Alternatives à Apify

| Service | Prix | Avantages | Inconvénients |
|---------|------|-----------|---------------|
| **Bright Data** | ~100-200$/mois | Très fiable, gros volume | Plus cher |
| **ScrapingBee** | ~50$/mois | Simple | Moins spécialisé Instagram |
| **Rapid API** | ~30-50$/mois | Pas cher | Qualité variable |
| **RSS.app** | ~10$/mois | Très pas cher | Délai 6h+, peut casser |

---

## 📋 Checklist pour activer Instagram

- [ ] Créer compte Apify
- [ ] Ajouter `APIFY_TOKEN` dans `.env`
- [ ] Mettre `INSTAGRAM_ENABLED=true`
- [ ] Déployer les workers
- [ ] Ajouter des sources Instagram dans l'app
- [ ] Monitorer la consommation Apify
