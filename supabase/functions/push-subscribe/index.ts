import { adminClient } from '../_shared/supabase.ts'
import { json, optsFallback } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optsFallback()
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const { deviceUid, subscription } = await req.json()
    if (!deviceUid || !subscription?.endpoint || !subscription?.keys) {
      return json({ error: 'Champs requis manquants.' }, 400)
    }

    const supabase = adminClient()
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        device_uid: deviceUid,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      { onConflict: 'endpoint' },
    )
    if (error) throw error
    return json({ ok: true })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})