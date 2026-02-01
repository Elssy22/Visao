'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  MoreVertical,
  Twitter,
  Instagram,
  Rss,
  Globe,
  Bookmark,
  BookmarkX,
  ExternalLink,
  Clock,
  Tag,
  Loader2,
  Send,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PublishModal } from '@/components/publish-modal'
import type { SourceType } from '@/types/database'

interface SavedItem {
  id: string
  content: string
  authorName: string
  authorHandle: string
  authorAvatar: string | null
  permalink: string
  savedAt: string
  notes: string | null
  tags: string[]
  source: {
    id: string
    name: string
    type: SourceType
  }
  media: Array<{
    id: string
    type: 'IMAGE' | 'VIDEO' | 'GIF'
    url: string
  }>
  previewImage: string | null
}

const sourceTypeConfig: Record<SourceType, { icon: typeof Twitter; label: string; color: string }> = {
  TWITTER: { icon: Twitter, label: 'Twitter', color: 'bg-blue-500' },
  INSTAGRAM: { icon: Instagram, label: 'Instagram', color: 'bg-pink-500' },
  TIKTOK: { icon: Globe, label: 'TikTok', color: 'bg-slate-900' },
  RSS: { icon: Rss, label: 'RSS', color: 'bg-orange-500' },
  WEBSITE: { icon: Globe, label: 'Site web', color: 'bg-green-500' },
}

export default function SavedPage() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [publishItem, setPublishItem] = useState<SavedItem | null>(null)

  const supabase = createClient()

  const loadSavedItems = async () => {
    try {
      // Charger les alertes avec le statut SAVED
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('status', 'SAVED')
        .order('detected_at', { ascending: false })

      if (error) {
        console.error('Error loading saved alerts:', error.message)
        return
      }

      if (!alerts || alerts.length === 0) {
        setSavedItems([])
        return
      }

      // Charger les sources
      const sourceIds = [...new Set(alerts.map(a => a.source_id))]
      const { data: sourcesData } = await supabase
        .from('sources')
        .select('id, name, type')
        .in('id', sourceIds)

      const sourcesMap = new Map(sourcesData?.map(s => [s.id, s]) || [])

      // Charger les médias
      const alertIds = alerts.map(a => a.id)
      const { data: mediaData } = await supabase
        .from('media')
        .select('*')
        .in('alert_id', alertIds)

      const mediaByAlert = new Map<string, typeof mediaData>()
      mediaData?.forEach(m => {
        const existing = mediaByAlert.get(m.alert_id) || []
        existing.push(m)
        mediaByAlert.set(m.alert_id, existing)
      })

      // Formater les items
      const items: SavedItem[] = alerts.map(alert => {
        const source = sourcesMap.get(alert.source_id)
        const media = (mediaByAlert.get(alert.id) || []).map(m => ({
          id: m.id,
          type: m.type as 'IMAGE' | 'VIDEO' | 'GIF',
          url: m.stored_url || m.original_url,
        }))

        const previewImage = media.length > 0 ? media[0].url : alert.author_avatar

        return {
          id: alert.id,
          content: alert.content,
          authorName: alert.author_name,
          authorHandle: alert.author_handle,
          authorAvatar: alert.author_avatar,
          permalink: alert.permalink,
          savedAt: alert.detected_at,
          notes: null,
          tags: [],
          source: {
            id: source?.id || alert.source_id,
            name: source?.name || 'Unknown',
            type: (source?.type as SourceType) || 'RSS',
          },
          media,
          previewImage,
        }
      })

      setSavedItems(items)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSavedItems()
  }, [])

  // Extraire tous les tags uniques
  const allTags = Array.from(new Set(savedItems.flatMap((item) => item.tags)))

  const filteredItems = savedItems.filter((item) => {
    const matchesSearch =
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTag = !selectedTag || item.tags.includes(selectedTag)

    return matchesSearch && matchesTag
  })

  const handleRemoveSaved = async (id: string) => {
    // Remettre le statut à NEW
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'NEW' })
      .eq('id', id)

    if (!error) {
      setSavedItems((prev) => prev.filter((item) => item.id !== id))
    }
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
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Contenus sauvegardés
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {savedItems.length} article{savedItems.length > 1 ? 's' : ''} sauvegardé{savedItems.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher dans les sauvegardés..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tags filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTag === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTag(null)}
            >
              Tous
            </Button>
            {allTags.map((tag) => (
              <Button
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(tag)}
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Saved items */}
      {filteredItems.length === 0 ? (
        <EmptySaved hasSearch={searchQuery !== '' || selectedTag !== null} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <SavedCard
              key={item.id}
              item={item}
              onRemove={() => handleRemoveSaved(item.id)}
              onPublish={() => setPublishItem(item)}
            />
          ))}
        </div>
      )}

      {/* Publish Modal */}
      <PublishModal
        isOpen={!!publishItem}
        onClose={() => setPublishItem(null)}
        item={publishItem ? {
          content: publishItem.content,
          permalink: publishItem.permalink,
          authorName: publishItem.authorName,
          previewImage: publishItem.previewImage,
          media: publishItem.media.map(m => ({ url: m.url })),
        } : null}
      />
    </div>
  )
}

function EmptySaved({ hasSearch }: { hasSearch: boolean }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Bookmark className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          {hasSearch ? 'Aucun résultat' : 'Aucun contenu sauvegardé'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-4">
          {hasSearch
            ? 'Essayez de modifier votre recherche'
            : 'Sauvegardez des alertes depuis le feed pour les retrouver ici'}
        </p>
        {!hasSearch && (
          <Button asChild>
            <Link href="/feed">Aller au feed</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function SavedCard({ item, onRemove, onPublish }: { item: SavedItem; onRemove: () => void; onPublish: () => void }) {
  const sourceConfig = sourceTypeConfig[item.source.type]
  const SourceIcon = sourceConfig.icon

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <Card className="overflow-hidden">
      {/* Media preview */}
      {item.previewImage && (
        <div className="relative h-40 bg-slate-100 dark:bg-slate-800">
          <Image
            src={item.previewImage}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
          {item.media.length > 1 && (
            <div className="absolute bottom-2 right-2">
              <Badge variant="secondary">+{item.media.length - 1}</Badge>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${sourceConfig.color}`}>
              <SourceIcon className="h-3 w-3 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm text-slate-900 dark:text-white truncate">
                {item.authorName}
              </p>
              <p className="text-xs text-slate-500 truncate">{item.authorHandle}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.open(item.permalink, '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir l&apos;original
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onPublish}>
                <Send className="h-4 w-4 mr-2" />
                Prêt à publier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRemove} className="text-red-600">
                <BookmarkX className="h-4 w-4 mr-2" />
                Retirer des sauvegardés
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 mb-3">
          {item.content}
        </p>

        {/* Notes */}
        {item.notes && (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg mb-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200 line-clamp-2">
              <span className="font-medium">Note :</span> {item.notes}
            </p>
          </div>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            {formatDate(item.savedAt)}
          </span>
          <Badge variant="outline" className="text-xs">
            {item.source.name}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
