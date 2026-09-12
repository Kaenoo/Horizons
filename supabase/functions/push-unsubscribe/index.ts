import { adminClient } from '../_shared/supabase.ts'
import { json, optsFallback } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optsFallback()
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const { deviceUid } = await req.json()
    if (!deviceUid) return json({ error: 'deviceUid requis.' }, 400)

    const supabase = adminClient()
    await supabase.from('push_subscriptions').delete().eq('device_uid', deviceUid)
    await supabase.from('reminder_jobs').delete().eq('device_uid', deviceUid)
    return json({ ok: true })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})