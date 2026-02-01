# Visao - Modèle de données

## 🗃️ Schema Prisma complet

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== UTILISATEURS ====================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String
  role          UserRole  @default(EDITOR)
  avatar        String?

  // Relations
  sources           Source[]
  alerts            Alert[]
  savedContents     SavedContent[]
  publications      Publication[]
  pushSubscriptions PushSubscription[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum UserRole {
  ADMIN     // Peut tout faire + gérer les utilisateurs
  EDITOR    // Peut ajouter sources, publier, sauvegarder
  VIEWER    // Peut uniquement consulter le feed
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String   @unique
  keys      Json     // { p256dh, auth }
  userAgent String?

  createdAt DateTime @default(now())
}

// ==================== SOURCES ====================

model Source {
  id            String      @id @default(cuid())
  name          String
  type          SourceType
  url           String      // URL ou identifiant (@username, etc.)
  identifier    String?     // ID spécifique à la plateforme
  isActive      Boolean     @default(true)
  checkInterval Int         @default(60) // Intervalle en secondes
  lastCheckedAt DateTime?

  // Métadonnées de la source
  metadata      Json?       // Avatar, bio, followers, etc.

  // Relations
  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  alerts        Alert[]

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  @@unique([type, identifier])
  @@index([type, isActive])
}

enum SourceType {
  TWITTER
  INSTAGRAM
  TIKTOK
  RSS
  WEBSITE
}

// ==================== ALERTES ====================

model Alert {
  id           String      @id @default(cuid())
  sourceId     String
  source       Source      @relation(fields: [sourceId], references: [id], onDelete: Cascade)

  // Contenu original
  externalId   String      // ID du post sur la plateforme
  content      String      @db.Text
  authorName   String
  authorHandle String
  authorAvatar String?
  permalink    String      // Lien vers le post original

  // Médias
  media        Media[]

  // Statut
  status       AlertStatus @default(NEW)
  isRead       Boolean     @default(false)
  isPinned     Boolean     @default(false)

  // Relations
  userId       String
  user         User        @relation(fields: [userId], references: [id])
  savedContent SavedContent?
  publications Publication[]

  detectedAt   DateTime    @default(now())
  postedAt     DateTime    // Date du post original

  @@unique([sourceId, externalId])
  @@index([status, detectedAt])
  @@index([userId, isRead])
}

enum AlertStatus {
  NEW        // Vient d'arriver
  VIEWED     // Vu mais pas traité
  SAVED      // Sauvegardé pour plus tard
  PUBLISHED  // Publié sur X
  DISMISSED  // Ignoré
}

model Media {
  id          String    @id @default(cuid())
  alertId     String
  alert       Alert     @relation(fields: [alertId], references: [id], onDelete: Cascade)

  type        MediaType
  originalUrl String
  storedUrl   String?   // URL après stockage local (R2)
  thumbnail   String?

  // Métadonnées
  width       Int?
  height      Int?
  duration    Int?      // Pour les vidéos (en secondes)
  size        Int?      // Taille en bytes

  createdAt   DateTime  @default(now())
}

enum MediaType {
  IMAGE
  VIDEO
  GIF
}

// ==================== CONTENUS SAUVEGARDÉS ====================

model SavedContent {
  id        String   @id @default(cuid())
  alertId   String   @unique
  alert     Alert    @relation(fields: [alertId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])

  notes     String?  @db.Text
  tags      String[] // Tags personnalisés

  createdAt DateTime @default(now())

  @@index([userId, createdAt])
}

// ==================== PUBLICATIONS ====================

model Publication {
  id          String            @id @default(cuid())
  alertId     String?
  alert       Alert?            @relation(fields: [alertId], references: [id])
  userId      String
  user        User              @relation(fields: [userId], references: [id])

  platform    PublishPlatform
  content     String            @db.Text
  mediaUrls   String[]

  // Résultat
  status      PublishStatus     @default(PENDING)
  externalId  String?           // ID du tweet publié
  externalUrl String?           // URL du tweet
  error       String?

  scheduledAt DateTime?
  publishedAt DateTime?
  createdAt   DateTime          @default(now())

  @@index([userId, status])
}

enum PublishPlatform {
  TWITTER
}

enum PublishStatus {
  PENDING    // En attente
  SCHEDULED  // Programmé
  PUBLISHED  // Publié avec succès
  FAILED     // Échec
}

// ==================== VEILLE CONCURRENTIELLE ====================

model Competitor {
  id        String   @id @default(cuid())
  name      String
  handle    String   // @username sur X
  url       String?  // Site web
  userId    String   // Créé par

  createdAt DateTime @default(now())

  @@index([userId])
}

// ==================== CONFIGURATION ====================

model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  updatedAt DateTime @updatedAt
}
```

---

## 📊 Diagramme des relations

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │──────<│   Source    │──────<│    Alert    │
│             │       │             │       │             │
│ • email     │       │ • name      │       │ • content   │
│ • password  │       │ • type      │       │ • status    │
│ • name      │       │ • url       │       │ • permalink │
│ • role      │       │ • isActive  │       │ • postedAt  │
└─────────────┘       └─────────────┘       └──────┬──────┘
      │                                            │
      │                                            │
      ▼                                            ▼
┌─────────────┐                            ┌─────────────┐
│ PushSubscr. │                            │    Media    │
│             │                            │             │
│ • endpoint  │                            │ • type      │
│ • keys      │                            │ • url       │
└─────────────┘                            │ • thumbnail │
      │                                    └─────────────┘
      │
      ▼
┌─────────────┐       ┌─────────────┐
│SavedContent │       │ Publication │
│             │       │             │
│ • notes     │       │ • content   │
│ • tags      │       │ • status    │
└─────────────┘       │ • platform  │
                      └─────────────┘
```

---

## 🔧 Indexes recommandés

Les indexes sont définis dans le schema pour optimiser les requêtes fréquentes :

| Table | Index | Utilisation |
|-------|-------|-------------|
| Source | `[type, isActive]` | Filtrer sources actives par type |
| Alert | `[status, detectedAt]` | Feed chronologique par statut |
| Alert | `[userId, isRead]` | Alertes non lues d'un user |
| Alert | `[sourceId, externalId]` | Éviter les doublons |
| SavedContent | `[userId, createdAt]` | Liste sauvegardés d'un user |
| Publication | `[userId, status]` | Historique publications |

---

## 💾 Migrations

### Créer une migration

```bash
cd apps/api
pnpm prisma migrate dev --name nom_de_la_migration
```

### Appliquer en production

```bash
pnpm prisma migrate deploy
```

### Générer le client

```bash
pnpm prisma generate
```
