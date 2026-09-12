import { adminClient } from '../_shared/supabase.ts'
import { json, optsFallback } from '../_shared/cors.ts'

const RECURRENCE_IDS = ['none', 'daily', 'weekly', 'monthly', 'yearly']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optsFallback()
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const { deviceUid, jobs } = await req.json()
    if (!deviceUid || !Array.isArray(jobs)) {
      return json({ error: 'deviceUid et jobs requis.' }, 400)
    }

    const supabase = adminClient()

    const rows = jobs
      .filter((j) => j && j.goalId && j.fireAt)
      .map((j) => ({
        device_uid: deviceUid,
        goal_id: String(j.goalId),
        title: String(j.title ?? 'Rappel'),
        fire_at: j.fireAt,
        recurrence: RECURRENCE_IDS.includes(j.recurrence) ? j.recurrence : 'none',
      }))

    const keys = rows.map((r) => r.goal_id)
    if (keys.length > 0) {
      const { data: existing } = await supabase
        .from('reminder_jobs')
        .select('goal_id')
        .eq('device_uid', deviceUid)
      const keep = new Set(keys)
      const toDelete = (existing ?? [])
        .filter((r) => !keep.has(r.goal_id))
        .map((r) => r.goal_id)
      if (toDelete.length > 0) {
        await supabase
          .from('reminder_jobs')
          .delete()
          .eq('device_uid', deviceUid)
          .in('goal_id', toDelete)
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase
        .from('reminder_jobs')
        .upsert(rows, { onConflict: 'device_uid,goal_id' })
      if (error) throw error
    }

    return json({ ok: true, count: rows.length })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})