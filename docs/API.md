# Visao - API Endpoints

## 🔐 Authentication

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| POST | `/api/auth/register` | Créer un compte + organisation | Public |
| POST | `/api/auth/login` | Connexion | Public |
| POST | `/api/auth/logout` | Déconnexion | Authentifié |
| GET | `/api/auth/me` | Profil utilisateur | Authentifié |
| PUT | `/api/auth/me` | Modifier profil | Authentifié |
| POST | `/api/auth/refresh` | Rafraîchir token | Public (avec refresh token) |
| POST | `/api/auth/forgot-password` | Demande reset password | Public |
| POST | `/api/auth/reset-password` | Reset password | Public (avec token) |

### Exemple: Inscription (crée user + organisation)

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "organizationName": "Mon Équipe"
}
```

**Réponse:**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "OWNER"
  },
  "organization": {
    "id": "clx...",
    "name": "Mon Équipe",
    "slug": "mon-equipe",
    "plan": "FREE"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### Exemple: Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

---

## 🏢 Organizations

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/api/organization` | Détails de mon organisation | Authentifié |
| PUT | `/api/organization` | Modifier mon organisation | ADMIN+ |
| GET | `/api/organization/usage` | Stats d'utilisation (users, sources) | ADMIN+ |

### Exemple: Modifier l'organisation (white-label)

```bash
PUT /api/organization
Content-Type: application/json
Authorization: Bearer eyJ...

{
  "name": "Agence X Watch",
  "logo": "https://..../logo.png",
  "primaryColor": "#ff5500",
  "customDomain": "veille.agencex.com"
}
```

---

## 👥 Users & Invitations

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/api/users` | Liste des users de l'org | ADMIN+ |
| POST | `/api/users/invite` | Inviter un utilisateur | ADMIN+ |
| DELETE | `/api/users/:id` | Supprimer un utilisateur | ADMIN+ |
| PUT | `/api/users/:id/role` | Changer le rôle | ADMIN+ |
| POST | `/api/invitations/accept` | Accepter une invitation | Public (avec token) |

### Exemple: Inviter un utilisateur

```bash
POST /api/users/invite
Content-Type: application/json
Authorization: Bearer eyJ...

{
  "email": "collegue@example.com",
  "role": "EDITOR"
}
```

**Réponse:**
```json
{
  "invitation": {
    "id": "clx...",
    "email": "collegue@example.com",
    "role": "EDITOR",
    "expiresAt": "2024-01-22T10:00:00Z"
  },
  "inviteUrl": "https://visao.app/invite/abc123..."
}
```

---

## 📡 Sources

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/api/sources` | Liste des sources | Authentifié |
| POST | `/api/sources` | Ajouter une source | EDITOR+ |
| GET | `/api/sources/:id` | Détails d'une source | Authentifié |
| PUT | `/api/sources/:id` | Modifier une source | EDITOR+ |
| DELETE | `/api/sources/:id` | Supprimer une source | ADMIN+ |
| POST | `/api/sources/:id/check` | Forcer vérification | EDITOR+ |
| GET | `/api/sources/:id/alerts` | Alertes d'une source | Authentifié |

### Exemple: Ajouter une source Twitter

```bash
POST /api/sources
Content-Type: application/json
Authorization: Bearer eyJ...

{
  "name": "Hypebeast",
  "type": "TWITTER",
  "url": "@HYPEBEAST",
  "checkInterval": 60
}
```

### Exemple: Ajouter une source RSS

```bash
POST /api/sources
Content-Type: application/json
Authorization: Bearer eyJ...

{
  "name": "Sneaker News",
  "type": "RSS",
  "url": "https://sneakernews.com/feed/",
  "checkInterval": 300
}
```

---

## 💡 Source Suggestions (Propositions)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/api/suggestions` | Liste des suggestions | ADMIN+ |
| POST | `/api/suggestions` | Proposer une source | Authentifié |
| PUT | `/api/suggestions/:id/approve` | Approuver | ADMIN+ |
| PUT | `/api/suggestions/:id/reject` | Refuser | ADMIN+ |

### Exemple: Proposer une source

```bash
POST /api/suggestions
Content-Type: application/json
Authorization: Bearer eyJ...

{
  "name": "Nice Kicks",
  "type": "TWITTER",
  "url": "@nicaborja_kicks",
  "reason": "Très réactif sur les leaks Nike, souvent en avance de 24h"
}
```

### Exemple: Approuver une suggestion

```bash
PUT /api/suggestions/clx.../approve
Content-Type: application/json
Authorization: Bearer eyJ...

{
  "note": "Bonne source, ajoutée avec intervalle de 60s"
}
```

**Effet**: La source est automatiquement créée et la surveillance commence.

---

