'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PushState {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    error: null,
  })

  // Vérifier le support et l'état actuel
  useEffect(() => {
    const checkSupport = async () => {
      // Vérifier si les notifications sont supportées
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState((s) => ({
          ...s,
          isSupported: false,
          isLoading: false,
          error: 'Les notifications push ne sont pas supportées sur ce navigateur',
        }))
        return
      }

      try {
        // Enregistrer le service worker
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('[Push] Service worker registered:', registration.scope)

        // Vérifier s'il y a déjà un abonnement
        const subscription = await registration.pushManager.getSubscription()

        setState({
          isSupported: true,
          isSubscribed: !!subscription,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        console.error('[Push] Error checking support:', error)
        setState({
          isSupported: false,
          isSubscribed: false,
          isLoading: false,
          error: 'Erreur lors de la vérification du support',
        })
      }
    }

    checkSupport()
  }, [])

  // S'abonner aux notifications
  const subscribe = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }))

    try {
      // Demander la permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: 'Permission refusée',
        }))
        return false
      }

      // Récupérer le service worker
      const registration = await navigator.serviceWorker.ready

      // Récupérer la clé publique VAPID
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured')
      }

      // Convertir la clé en Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

      // Créer l'abonnement
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
      })

      console.log('[Push] Subscription created:', subscription)

      // Envoyer l'abonnement au serveur
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error: dbError } = await supabase.from('push_subscriptions').insert({
        profile_id: user.id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: arrayBufferToBase64(subscription.getKey('auth')),
        },
        user_agent: navigator.userAgent,
      })

      if (dbError) {
        throw dbError
      }

      setState((s) => ({
        ...s,
        isSubscribed: true,
        isLoading: false,
        error: null,
      }))

      return true
    } catch (error) {
      console.error('[Push] Subscribe error:', error)
      setState((s) => ({
        ...s,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'abonnement',
      }))
      return false
    }
  }, [])

  // Se désabonner des notifications
  const unsubscribe = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Supprimer de la base de données
        const supabase = createClient()
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint)

        // Désabonner
        await subscription.unsubscribe()
      }

      setState((s) => ({
        ...s,
        isSubscribed: false,
        isLoading: false,
        error: null,
      }))

      return true
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error)
      setState((s) => ({
        ...s,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erreur lors du désabonnement',
      }))
      return false
    }
  }, [])

  return {
    ...state,
    subscribe,
    unsubscribe,
  }
}

// Helpers
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}
