import 'dotenv/config'
import { Worker, Job } from 'bullmq'
import { supabase } from './lib/supabase.js'
import { processRssFeed } from './jobs/rss.js'
import { processTwitterAccount } from './jobs/twitter.js'
import { processNotification } from './jobs/notifications.js'
import {
  redisConnection,
  scheduleRssFetch,
  scheduleTwitterFetch,
  type RssJobData,
  type TwitterJobData,
  type NotificationJobData,
} from './queues/index.js'

console.log('🚀 Starting Visao Workers...')

// Mode dev ou production
const isDryRun = !supabase

if (isDryRun) {
  console.log('⚠️  DRY-RUN MODE: Supabase non configuré')
  console.log('   Les workers tournent mais ne font rien.')
  console.log('   Configure SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY pour activer.')
  console.log('')
  console.log('✅ Visao Workers running (dry-run mode)')

  // En mode dry-run, on garde le process en vie
  setInterval(() => {
    console.log('[Dry-run] Workers idle... Configure Supabase to start processing.')
  }, 60000)
} else {
  console.log('✅ Environment validated')

  // Mode de fonctionnement
  const useQueues = !!redisConnection

  if (useQueues) {
    console.log('📦 Using BullMQ queues with Redis')
    startQueueWorkers()
  } else {
    console.log('⏰ Using simple scheduler (no Redis)')
    startSimpleScheduler()
  }
}

// ============================================
// Mode avec BullMQ (si Redis disponible)
// ============================================

function startQueueWorkers() {
  if (!redisConnection) return

  // Worker RSS
  const rssWorker = new Worker<RssJobData>(
    'rss-fetch',
    async (job: Job<RssJobData>) => {
      console.log(`[RSS Worker] Processing job ${job.id}`)
      await processRssFeed(job.data)
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  )

  rssWorker.on('completed', (job) => {
    console.log(`[RSS Worker] Job ${job.id} completed`)
  })

  rssWorker.on('failed', (job, err) => {
    console.error(`[RSS Worker] Job ${job?.id} failed:`, err.message)
  })

  // Worker Twitter
  const twitterWorker = new Worker<TwitterJobData>(
    'twitter-fetch',
    async (job: Job<TwitterJobData>) => {
      console.log(`[Twitter Worker] Processing job ${job.id}`)
      await processTwitterAccount(job.data)
    },
    {
      connection: redisConnection,
      concurrency: 2,
    }
  )

  twitterWorker.on('completed', (job) => {
    console.log(`[Twitter Worker] Job ${job.id} completed`)
  })

  twitterWorker.on('failed', (job, err) => {
    console.error(`[Twitter Worker] Job ${job?.id} failed:`, err.message)
  })

  // Worker Notifications
  const notificationWorker = new Worker<NotificationJobData>(
    'notifications',
    async (job: Job<NotificationJobData>) => {
      console.log(`[Notification Worker] Processing job ${job.id}`)
      await processNotification(job.data)
    },
    {
      connection: redisConnection,
      concurrency: 10,
    }
  )

  notificationWorker.on('completed', (job) => {
    console.log(`[Notification Worker] Job ${job.id} completed`)
  })

  notificationWorker.on('failed', (job, err) => {
    console.error(`[Notification Worker] Job ${job?.id} failed:`, err.message)
  })

  console.log('✅ Queue workers started')
  startScheduler()
}

// ============================================
// Mode simple (sans Redis)
// ============================================

function startSimpleScheduler() {
  console.log('Starting simple scheduler...')

  setInterval(async () => {
    await checkAndProcessSources()
  }, 60 * 1000)

  checkAndProcessSources()
}

async function checkAndProcessSources() {
  if (!supabase) return

  try {
    const { data: sources, error } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('[Scheduler] Error fetching sources:', error)
      return
    }

    if (!sources || sources.length === 0) {
      return
    }

    const now = new Date()

    for (const source of sources) {
      const lastChecked = source.last_checked_at
        ? new Date(source.last_checked_at)
        : new Date(0)
      const intervalMs = (source.check_interval || 60) * 1000
      const nextCheck = new Date(lastChecked.getTime() + intervalMs)

      if (now < nextCheck) {
        continue
      }

      console.log(`[Scheduler] Processing source: ${source.name} (${source.type})`)

      try {
        switch (source.type) {
          case 'RSS':
          case 'WEBSITE':
            await processRssFeed({
              sourceId: source.id,
              url: source.url,
              organizationId: source.organization_id,
            })
            break

          case 'TWITTER':
            await processTwitterAccount({
              sourceId: source.id,
              handle: source.url,
              organizationId: source.organization_id,
              sinceId: (source.metadata as Record<string, string>)?.last_tweet_id,
            })
            break

          default:
            console.log(`[Scheduler] Unsupported source type: ${source.type}`)
        }
      } catch (err) {
        console.error(`[Scheduler] Error processing source ${source.id}:`, err)
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error in scheduler:', error)
  }
}

// ============================================
// Scheduler pour ajouter les jobs aux queues
// ============================================

async function startScheduler() {
  console.log('Starting queue scheduler...')

  setInterval(async () => {
    await scheduleSourceJobs()
  }, 60 * 1000)

  scheduleSourceJobs()
}

async function scheduleSourceJobs() {
  if (!supabase) return

  try {
    const { data: sources, error } = await supabase
      .from('sources')
      .select('*')
      .eq('is_active', true)

    if (error || !sources) {
      return
    }

    const now = new Date()

    for (const source of sources) {
      const lastChecked = source.last_checked_at
        ? new Date(source.last_checked_at)
        : new Date(0)
      const intervalMs = (source.check_interval || 60) * 1000
      const nextCheck = new Date(lastChecked.getTime() + intervalMs)

      if (now < nextCheck) {
        continue
      }

      switch (source.type) {
        case 'RSS':
        case 'WEBSITE':
          await scheduleRssFetch({
            sourceId: source.id,
            url: source.url,
            organizationId: source.organization_id,
          })
          break

        case 'TWITTER':
          await scheduleTwitterFetch({
            sourceId: source.id,
            handle: source.url,
            organizationId: source.organization_id,
            sinceId: (source.metadata as Record<string, string>)?.last_tweet_id,
          })
          break
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error scheduling jobs:', error)
  }
}

// ============================================
// Graceful shutdown
// ============================================

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...')
  process.exit(0)
})