## 🔔 Alerts

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/api/alerts` | Liste des alertes (paginée) | Authentifié |
| GET | `/api/alerts/:id` | Détails d'une alerte | Authentifié |
| PUT | `/api/alerts/:id` | Modifier statut/assignation | EDITOR+ |
| POST | `/api/alerts/:id/save` | Sauvegarder contenu | EDITOR+ |
| DELETE | `/api/alerts/:id/save` | Retirer de sauvegardés | EDITOR+ |
| POST | `/api/alerts/:id/dismiss` | Ignorer alerte | EDITOR+ |
| POST | `/api/alerts/:id/assign` | Assigner à un membre | EDITOR+ |

### Exemple: Liste des alertes

```bash
GET /api/alerts?page=1&limit=20&status=NEW&source=clx...
Authorization: Bearer eyJ...
```

**Réponse:**
```json
{
  "data": [
    {
      "id": "clx...",
      "content": "Nike Air Max 1 x Patta 'Aqua' releasing...",
      "authorName": "Sneaker News",
      "authorHandle": "@SneakerNews",
      "permalink": "https://twitter.com/...",
      "status": "NEW",
      "isRead": false,
      "assignedTo": null,
      "media": [
        {
          "id": "clx...",
          "type": "IMAGE",
          "originalUrl": "https://...",
          "storedUrl": "https://r2.../...",
          "thumbnail": "https://r2.../thumb/..."
        }
      ],
      "source": {
        "id": "clx...",
        "name": "Sneaker News",
        "type": "TWITTER"
      },
      "detectedAt": "2024-01-15T10:30:00Z",
      "postedAt": "2024-01-15T10:25:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Exemple: Assigner une alerte

```bash
POST /api/alerts/clx.../assign
Content-Type: application/json
Authorization: Bearer eyJ...

{
  "userId": "clx..."
}
```

---

## 🖼️ Media

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/api/media/:id` | Télécharger un média | Authentifié |
| POST | `/api/media/:id/download` | Forcer téléchargement vers R2 | EDITOR+ |

---

## 📤 Publication

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| GET | `/api/publish/templates` | Templates de publication | Authentifié |
| POST | `/api/publish/preview` | Prévisualiser | EDITOR+ |
| POST | `/api/publish/twitter` | Publier sur Twitter | EDITOR+ |
| GET | `/api/publish/history` | Historique | Authentifié |
| DELETE | `/api/publish/:id` | Annuler (si SCHEDULED) | EDITOR+ |

### Exemple: Publier sur Twitter

```bash
POST /api/publish/twitter
Content-Type: application/json
Authorization: Bearer eyJ...

{
  "alertId": "clx...",
  "content": "🔥 LEAK: Nike Air Max 1 x Patta 'Aqua' arriving soon!\n\nSource: @SneakerNews",
  "mediaIds": ["clx...", "clx..."]
}
```

**Réponse:**
```json
{
  "id": "clx...",
  "status": "PUBLISHED",
  "externalId": "1234567890",
  "externalUrl": "https://twitter.com/user/status/1234567890",
  "publishedAt": "2024-01-15T11:00:00Z"
}
```

---

## 🔔 Notifications

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| POST | `/api/notifications/subscribe` | S'abonner aux push | Authentifié |
| DELETE | `/api/notifications/subscribe` | Se désabonner | Authentifié |
| POST | `/api/notifications/test` | Envoyer test | Authentifié |
| GET | `/api/notifications/settings` | Paramètres | Authentifié |
| PUT | `/api/notifications/settings` | Modifier paramètres | Authentifié |

### Exemple: S'abonner aux notifications

```bash
POST /api/notifications/subscribe
Content-Type: application/json
Authorization: Bearer eyJ...

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "BL...",
    "auth": "Xw..."
  }
}
```

---

## 🔄 WebSocket Events

### Connexion

```javascript
import { io } from 'socket.io-client';

const socket = io('https://api.visao.app', {
  auth: {
    token: 'eyJ...'
  }
});

// Le serveur auto-join le user à sa room d'organisation
```

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `subscribe:alerts` | `{}` | S'abonner aux alertes |
| `unsubscribe:alerts` | `{}` | Se désabonner |
| `alert:read` | `{ alertId }` | Marquer comme lu |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `alert:new` | `Alert` | Nouvelle alerte |
| `alert:updated` | `Alert` | Alerte modifiée |
| `source:status` | `{ sourceId, status, error? }` | Statut source |
| `publish:result` | `Publication` | Résultat publication |
| `suggestion:new` | `SourceSuggestion` | Nouvelle suggestion (admins) |

---

## ❌ Codes d'erreur

| Code | Signification |
|------|---------------|
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Non autorisé (permissions insuffisantes) |
| 404 | Ressource non trouvée |
| 409 | Conflit (ex: email déjà utilisé) |
| 422 | Limite atteinte (plan) |
| 429 | Rate limit |
| 500 | Erreur serveur |

### Format des erreurs

```json
{
  "error": {
    "code": "PLAN_LIMIT_REACHED",
    "message": "You have reached the maximum number of sources for your plan",
    "details": {
      "current": 3,
      "max": 3,
      "plan": "FREE",
      "upgradeUrl": "/settings/billing"
    }
  }
}
```

---

## 🔒 Rate Limits

| Endpoint | Limite |
|----------|--------|
| `/api/auth/*` | 10 req/min |
| `/api/sources` (POST) | 20 req/min |
| `/api/publish/*` | 30 req/min |
| Autres | 100 req/min |

Les headers de réponse incluent :
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705312800
```
