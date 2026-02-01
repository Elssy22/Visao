# Visao - Modèle de données

## 📊 Vue d'ensemble

Visao utilise une architecture **multi-tenant** où chaque organisation a ses propres données isolées.

```
┌─────────────────────────────────────────────────────────────────┐
│                        MULTI-TENANT                             │
│                                                                 │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │   Org A     │   │   Org B     │   │   Org C     │          │
│   │   "Visao"   │   │  "AgenceX"  │   │  "MarqueY"  │          │
│   │             │   │             │   │             │          │
│   │ └─ Users    │   │ └─ Users    │   │ └─ Users    │          │
│   │ └─ Sources  │   │ └─ Sources  │   │ └─ Sources  │          │
│   │ └─ Alerts   │   │ └─ Alerts   │   │ └─ Alerts   │          │
│   └─────────────┘   └─────────────┘   └─────────────┘          │
│          │                 │                 │                  │
│          └─────────────────┼─────────────────┘                  │
│                            │                                    │
│                   ┌────────▼────────┐                           │
│                   │   PostgreSQL    │                           │
│                   │   (une seule    │                           │
│                   │   base de       │                           │
│                   │   données)      │                           │
│                   └─────────────────┘                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗃️ Diagramme des relations

```
┌─────────────────┐
│  Organization   │
│                 │
│ • name          │
│ • slug          │
│ • plan          │
│ • customDomain  │
│ • logo          │
│ • colors        │
└────────┬────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌─────────────────┐
│      User       │──────>│   Invitation    │
│                 │       │                 │
│ • email         │       │ • email         │
│ • password      │       │ • token         │
│ • role          │       │ • expiresAt     │
│ • isActive      │       └─────────────────┘
└────────┬────────┘
         │
    ┌────┴────┬─────────────┬──────────────┐
    │         │             │              │
    ▼         ▼             ▼              ▼
┌───────┐ ┌───────┐ ┌────────────┐ ┌───────────────┐
│ Alert │ │ Saved │ │Publication │ │PushSubscription│
│       │ │Content│ │            │ │               │
└───┬───┘ └───────┘ └────────────┘ └───────────────┘
    │
    ▼
┌─────────────────┐
│     Media       │
│                 │
│ • type          │
│ • originalUrl   │
│ • storedUrl     │
└─────────────────┘


┌─────────────────┐       ┌─────────────────┐
│     Source      │──────>│ SourceSuggestion│
│                 │       │                 │
│ • name          │       │ • name          │
│ • type          │       │ • url           │
│ • url           │       │ • reason        │
│ • isActive      │       │ • status        │
└────────┬────────┘       └─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│     Alert       │
└─────────────────┘
```

---

## 📋 Tables détaillées

### Organization (Organisation / Entreprise)

| Champ | Type | Description |
|-------|------|-------------|
| id | String | Identifiant unique |
| name | String | Nom affiché ("Visao", "Agence X") |
| slug | String | URL-friendly ("visao", "agence-x") |
| customDomain | String? | Domaine personnalisé ("veille.agencex.com") |
| logo | String? | URL du logo |
| primaryColor | String? | Couleur principale (#3b82f6) |
| secondaryColor | String? | Couleur secondaire |
| plan | Plan | FREE, STARTER, PRO, ENTERPRISE |
| maxUsers | Int | Limite d'utilisateurs |
| maxSources | Int | Limite de sources |

### Plans et limites

| Plan | Prix | Users max | Sources max | Notifications |
|------|------|-----------|-------------|---------------|
| FREE | 0€ | 1 | 3 | ❌ |
| STARTER | 29€/mois | 3 | 10 | ✅ |
| PRO | 79€/mois | 10 | 50 | ✅ |
| ENTERPRISE | Sur devis | Illimité | Illimité | ✅ |

---

### User (Utilisateur)

| Champ | Type | Description |
|-------|------|-------------|
| id | String | Identifiant unique |
| email | String | Email (unique) |
| password | String | Hash du mot de passe |
| name | String | Nom affiché |
| role | UserRole | OWNER, ADMIN, EDITOR, VIEWER |
| organizationId | String | Organisation d'appartenance |
| isActive | Boolean | Compte actif/désactivé |
| lastLoginAt | DateTime? | Dernière connexion |

### Rôles et permissions

| Permission | OWNER | ADMIN | EDITOR | VIEWER |
|------------|-------|-------|--------|--------|
| Voir le feed | ✅ | ✅ | ✅ | ✅ |
| Sauvegarder des alertes | ✅ | ✅ | ✅ | ❌ |
| Publier sur X | ✅ | ✅ | ✅ | ❌ |
| Ajouter des sources | ✅ | ✅ | ✅ | ❌ |
| Proposer des sources | ✅ | ✅ | ✅ | ✅ |
| Approuver des sources | ✅ | ✅ | ❌ | ❌ |
| Gérer les utilisateurs | ✅ | ✅ | ❌ | ❌ |
| Modifier l'organisation | ✅ | ✅ | ❌ | ❌ |
| Supprimer l'organisation | ✅ | ❌ | ❌ | ❌ |

---

### Source (Source à surveiller)

| Champ | Type | Description |
|-------|------|-------------|
| id | String | Identifiant unique |
| name | String | Nom affiché ("Sneaker News") |
| type | SourceType | TWITTER, INSTAGRAM, TIKTOK, RSS, WEBSITE |
| url | String | URL ou @username |
| identifier | String? | ID sur la plateforme |
| isActive | Boolean | Surveillance active |
| checkInterval | Int | Intervalle en secondes (défaut: 60) |
| organizationId | String | Organisation propriétaire |
| metadata | Json? | Avatar, bio, stats... |

---

### SourceSuggestion (Proposition de source)

| Champ | Type | Description |
|-------|------|-------------|
| id | String | Identifiant unique |
| userId | String | Qui propose |
| organizationId | String | Pour quelle organisation |
| name | String | Nom proposé |
| type | SourceType | Type de source |
| url | String | URL proposée |
| reason | String? | Pourquoi cette source ? |
| status | SuggestionStatus | PENDING, APPROVED, REJECTED |
| reviewedById | String? | Qui a validé/refusé |
| reviewNote | String? | Note de review |

```
FLUX DE SOUMISSION
──────────────────

