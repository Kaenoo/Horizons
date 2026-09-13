import { adminClient } from '../_shared/supabase.ts'
import { json, optsFallback } from '../_shared/cors.ts'
import { advanceToFuture } from '../_shared/recurrence.ts'
import { buildAppServer } from '../_shared/vapid.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optsFallback()

  const appServer = await buildAppServer()
  if (!appServer) {
    return json({ error: 'Clés VAPID manquantes.' }, 500)
  }

  const supabase = adminClient()
  const now = new Date()

  const { data: jobs, error } = await supabase
    .from('reminder_jobs')
    .select('*')
    .lte('fire_at', now.toISOString())
    .order('fire_at', { ascending: true })
    .limit(50)
  if (error) return json({ error: String(error) }, 500)

  let sent = 0
  const deadEndpoints: string[] = []

  for (const job of jobs ?? []) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('device_uid', job.device_uid)

    for (const sub of subs ?? []) {
      try {
        const subscriber = appServer.subscribe({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        })
        await subscriber.pushTextMessage(
          JSON.stringify({
            title: job.title,
            body: '',
            tag: `reminder-${job.goal_id}`,
            url: './',
          }),
          {},
        )
        sent += 1
      } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          deadEndpoints.push(sub.endpoint)
        }
      }
    }

    const next = advanceToFuture(new Date(job.fire_at), job.recurrence, now)
    if (next) {
      await supabase
        .from('reminder_jobs')
        .update({ fire_at: next.toISOString(), updated_at: now.toISOString() })
        .eq('id', job.id)
    } else {
      await supabase.from('reminder_jobs').delete().eq('id', job.id)
    }
  }

  for (const endpoint of deadEndpoints) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  }

  return json({ ok: true, sent })
})