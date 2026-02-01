'use client'

import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <WifiOff className="h-16 w-16 text-slate-400 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Vous êtes hors ligne
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          Vérifiez votre connexion internet et réessayez. Certaines fonctionnalités
          peuvent être limitées en mode hors ligne.
        </p>
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    </div>
  )
}
