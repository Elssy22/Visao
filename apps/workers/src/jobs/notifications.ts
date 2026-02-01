import webpush from 'web-push'
import { supabase } from '../lib/supabase.js'
import type { NotificationJobData } from '../queues/index.js'

// Configuration Web Push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const vapidSubject = process.env.VAPID_SUBJECT

if (vapidPublicKey && vapidPrivateKey && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)
}

interface PushSubscription {
  id: string
  profile_id: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface AlertWithSource {
  id: string
  content: string
  author_name: string
  author_handle: string
  posted_at: string
  source: {
    name: string
    type: string
    organization_id: string
  }
}

export async function processNotification(data: NotificationJobData): Promise<void> {
  const { type, alertId, organizationId } = data

  console.log(`[Notification] Processing ${type} notification for alert ${alertId}`)

  try {
    switch (type) {
      case 'new_alert':
        await sendNewAlertNotification(alertId, organizationId)
        break
      default:
        console.warn(`[Notification] Unknown notification type: ${type}`)
    }
  } catch (error) {
    console.error(`[Notification] Error processing notification:`, error)
    throw error
  }
}

async function sendNewAlertNotification(
  alertId: string,
  organizationId: string
): Promise<void> {
  // Récupérer les détails de l'alerte
  const { data: alert, error: alertError } = await supabase
    .from('alerts')
    .select(`
      id,
      content,
      author_name,
      author_handle,
      posted_at,
      source:sources(name, type, organization_id)
    `)
    .eq('id', alertId)
    .single()

  if (alertError || !alert) {
    console.error(`[Notification] Alert not found: ${alertId}`)
    return
  }

  const typedAlert = alert as unknown as AlertWithSource

  // Récupérer les abonnements push des membres de l'organisation
  const { data: subscriptions, error: subsError } = await supabase
    .from('push_subscriptions')
    .select(`
      id,
      profile_id,
      endpoint,
      keys
    `)
    .eq('profile_id', organizationId) // Note: il faudrait join avec profiles pour filtrer par organization

  if (subsError || !subscriptions || subscriptions.length === 0) {
    console.log(`[Notification] No push subscriptions found for org ${organizationId}`)
    return
  }

  // Préparer le payload de la notification
  const notificationPayload = JSON.stringify({
    title: `Nouvelle alerte - ${typedAlert.source.name}`,
    body: truncate(typedAlert.content, 100),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: `alert-${alertId}`,
    data: {
      alertId,
      url: `/feed?highlight=${alertId}`,
    },
    actions: [
      { action: 'view', title: 'Voir' },
      { action: 'dismiss', title: 'Ignorer' },
    ],
  })

  // Envoyer à chaque abonnement
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const typedSub = sub as unknown as PushSubscription
      try {
        await webpush.sendNotification(
          {
            endpoint: typedSub.endpoint,
            keys: typedSub.keys,
          },
          notificationPayload
        )
        return { success: true, subscriptionId: typedSub.id }
      } catch (error) {
        // Si l'abonnement n'est plus valide, le supprimer
        if (error instanceof webpush.WebPushError && error.statusCode === 410) {
          console.log(`[Notification] Removing invalid subscription: ${typedSub.id}`)
          await supabase.from('push_subscriptions').delete().eq('id', typedSub.id)
        }
        throw error
      }
    })
  )

  const successful = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  console.log(
    `[Notification] Sent ${successful} notifications, ${failed} failed for alert ${alertId}`
  )
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}
