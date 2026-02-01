import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Parser customisé pour récupérer les champs media
type CustomItem = {
  title?: string
  link?: string
  guid?: string
  pubDate?: string
  isoDate?: string
  content?: string
  contentSnippet?: string
  'content:encoded'?: string
  enclosure?: { url?: string; type?: string }
  'media:content'?: { $?: { url?: string } }
  'media:thumbnail'?: { $?: { url?: string } }
}

const parser = new Parser<Record<string, unknown>, CustomItem>({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'content:encoded'],
      ['enclosure', 'enclosure'],
    ],
  },
})

// Fonction pour extraire l'image d'un article RSS
function extractImageFromItem(item: CustomItem): string | null {
  // 1. Essayer enclosure (format standard)
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) {
    return item.enclosure.url
  }

  // 2. Essayer media:content
  if (item['media:content']?.$?.url) {
    return item['media:content'].$.url
  }

  // 3. Essayer media:thumbnail
  if (item['media:thumbnail']?.$?.url) {
    return item['media:thumbnail'].$.url
  }

  // 4. Extraire la première image du contenu HTML
  const htmlContent = item['content:encoded'] || item.content || ''
  const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1]
  }

  // 5. Chercher og:image ou autre pattern
  const ogMatch = htmlContent.match(/og:image[^>]+content=["']([^"']+)["']/i)
  if (ogMatch && ogMatch[1]) {
    return ogMatch[1]
  }

  return null
}

async function fetchAllSources() {
  console.log('🔄 Fetching all RSS sources...\n')

  const { data: sources, error } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .eq('type', 'RSS')

  if (error || !sources) {
    console.error('❌ Error fetching sources:', error)
    return
  }

  console.log(`📡 Found ${sources.length} sources\n`)

  for (const source of sources) {
    console.log(`\n--- ${source.name} ---`)
    console.log(`URL: ${source.url}`)

    try {
      const feed = await parser.parseURL(source.url)
      console.log(`✅ Feed parsed: ${feed.items.length} items`)

      // Récupérer les alertes existantes
      const { data: existingAlerts } = await supabase
        .from('alerts')
        .select('external_id')
        .eq('source_id', source.id)

      const existingIds = new Set(existingAlerts?.map(a => a.external_id) || [])

      let newCount = 0
      for (const item of feed.items.slice(0, 10)) { // Max 10 par source
        const externalId = item.guid || item.link || item.title || ''

        if (existingIds.has(externalId)) continue

        // Extraire l'image de l'article
        const articleImage = extractImageFromItem(item)

        const { data: alertData, error: insertError } = await supabase
          .from('alerts')
          .insert({
            source_id: source.id,
            external_id: externalId,
            content: item.contentSnippet || item.title || '',
            author_name: feed.title || source.name,
            author_handle: new URL(source.url).hostname,
            author_avatar: feed.image?.url || null,
            permalink: item.link || source.url,
            status: 'NEW',
            is_read: false,
            is_pinned: false,
            posted_at: item.isoDate || item.pubDate || new Date().toISOString(),
          })
          .select('id')
          .single()

        if (!insertError && alertData && articleImage) {
          // Ajouter l'image dans la table media
          await supabase
            .from('media')
            .insert({
              alert_id: alertData.id,
              type: 'IMAGE',
              original_url: articleImage,
            })
          console.log(`  📷 Image found for: ${item.title?.substring(0, 40)}...`)
        }

        if (!insertError) newCount++
      }

      console.log(`📥 ${newCount} new alerts added`)

      // Update last_checked_at
      await supabase
        .from('sources')
        .update({ last_checked_at: new Date().toISOString(), last_error: null })
        .eq('id', source.id)

    } catch (err) {
      console.error(`❌ Error:`, err instanceof Error ? err.message : err)
      await supabase
        .from('sources')
        .update({ last_error: err instanceof Error ? err.message : 'Unknown error' })
        .eq('id', source.id)
    }
  }

  console.log('\n\n🎉 Done! Check http://localhost:3000/feed')
}

fetchAllSources()
