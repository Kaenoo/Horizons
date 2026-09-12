import { clientsClaim } from 'workbox-core'
import { createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

self.skipWaiting()
clientsClaim()

precacheAndRoute(self.__WB_MANIFEST)

const navigationRoute = new NavigationRoute(
  createHandlerBoundToURL('index.html'),
  {
    denylist: [/^\/api\//],
  },
)
registerRoute(navigationRoute)

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    /* payload non JSON */
  }
  const title = data.title || 'Rappel Horizons'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: 'pwa-192x192.png',
      badge: 'pwa-192x192.png',
      tag: data.tag || 'horizons-reminder',
      data: { url: data.url || './' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || './'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus()
            if ('navigate' in client) return client.navigate(url)
            return undefined
          }
        }
        return self.clients.openWindow?.(url)
      }),
  )
})