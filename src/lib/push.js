const PUSH_KEY = 'horizons:push:v1'
const DEVICE_KEY = 'horizons:device:v1'

export function loadPushConfig() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(PUSH_KEY)
    if (!raw) return null
    const cfg = JSON.parse(raw)
    if (!cfg || !cfg.url || !cfg.anonKey || !cfg.vapidPublicKey) return null
    return {
      url: cfg.url.replace(/\/+$/, ''),
      anonKey: cfg.anonKey,
      vapidPublicKey: cfg.vapidPublicKey,
    }
  } catch {
    return null
  }
}

export function savePushConfig(cfg) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PUSH_KEY, JSON.stringify(cfg))
  } catch {
    /* ignore */
  }
}

export function clearPushConfig() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(PUSH_KEY)
  } catch {
    /* ignore */
  }
}

export function isPushActive() {
  return Boolean(loadPushConfig())
}

export function getDeviceUid() {
  if (typeof window === 'undefined') return ''
  try {
    let uid = window.localStorage.getItem(DEVICE_KEY)
    if (!uid) {
      uid =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      window.localStorage.setItem(DEVICE_KEY, uid)
    }
    return uid
  } catch {
    return 'dev-unknown'
  }
}

export function isInstalledPwa() {
  if (typeof window === 'undefined') return false
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}

export function pushCapable() {
  if (typeof window === 'undefined') return false
  if (!('PushManager' in window) || !('serviceWorker' in navigator)) return false
  return true
}

export function pushOnIos() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

function callFunction(cfg, name, payload, { method = 'POST' } = {}) {
  return fetch(`${cfg.url}/functions/v1/${name}`, {
    method,
    headers: {
      apikey: cfg.anonKey,
      Authorization: `Bearer ${cfg.anonKey}`,
      'Content-Type': 'application/json',
    },
    body: method === 'POST' ? JSON.stringify(payload) : undefined,
  })
}

export async function enablePush() {
  const cfg = loadPushConfig()
  if (!cfg) return { ok: false, reason: 'config' }
  try {
    if (!('Notification' in window)) return { ok: false, reason: 'unsupported' }
    const permission = await window.Notification.requestPermission()
    if (permission !== 'granted') return { ok: false, reason: 'permission' }
    const reg = await navigator.serviceWorker.ready
    const existing = await reg.pushManager.getSubscription()
    if (existing) {
      await existing.unsubscribe().catch(() => {})
      await callFunction(cfg, 'push-unsubscribe', {
        deviceUid: getDeviceUid(),
      }).catch(() => {})
    }
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(cfg.vapidPublicKey),
    })
    const res = await callFunction(cfg, 'push-subscribe', {
      deviceUid: getDeviceUid(),
      subscription: subscription.toJSON(),
    })
    if (!res.ok) return { ok: false, reason: 'network' }
    return { ok: true, subscription }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

export async function disablePush() {
  const cfg = loadPushConfig()
  try {
    const reg = await navigator.serviceWorker?.ready
    const subscription = await reg?.pushManager?.getSubscription()
    if (subscription) await subscription.unsubscribe()
    if (cfg) {
      await callFunction(cfg, 'push-unsubscribe', {
        deviceUid: getDeviceUid(),
      })
    }
  } catch {
    /* ignore */
  }
}

export async function syncReminderJobs(jobs) {
  const cfg = loadPushConfig()
  if (!cfg) return false
  try {
    const res = await callFunction(cfg, 'push-upsert-jobs', {
      deviceUid: getDeviceUid(),
      jobs,
    })
    return res.ok
  } catch {
    return false
  }
}

export function remindersToJobs(goals) {
  return goals
    .filter((g) => g.reminder && g.reminder.nextAt && g.status !== 'done')
    .map((g) => ({
      goalId: g.id,
      title: g.title,
      fireAt: new Date(g.reminder.nextAt).toISOString(),
      recurrence: g.reminder.recurrence,
    }))
}