import { TwitterApi } from 'twitter-api-v2'
import { supabase, type Alert, type Media } from '../lib/supabase.js'
import { checkRateLimit } from '../lib/redis.js'
import { scheduleNotification, type TwitterJobData } from '../queues/index.js'

// Configuration du client Twitter
const bearerToken = process.env.TWITTER_BEARER_TOKEN

let twitterClient: TwitterApi | null = null

if (bearerToken) {
  twitterClient = new TwitterApi(bearerToken)
}

// Limites de l'API Twitter (Basic Plan)
const TWITTER_RATE_LIMIT = {
  tweets_per_15min: 450,
  users_per_15min: 300,
}

export async function processTwitterAccount(data: TwitterJobData): Promise<void> {
  const { sourceId, handle, organizationId, sinceId } = data

  if (!twitterClient) {
    console.error('[Twitter] Twitter client not configured')
    return
  }

  // Nettoyer le handle
  const cleanHandle = handle.replace('@', '')
  console.log(`[Twitter] Processing account: @${cleanHandle} (source: ${sourceId})`)

  try {
    // Vérifier le rate limit
    const rateCheck = await checkRateLimit(
      `twitter:tweets:${organizationId}`,
      TWITTER_RATE_LIMIT.tweets_per_15min,
      15 * 60
    )

    if (!rateCheck.allowed) {
      const waitTime = Math.ceil((rateCheck.resetAt - Date.now()) / 1000)
      console.log(`[Twitter] Rate limited. Waiting ${waitTime}s`)
      throw new Error(`Rate limited. Retry after ${waitTime} seconds`)
    }

    // Récupérer l'ID de l'utilisateur Twitter
    const { data: userData, errors: userErrors } = await twitterClient.v2.userByUsername(
      cleanHandle,
      {
        'user.fields': ['profile_image_url', 'name', 'description'],
      }
    )

    if (userErrors || !userData) {
      console.error('[Twitter] User not found:', cleanHandle)
      await updateSourceError(sourceId, `User @${cleanHandle} not found`)
      return
    }

    // Mettre à jour les métadonnées de la source
    await supabase
      .from('sources')
      .update({
        identifier: userData.id,
        metadata: {
          twitter_id: userData.id,
          name: userData.name,
          username: userData.username,
          profile_image_url: userData.profile_image_url,
          description: userData.description,
        },
      })
      .eq('id', sourceId)

    // Récupérer les tweets récents
    const tweetsParams: Parameters<typeof twitterClient.v2.userTimeline>[1] = {
      max_results: 10,
      'tweet.fields': ['created_at', 'public_metrics', 'attachments', 'referenced_tweets'],
      'media.fields': ['url', 'preview_image_url', 'type', 'width', 'height', 'duration_ms'],
      expansions: ['attachments.media_keys'],
      exclude: ['retweets', 'replies'], // On ne veut que les tweets originaux
    }

    if (sinceId) {
      tweetsParams.since_id = sinceId
    }

    const { data: tweets, includes } = await twitterClient.v2.userTimeline(
      userData.id,
      tweetsParams
    )

    if (!tweets.data || tweets.data.length === 0) {
      console.log(`[Twitter] No new tweets from @${cleanHandle}`)
      await updateSourceLastChecked(sourceId)
      return
    }

    console.log(`[Twitter] Found ${tweets.data.length} tweets from @${cleanHandle}`)

    // Créer un map des médias
    const mediaMap = new Map(
      includes?.media?.map((m) => [m.media_key, m]) || []
    )

    // Récupérer les alertes existantes
    const { data: existingAlerts } = await supabase
      .from('alerts')
      .select('external_id')
      .eq('source_id', sourceId)

    const existingIds = new Set(existingAlerts?.map((a) => a.external_id) || [])

    let newAlerts = 0
    let latestTweetId: string | undefined

    for (const tweet of tweets.data) {
      if (!latestTweetId) {
        latestTweetId = tweet.id
      }

      if (existingIds.has(tweet.id)) {
        continue
      }

      // Créer l'alerte
      const alertData: Partial<Alert> = {
        source_id: sourceId,
        external_id: tweet.id,
        content: tweet.text,
        author_name: userData.name,
        author_handle: `@${userData.username}`,
        author_avatar: userData.profile_image_url?.replace('_normal', '_400x400') || null,
        permalink: `https://twitter.com/${userData.username}/status/${tweet.id}`,
        status: 'NEW',
        is_read: false,
        is_pinned: false,
        posted_at: tweet.created_at || new Date().toISOString(),
      }

      const { data: alert, error: alertError } = await supabase
        .from('alerts')
        .insert(alertData)
        .select()
        .single()

      if (alertError) {
        console.error('[Twitter] Failed to create alert:', alertError)
        continue
      }

      // Extraire les médias
      if (tweet.attachments?.media_keys) {
        for (const mediaKey of tweet.attachments.media_keys) {
          const twitterMedia = mediaMap.get(mediaKey)
          if (!twitterMedia) continue

          const mediaData: Partial<Media> = {
            alert_id: alert.id,
            type: mapTwitterMediaType(twitterMedia.type),
            original_url: twitterMedia.url || twitterMedia.preview_image_url || '',
            thumbnail: twitterMedia.preview_image_url,
            width: twitterMedia.width,
            height: twitterMedia.height,
            duration: twitterMedia.duration_ms ? Math.round(twitterMedia.duration_ms / 1000) : null,
          }

          await supabase.from('media').insert(mediaData)
        }
      }

      newAlerts++

      // Programmer une notification
      await scheduleNotification({
        type: 'new_alert',
        alertId: alert.id,
        organizationId,
      })
    }

    // Mettre à jour la source avec le dernier tweet ID
    await supabase
      .from('sources')
      .update({
        last_checked_at: new Date().toISOString(),
        last_error: null,
        metadata: {
          ...(await getSourceMetadata(sourceId)),
          last_tweet_id: latestTweetId,
        },
      })
      .eq('id', sourceId)

    console.log(`[Twitter] Processed ${newAlerts} new alerts from @${cleanHandle}`)
  } catch (error) {
    console.error(`[Twitter] Error processing @${cleanHandle}:`, error)

    await updateSourceError(
      sourceId,
      error instanceof Error ? error.message : 'Unknown error'
    )

    throw error
  }
}

function mapTwitterMediaType(type: string): 'IMAGE' | 'VIDEO' | 'GIF' {
  switch (type) {
    case 'video':
      return 'VIDEO'
    case 'animated_gif':
      return 'GIF'
    default:
      return 'IMAGE'
  }
}

async function getSourceMetadata(sourceId: string): Promise<Record<string, unknown>> {
  const { data } = await supabase
    .from('sources')
    .select('metadata')
    .eq('id', sourceId)
    .single()

  return (data?.metadata as Record<string, unknown>) || {}
}

async function updateSourceLastChecked(sourceId: string): Promise<void> {
  await supabase
    .from('sources')
    .update({
      last_checked_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', sourceId)
}

async function updateSourceError(sourceId: string, error: string): Promise<void> {
  await supabase
    .from('sources')
    .update({
      last_checked_at: new Date().toISOString(),
      last_error: error,
    })
    .eq('id', sourceId)
}
