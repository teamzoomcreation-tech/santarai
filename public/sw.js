/**
 * SantarAI Service Worker — PWA Cache Strategy
 * Cache-first pour les assets statiques, Network-first pour les API
 */

const CACHE_NAME = 'santarai-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/logo-v2.png',
  '/manifest.json',
]

// Installation : pré-cache des assets critiques
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Ne pas bloquer l'installation si un asset échoue
      })
    })
  )
  self.skipWaiting()
})

// Activation : nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

// Fetch : stratégie mixte
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorer les requêtes non-GET et les routes API
  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/')) {
    // Assets Next.js : cache-first
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Pages : Network-first, fallback cache, fallback offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached
          // Fallback page offline si disponible
          if (request.destination === 'document') {
            return caches.match('/offline') || Response.error()
          }
          return Response.error()
        })
      })
  )
})

// Push Notifications
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  const options = {
    body: data.body || 'Nouvelle notification SantarAI',
    icon: '/logo-v2.png',
    badge: '/logo-v2.png',
    tag: data.tag || 'santarai-notification',
    data: { url: data.url || '/dashboard' },
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'dismiss', title: 'Ignorer' },
    ],
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'SantarAI', options)
  )
})

// Clic sur notification → ouvrir l'URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'dismiss') return
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
