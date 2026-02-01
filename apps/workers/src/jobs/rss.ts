import Parser from 'rss-parser'
import { supabase, type Source, type Alert, type Media } from '../lib/supabase.js'
import { scheduleNotification, type RssJobData } from '../queues/index.js'

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
    ],
  },
})

interface FeedItem {
  title?: string
  link?: string
  pubDate?: string
  content?: string
  contentSnippet?: string
  creator?: string
  author?: string
  guid?: string
  isoDate?: string
  mediaContent?: Array<{ $: { url: string; medium?: string; type?: string } }>
  mediaThumbnail?: { $: { url: string } }
  enclosure?: { url: string; type?: string }
}

export async function processRssFeed(data: RssJobData): Promise<void> {
  const { sourceId, url, organizationId } = data

  console.log(`[RSS] Processing feed: ${url} (source: ${sourceId})`)

  try {
    // Récupérer les informations de la source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('*')
      .eq('id', sourceId)
      .single()

    if (sourceError || !source) {
      console.error(`[RSS] Source not found: ${sourceId}`)
      return
    }

    if (!source.is_active) {
      console.log(`[RSS] Source is inactive, skipping: ${sourceId}`)
      return
    }

    // Parser le flux RSS
    const feed = await parser.parseURL(url)
    console.log(`[RSS] Found ${feed.items.length} items in feed`)

    // Récupérer les alertes existantes pour éviter les doublons
    const { data: existingAlerts } = await supabase
      .from('alerts')
      .select('external_id')
      .eq('source_id', sourceId)

    const existingIds = new Set(existingAlerts?.map((a) => a.external_id) || [])

    // Traiter chaque item du feed
    let newAlerts = 0
    for (const item of feed.items) {
      const externalId = item.guid || item.link || item.title || ''

      if (existingIds.has(externalId)) {
        continue // Déjà traité
      }

      // Créer l'alerte
      const alertData: Partial<Alert> = {
        source_id: sourceId,
        external_id: externalId,
        content: item.contentSnippet || item.title || '',
        author_name: feed.title || source.name,
        author_handle: new URL(url).hostname,
        author_avatar: feed.image?.url || null,
        permalink: item.link || url,
        status: 'NEW',
        is_read: false,
        is_pinned: false,
        posted_at: item.isoDate || item.pubDate || new Date().toISOString(),
      }

      const { data: alert, error: alertError } = await supabase
        .from('alerts')
        .insert(alertData)
        .select()
        .single()

      if (alertError) {
        console.error(`[RSS] Failed to create alert:`, alertError)
        continue
      }

      // Extraire les médias
      const mediaUrls = extractMedia(item as FeedItem)
      for (const mediaInfo of mediaUrls) {
        const mediaData: Partial<Media> = {
          alert_id: alert.id,
          type: mediaInfo.type,
          original_url: mediaInfo.url,
          thumbnail: mediaInfo.thumbnail,
        }

        await supabase.from('media').insert(mediaData)
      }

      newAlerts++

      // Programmer une notification
      await scheduleNotification({
        type: 'new_alert',
        alertId: alert.id,
        organizationId,
      })
    }

    // Mettre à jour la source
    await supabase
      .from('sources')
      .update({
        last_checked_at: new Date().toISOString(),
        last_error: null,
      })
      .eq('id', sourceId)

    console.log(`[RSS] Processed ${newAlerts} new alerts from ${url}`)
  } catch (error) {
    console.error(`[RSS] Error processing feed ${url}:`, error)

    // Enregistrer l'erreur
    await supabase
      .from('sources')
      .update({
        last_checked_at: new Date().toISOString(),
        last_error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', sourceId)

    throw error
  }
}

function extractMedia(item: FeedItem): Array<{
  url: string
  type: 'IMAGE' | 'VIDEO' | 'GIF'
  thumbnail?: string
}> {
  const media: Array<{ url: string; type: 'IMAGE' | 'VIDEO' | 'GIF'; thumbnail?: string }> = []

  // Media RSS
  if (item.mediaContent) {
    for (const mc of item.mediaContent) {
      if (mc.$ && mc.$.url) {
        const type = determineMediaType(mc.$.url, mc.$.type || mc.$.medium)
        media.push({ url: mc.$.url, type })
      }
    }
  }

  // Thumbnail
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
    const existing = media.find((m) => m.type === 'IMAGE')
    if (existing) {
      existing.thumbnail = item.mediaThumbnail.$.url
    } else {
      media.push({ url: item.mediaThumbnail.$.url, type: 'IMAGE' })
    }
  }

  // Enclosure
  if (item.enclosure && item.enclosure.url) {
    const type = determineMediaType(item.enclosure.url, item.enclosure.type)
    if (!media.some((m) => m.url === item.enclosure!.url)) {
      media.push({ url: item.enclosure.url, type })
    }
  }

  return media
}

function determineMediaType(url: string, mimeType?: string): 'IMAGE' | 'VIDEO' | 'GIF' {
  const lowerUrl = url.toLowerCase()
  const lowerMime = mimeType?.toLowerCase() || ''

  if (lowerUrl.endsWith('.gif') || lowerMime.includes('gif')) {
    return 'GIF'
  }

  if (
    lowerMime.includes('video') ||
    lowerUrl.endsWith('.mp4') ||
    lowerUrl.endsWith('.webm') ||
    lowerUrl.endsWith('.mov')
  ) {
    return 'VIDEO'
  }

  return 'IMAGE'
}
