export function notificationSupported() {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    typeof window.Notification.requestPermission === 'function'
  )
}

export function notificationPermission() {
  if (!notificationSupported()) return 'unsupported'
  return window.Notification.permission
}

export async function requestNotificationPermission() {
  if (!notificationSupported()) return 'unsupported'
  return window.Notification.requestPermission()
}

export async function showSystemNotification(title, body) {
  try {
    if (typeof navigator === 'undefined') return false
    const reg = await navigator.serviceWorker?.ready
    if (reg && typeof reg.showNotification === 'function') {
      await reg.showNotification(title, {
        body: body ?? '',
        tag: 'horizons-reminder',
        icon: 'pwa-192x192.png',
        badge: 'pwa-192x192.png',
        data: { url: './' },
      })
      return true
    }
    if (notificationSupported() && notificationPermission() === 'granted') {
      new window.Notification(title, { body, icon: 'pwa-192x192.png' })
      return true
    }
  } catch {
    /* notification non déclenchable : silencieux */
  }
  return false
}