import { Queue, Worker, Job } from 'bullmq'

// Configuration de connexion Redis pour BullMQ
// Note: Upstash ne supporte pas les commandes BullMQ natives,
// donc on utilise une approche différente avec Upstash directement

const redisUrl = process.env.REDIS_URL

// Parsing de l'URL Redis
function parseRedisUrl(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 6379,
    password: parsed.password,
    username: parsed.username || 'default',
    tls: parsed.protocol === 'rediss:' ? {} : undefined,
  }
}

let connection: ReturnType<typeof parseRedisUrl> | undefined

if (redisUrl) {
  connection = parseRedisUrl(redisUrl)
}

// Types des jobs
export interface RssJobData {
  sourceId: string
  url: string
  organizationId: string
}

export interface TwitterJobData {
  sourceId: string
  handle: string
  organizationId: string
  sinceId?: string
}

export interface NotificationJobData {
  type: 'new_alert'
  alertId: string
  organizationId: string
}

// Création des queues (si Redis standard disponible)
export const rssQueue = connection
  ? new Queue<RssJobData>('rss-fetch', { connection })
  : null

export const twitterQueue = connection
  ? new Queue<TwitterJobData>('twitter-fetch', { connection })
  : null

export const notificationQueue = connection
  ? new Queue<NotificationJobData>('notifications', { connection })
  : null

// Export de la configuration
export { connection as redisConnection }

// Helper pour ajouter un job RSS
export async function scheduleRssFetch(data: RssJobData, delayMs = 0) {
  if (!rssQueue) {
    console.warn('RSS Queue not available - skipping job')
    return
  }
  return rssQueue.add('fetch', data, {
    delay: delayMs,
    removeOnComplete: 100,
    removeOnFail: 50,
  })
}

// Helper pour ajouter un job Twitter
export async function scheduleTwitterFetch(data: TwitterJobData, delayMs = 0) {
  if (!twitterQueue) {
    console.warn('Twitter Queue not available - skipping job')
    return
  }
  return twitterQueue.add('fetch', data, {
    delay: delayMs,
    removeOnComplete: 100,
    removeOnFail: 50,
  })
}

// Helper pour envoyer une notification
export async function scheduleNotification(data: NotificationJobData) {
  if (!notificationQueue) {
    console.warn('Notification Queue not available - skipping job')
    return
  }
  return notificationQueue.add('send', data, {
    removeOnComplete: 100,
    removeOnFail: 50,
  })
}
