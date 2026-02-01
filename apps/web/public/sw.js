// Visao Service Worker
// Gère les notifications push et le cache offline

const CACHE_NAME = 'visao-v1'
const OFFLINE_URL = '/offline'

// Assets à mettre en cache pour le mode offline
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/feed',
  '/sources',
  '/offline',
  '/manifest.json',
]

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  // Activer immédiatement
  self.skipWaiting()
})

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  // Prendre le contrôle immédiatement
  self.clients.claim()
})

// Stratégie de cache: Network First, fallback to cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return
  }

  // Ignorer les requêtes vers des APIs externes
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  // Ignorer les requêtes vers /api
  if (url.pathname.startsWith('/api')) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Mettre en cache les réponses réussies
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // En cas d'échec, utiliser le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          // Si pas en cache, afficher la page offline
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
          return new Response('Offline', { status: 503 })
        })
      })
  )
})

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')

  if (!event.data) {
    console.log('[SW] No data in push event')
    return
  }

  const data = event.data.json()
  console.log('[SW] Push data:', data)

  const options = {
    body: data.body || 'Nouvelle notification',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    tag: data.tag || 'visao-notification',
    data: data.data || {},
    actions: data.actions || [],
    vibrate: [200, 100, 200],
    requireInteraction: true,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Visao', options)
  )
})

// Gestion du clic sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action)

  event.notification.close()

  const data = event.notification.data || {}

  if (event.action === 'dismiss') {
    // Marquer comme ignoré via l'API
    if (data.alertId) {
      fetch(`/api/alerts/${data.alertId}/dismiss`, { method: 'POST' })
    }
    return
  }

  // Action par défaut ou "view": ouvrir l'app
  const urlToOpen = data.url || '/feed'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Chercher une fenêtre existante
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen)
          return client.focus()
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed')
})

// Synchronisation en arrière-plan (si supporté)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)

  if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlerts())
  }
})

async function syncAlerts() {
  try {
    const response = await fetch('/api/alerts/sync', { method: 'POST' })
    if (!response.ok) {
      throw new Error('Sync failed')
    }
    console.log('[SW] Alerts synced successfully')
  } catch (error) {
    console.error('[SW] Sync error:', error)
  }
}
