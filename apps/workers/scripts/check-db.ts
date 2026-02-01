import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  // Check alerts
  const { data: alerts } = await supabase
    .from('alerts')
    .select('id, content, author_name')
    .limit(5)

  console.log('=== ALERTS ===')
  alerts?.forEach(a => {
    console.log('---')
    console.log('Source:', a.author_name)
    console.log('Content (first 400 chars):')
    console.log(a.content?.substring(0, 400))
    console.log('')
  })

  // Check media count per alert
  const { data: allMedia } = await supabase.from('media').select('alert_id, original_url')

  const mediaByAlert = new Map<string, string[]>()
  allMedia?.forEach(m => {
    const existing = mediaByAlert.get(m.alert_id) || []
    existing.push(m.original_url)
    mediaByAlert.set(m.alert_id, existing)
  })

  console.log('\n=== MEDIA STATS ===')
  console.log('Total media:', allMedia?.length)
  console.log('Alerts with media:', mediaByAlert.size)

  // Show media count distribution
  const counts: Record<number, number> = {}
  mediaByAlert.forEach((urls) => {
    const count = urls.length
    counts[count] = (counts[count] || 0) + 1
  })
  console.log('Distribution:', counts)

  // Sample media for first alert
  if (alerts && alerts[0]) {
    const media = mediaByAlert.get(alerts[0].id)
    console.log('\n=== SAMPLE MEDIA for first alert ===')
    console.log('Count:', media?.length)
    media?.slice(0, 3).forEach((url, i) => console.log(i + 1, url?.substring(0, 100)))
  }
}

check()
