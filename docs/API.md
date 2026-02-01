# Visao - API Endpoints

## 🔐 Authentication

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Créer un compte |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Profil utilisateur |
| PUT | `/api/auth/me` | Modifier profil |
| POST | `/api/auth/refresh` | Rafraîchir token |

### Exemple: Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse:**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "EDITOR"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

## 📡 Sources

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/sources` | Liste des sources |
| POST | `/api/sources` | Ajouter une source |
| GET | `/api/sources/:id` | Détails d'une source |
| PUT | `/api/sources/:id` | Modifier une source |
| DELETE | `/api/sources/:id` | Supprimer une source |
| POST | `/api/sources/:id/check` | Forcer vérification |
| GET | `/api/sources/:id/alerts` | Alertes d'une source |

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

## 🔔 Alerts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/alerts` | Liste des alertes (paginée) |
| GET | `/api/alerts/:id` | Détails d'une alerte |
| PUT | `/api/alerts/:id` | Modifier statut alerte |
| POST | `/api/alerts/:id/save` | Sauvegarder contenu |
| DELETE | `/api/alerts/:id/save` | Retirer de sauvegardés |
| POST | `/api/alerts/:id/dismiss` | Ignorer alerte |

### Exemple: Liste des alertes

```bash
GET /api/alerts?page=1&limit=20&status=NEW
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

### Exemple: Sauvegarder une alerte

```bash
POST /api/alerts/clx.../save
Content-Type: application/json
Authorization: Bearer eyJ...

{
  "notes": "À traiter pour l'article de demain",
  "tags": ["nike", "collab", "urgent"]
}
```

---

## 🖼️ Media

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/media/:id` | Télécharger un média |
| POST | `/api/media/download` | Forcer téléchargement |

### Exemple: Télécharger un média

```bash
GET /api/media/clx...
Authorization: Bearer eyJ...
```

Retourne le fichier média directement ou une URL signée.

---

## 📤 Publication

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/publish/templates` | Templates de publication |
| POST | `/api/publish/preview` | Prévisualiser publication |
| POST | `/api/publish/twitter` | Publier sur Twitter |
| GET | `/api/publish/history` | Historique publications |

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

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/notifications/subscribe` | S'abonner aux push |
| DELETE | `/api/notifications/subscribe` | Se désabonner |
| POST | `/api/notifications/test` | Envoyer test |
| GET | `/api/notifications/settings` | Paramètres notifs |
| PUT | `/api/notifications/settings` | Modifier paramètres |

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

const socket = io('http://localhost:4000', {
  auth: {
    token: 'eyJ...'
  }
});
```

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `subscribe:alerts` | `{}` | S'abonner aux alertes temps réel |
| `unsubscribe:alerts` | `{}` | Se désabonner |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `alert:new` | `Alert` | Nouvelle alerte détectée |
| `alert:updated` | `Alert` | Alerte mise à jour |
| `source:status` | `{ sourceId, status }` | Changement statut source |
| `publish:result` | `Publication` | Résultat publication |

### Exemple: Écouter les nouvelles alertes

```javascript
socket.on('alert:new', (alert) => {
  console.log('Nouvelle alerte:', alert);
  // Mettre à jour le feed
});

socket.on('alert:updated', (alert) => {
  console.log('Alerte mise à jour:', alert);
  // Rafraîchir l'alerte dans le feed
});
```

---

## ❌ Codes d'erreur

| Code | Signification |
|------|---------------|
| 400 | Requête invalide (validation) |
| 401 | Non authentifié |
| 403 | Non autorisé (permissions) |
| 404 | Ressource non trouvée |
| 429 | Rate limit atteint |
| 500 | Erreur serveur |

### Format des erreurs

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```
