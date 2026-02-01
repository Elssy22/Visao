'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Twitter,
  Instagram,
  Rss,
  Globe,
  Trash2,
  RotateCcw,
  Loader2,
  Clock,
  XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AlertStatus, SourceType } from '@/types/database'

interface DismissedItem {
  id: string
  content: string
  authorName: string
  authorHandle: string
  authorAvatar: string | null
  permalink: string
  detectedAt: string
  source: {
    id: string
    name: string
    type: SourceType
  }
  previewImage: string | null
}

const sourceTypeConfig: Record<SourceType, { icon: typeof Twitter; label: string; color: string; bgColor: string }> = {
  TWITTER: { icon: Twitter, label: 'Twitter', color: 'text-blue-500', bgColor: 'bg-blue-500' },
  INSTAGRAM: { icon: Instagram, label: 'Instagram', color: 'text-pink-500', bgColor: 'bg-pink-500' },
  TIKTOK: { icon: Globe, label: 'TikTok', color: 'text-slate-900', bgColor: 'bg-slate-900' },
  RSS: { icon: Rss, label: 'RSS', color: 'text-orange-500', bgColor: 'bg-orange-500' },
  WEBSITE: { icon: Globe, label: 'Site web', color: 'text-green-500', bgColor: 'bg-green-500' },
}

export default function DismissedPage() {
  const [items, setItems] = useState<DismissedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const loadDismissed = async () => {
    try {
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'DISMISSED')
        .order('detected_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error:', error)
        return
      }

      const sourceIds = [...new Set(alerts?.map(a => a.source_id) || [])]
      const { data: sourcesData } = await supabase
        .from('sources')
        .select('id, name, type')
        .in('id', sourceIds)

      const sourcesMap = new Map(sourcesData?.map(s => [s.id, s]) || [])

      const formattedItems: DismissedItem[] = (alerts || []).map(alert => {
        const source = sourcesMap.get(alert.source_id)
        return {
          id: alert.id,
          content: alert.content,
          authorName: alert.author_name,
          authorHandle: alert.author_handle,
          authorAvatar: alert.author_avatar,
          permalink: alert.permalink,
          detectedAt: alert.detected_at,
          source: {
            id: source?.id || alert.source_id,
            name: source?.name || 'Unknown',
            type: (source?.type as SourceType) || 'RSS',
          },
          previewImage: alert.author_avatar,
        }
      })

      setItems(formattedItems)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDismissed()
  }, [])

  const handleRestore = async (itemId: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'NEW' })
      .eq('id', itemId)

    if (!error) {
      setItems(prev => prev.filter(item => item.id !== itemId))
    }
  }

  const handleDeletePermanently = async (itemId: string) => {
    if (!confirm('Supprimer définitivement cette news ?')) return

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', itemId)

    if (!error) {
      setItems(prev => prev.filter(item => item.id !== itemId))
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Supprimer définitivement toutes les news refusées ?')) return

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('status', 'DISMISSED')

    if (!error) {
      setItems([])
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7) return `Il y a ${days}j`
    return date.toLocaleDateString('fr-FR')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            News Refusées
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {items.length} news dans la corbeille
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="destructive" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            Vider la corbeille
          </Button>
        )}
      </div>

      {/* List */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <XCircle className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Aucune news refusée
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
              Les news que vous refusez depuis le feed apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const sourceConfig = sourceTypeConfig[item.source.type]
            const SourceIcon = sourceConfig.icon

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4 flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {item.previewImage ? (
                      <Image
                        src={item.previewImage}
                        alt=""
                        fill
                        className="object-cover opacity-50"
                        unoptimized
                      />
                    ) : (
                      <div className={`w-full h-full ${sourceConfig.bgColor} opacity-50 flex items-center justify-center`}>
                        <SourceIcon className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        <SourceIcon className={`h-3 w-3 mr-1 ${sourceConfig.color}`} />
                        {item.source.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                      {item.content}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatDate(item.detectedAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(item.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Restaurer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePermanently(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