User propose          Admin review          Résultat
     │                     │                    │
     ▼                     ▼                    ▼
┌─────────┐          ┌─────────┐          ┌─────────┐
│ PENDING │  ──────► │ REVIEW  │  ──────► │APPROVED │ → Source créée
└─────────┘          └─────────┘          └─────────┘
                           │
                           │
                           ▼
                     ┌─────────┐
                     │REJECTED │ → Notification au user
                     └─────────┘
```

---

### Alert (Alerte / Contenu détecté)

| Champ | Type | Description |
|-------|------|-------------|
| id | String | Identifiant unique |
| sourceId | String | Source d'origine |
| externalId | String | ID sur la plateforme (évite doublons) |
| content | String | Texte du post |
| authorName | String | Nom de l'auteur |
| authorHandle | String | @handle |
| permalink | String | Lien vers l'original |
| status | AlertStatus | NEW, VIEWED, SAVED, PUBLISHED, DISMISSED |
| isRead | Boolean | Lu ou non |
| isPinned | Boolean | Épinglé en haut |
| assignedToId | String? | Assigné à un membre |
| postedAt | DateTime | Date du post original |
| detectedAt | DateTime | Date de détection |

---

### Media (Média attaché)

| Champ | Type | Description |
|-------|------|-------------|
| id | String | Identifiant unique |
| alertId | String | Alerte parente |
| type | MediaType | IMAGE, VIDEO, GIF |
| originalUrl | String | URL source |
| storedUrl | String? | URL sur R2 (après téléchargement) |
| thumbnail | String? | Miniature |
| width | Int? | Largeur |
| height | Int? | Hauteur |
| duration | Int? | Durée vidéo (secondes) |
| size | Int? | Taille (bytes) |

---

### Publication (Publication sur X)

| Champ | Type | Description |
|-------|------|-------------|
| id | String | Identifiant unique |
| alertId | String? | Alerte source (optionnel) |
| userId | String | Qui publie |
| platform | PublishPlatform | TWITTER |
| content | String | Texte du tweet |
| mediaUrls | String[] | Médias à joindre |
| status | PublishStatus | PENDING, SCHEDULED, PUBLISHED, FAILED |
| externalId | String? | ID du tweet créé |
| externalUrl | String? | URL du tweet |
| error | String? | Message d'erreur |
| scheduledAt | DateTime? | Publication programmée |
| publishedAt | DateTime? | Date effective |

---

### AuditLog (Journal d'audit)

| Champ | Type | Description |
|-------|------|-------------|
| id | String | Identifiant unique |
| userId | String? | Qui a fait l'action |
| organizationId | String? | Dans quelle org |
| action | String | "source.created", "alert.published"... |
| entityType | String? | "Source", "Alert", "User" |
| entityId | String? | ID de l'entité |
| metadata | Json? | Détails supplémentaires |
| ipAddress | String? | IP du client |
| createdAt | DateTime | Quand |

**Actions trackées** :
- `user.login`, `user.logout`
- `source.created`, `source.updated`, `source.deleted`
- `alert.saved`, `alert.published`, `alert.dismissed`
- `suggestion.created`, `suggestion.approved`, `suggestion.rejected`
- `organization.updated`, `user.invited`, `user.removed`

---

## 🔧 Indexes

| Table | Index | Utilisation |
|-------|-------|-------------|
| Organization | `[slug]` | Lookup par slug |
| Organization | `[customDomain]` | Lookup par domaine |
| User | `[organizationId]` | Users d'une org |
| User | `[email]` | Login |
| Source | `[organizationId]` | Sources d'une org |
| Source | `[type, isActive]` | Sources actives par type |
| Alert | `[sourceId]` | Alertes d'une source |
| Alert | `[status, detectedAt]` | Feed chronologique |
| SourceSuggestion | `[organizationId, status]` | Suggestions en attente |
| AuditLog | `[organizationId, createdAt]` | Historique par org |

---

## 💾 Commandes Prisma

```bash
# Générer le client
pnpm --filter api prisma generate

# Créer une migration
pnpm --filter api prisma migrate dev --name nom_migration

# Appliquer les migrations (prod)
pnpm --filter api prisma migrate deploy

# Ouvrir Prisma Studio (GUI)
pnpm --filter api prisma studio

# Reset la BDD (dev seulement !)
pnpm --filter api prisma migrate reset
```
