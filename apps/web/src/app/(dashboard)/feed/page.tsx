'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Filter,
  Twitter,
  Instagram,
  Rss,
  Globe,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  X,
  Pin,
  Clock,
  RefreshCw,
  Loader2,
  Grid3X3,
  List,
  Share2,
  Send,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PublishModal } from '@/components/publish-modal'
import type { AlertStatus, SourceType } from '@/types/database'

interface FeedItem {
  id: string
  content: string
  authorName: string
  authorHandle: string
  authorAvatar: string | null
  permalink: string
  status: AlertStatus
  isRead: boolean
  isPinned: boolean
  detectedAt: string
  postedAt: string
  source: {
    id: string
    name: string
    type: SourceType
  }
  media: Array<{
    id: string
    type: 'IMAGE' | 'VIDEO' | 'GIF'
    url: string
    thumbnail: string | null
  }>
  // Image extraite de l'article (via og:image ou première image)
  previewImage: string | null
}

const sourceTypeConfig: Record<SourceType, { icon: typeof Twitter; label: string; color: string; bgColor: string }> = {
  TWITTER: { icon: Twitter, label: 'Twitter', color: 'text-blue-500', bgColor: 'bg-blue-500' },
  INSTAGRAM: { icon: Instagram, label: 'Instagram', color: 'text-pink-500', bgColor: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500' },
  TIKTOK: { icon: Globe, label: 'TikTok', color: 'text-slate-900', bgColor: 'bg-slate-900' },
  RSS: { icon: Rss, label: 'RSS', color: 'text-orange-500', bgColor: 'bg-orange-500' },
  WEBSITE: { icon: Globe, label: 'Site web', color: 'text-green-500', bgColor: 'bg-green-500' },
}

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'saved' | 'pinned'>('all')
  const [sourceFilter, setSourceFilter] = useState<SourceType | 'all'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)
  const [publishItem, setPublishItem] = useState<FeedItem | null>(null)

  const supabase = createClient()

  const loadAlerts = async () => {
    try {
      const { data: alerts, error } = await supabase
        .from('alerts')
        .select('*')
        .order('posted_at', { ascending: false })
        .limit(100)

      if (error) {
        console.error('Error loading alerts:', error.message)
        return
      }

      const sourceIds = [...new Set(alerts?.map(a => a.source_id) || [])]
      const { data: sourcesData } = await supabase
        .from('sources')
        .select('id, name, type')
        .in('id', sourceIds)

      const sourcesMap = new Map(sourcesData?.map(s => [s.id, s]) || [])

      const alertIds = alerts?.map(a => a.id) || []
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

      const items: FeedItem[] = (alerts || []).map(alert => {
        const source = sourcesMap.get(alert.source_id)
        const media = (mediaByAlert.get(alert.id) || []).map(m => ({
          id: m.id,
          type: m.type as 'IMAGE' | 'VIDEO' | 'GIF',
          url: m.stored_url || m.original_url,
          thumbnail: m.thumbnail,
        }))

        // Extraire une image de preview (première image média ou avatar)
        const previewImage = media.length > 0
          ? media[0].url
          : alert.author_avatar

        return {
          id: alert.id,
          content: alert.content,
          authorName: alert.author_name,
          authorHandle: alert.author_handle,
          authorAvatar: alert.author_avatar,
          permalink: alert.permalink,
          status: alert.status as AlertStatus,
          isRead: alert.is_read,
          isPinned: alert.is_pinned,
          detectedAt: alert.detected_at,
          postedAt: alert.posted_at,
          source: {
            id: source?.id || alert.source_id,
            name: source?.name || 'Unknown',
            type: (source?.type as SourceType) || 'RSS',
          },
          media,
          previewImage,
        }
      })

      setFeedItems(items)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadAlerts()
    setIsRefreshing(false)
  }

  const handleDismiss = async (alertId: string) => {
    // Mettre à jour le statut en DISMISSED dans Supabase
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'DISMISSED' })
      .eq('id', alertId)

    if (!error) {
      // Retirer de la liste locale
      setFeedItems(prev => prev.filter(item => item.id !== alertId))
    }
  }

  const handleSaveToggle = async (alertId: string, currentlySaved: boolean) => {
    const newStatus = currentlySaved ? 'NEW' : 'SAVED'
    const { error } = await supabase
      .from('alerts')
      .update({ status: newStatus })
      .eq('id', alertId)

    if (!error) {
      // Mettre à jour l'état local
      setFeedItems(prev => prev.map(item =>
        item.id === alertId ? { ...item, status: newStatus as AlertStatus } : item
      ))
      return true
    }
    return false
  }

  const filteredItems = feedItems.filter((item) => {
    // Exclure les news refusées du feed principal
    if (item.status === 'DISMISSED') return false

    const matchesSearch =
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.authorName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      activeFilter === 'all' ||
      (activeFilter === 'unread' && !item.isRead) ||
      (activeFilter === 'saved' && item.status === 'SAVED') ||
      (activeFilter === 'pinned' && item.isPinned)

    const matchesSource = sourceFilter === 'all' || item.source.type === sourceFilter

    return matchesSearch && matchesStatus && matchesSource
  })

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    // Trier par date de publication (plus récent en premier)
    return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  })

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Feed</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {feedItems.length} alertes de vos sources
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-lg p-1 bg-slate-100 dark:bg-slate-800">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs
          value={activeFilter}
          onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}
        >
          <TabsList>
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="unread">Non lus</TabsTrigger>
            <TabsTrigger value="saved">Sauvegardés</TabsTrigger>
            <TabsTrigger value="pinned">Épinglés</TabsTrigger>
          </TabsList>
        </Tabs>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {sourceFilter === 'all' ? 'Toutes' : sourceTypeConfig[sourceFilter].label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSourceFilter('all')}>
              Toutes les sources
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(sourceTypeConfig).map(([type, config]) => {
              const Icon = config.icon
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setSourceFilter(type as SourceType)}
                >
                  <Icon className={`h-4 w-4 mr-2 ${config.color}`} />
                  {config.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Feed Grid/List */}
      {sortedItems.length === 0 ? (
        <EmptyFeed />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {sortedItems.map((item) => (
            <GridCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
              onDismiss={() => handleDismiss(item.id)}
              onQuickPublish={() => setPublishItem(item)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedItems.map((item) => (
            <ListCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <DetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onSaveToggle={handleSaveToggle}
      />

      {/* Quick Publish Modal */}
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

function EmptyFeed() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Rss className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          Votre feed est vide
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-4">
          Ajoutez des sources pour commencer à recevoir des alertes
        </p>
        <Button asChild>
          <Link href="/sources/new">Ajouter une source</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function GridCard({ item, onClick, onDismiss, onQuickPublish }: { item: FeedItem; onClick: () => void; onDismiss: () => void; onQuickPublish: () => void }) {
  const sourceConfig = sourceTypeConfig[item.source.type]
  const SourceIcon = sourceConfig.icon

  // Générer une couleur de fond basée sur le nom de la source
  const getGradient = (name: string) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600',
      'from-indigo-500 to-blue-600',
      'from-yellow-500 to-orange-600',
    ]
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDismiss()
  }

  const handleQuickPublish = (e: React.MouseEvent) => {
    e.stopPropagation()
    onQuickPublish()
  }

  return (
    <div
      className="relative aspect-[4/3] cursor-pointer group overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-lg"
      onClick={onClick}
    >
      {/* Image ou placeholder */}
      {item.previewImage ? (
        <Image
          src={item.previewImage}
          alt={item.content.substring(0, 50)}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          unoptimized
        />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${getGradient(item.source.name)} flex items-center justify-center`}>
          <span className="text-white text-5xl font-bold opacity-50">
            {item.source.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-end opacity-0 group-hover:opacity-100">
        <div className="text-white p-3 w-full">
          <p className="text-sm font-medium line-clamp-2">{item.content.substring(0, 100)}...</p>
          <p className="text-xs text-white/70 mt-1">{item.source.name}</p>
        </div>
      </div>

      {/* Action buttons - visible on hover */}
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
        {/* Dismiss button */}
        <button
          onClick={handleDismissClick}
          className="p-1.5 rounded-full bg-black/50 hover:bg-red-500 text-white transition-colors"
          title="Refuser cette news"
        >
          <X className="h-4 w-4" />
        </button>
        {/* Quick publish Twitter button */}
        <button
          onClick={handleQuickPublish}
          className="p-1.5 rounded-full bg-black/50 hover:bg-sky-500 text-white transition-colors"
          title="Publier sur Twitter"
        >
          <Twitter className="h-4 w-4" />
        </button>
      </div>

      {/* Source badge */}
      <div className={`absolute top-2 right-2 p-1.5 rounded-full ${sourceConfig.bgColor} shadow-lg`}>
        <SourceIcon className="h-3 w-3 text-white" />
      </div>

      {/* Unread indicator */}
      {!item.isRead && (
        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-blue-500 rounded-full">
          <span className="text-xs text-white font-medium">New</span>
        </div>
      )}

      {/* Pinned indicator */}
      {item.isPinned && (
        <div className="absolute bottom-2 left-2">
          <Pin className="h-4 w-4 text-white fill-white drop-shadow-lg" />
        </div>
      )}
    </div>
  )
}

function ListCard({ item, onClick }: { item: FeedItem; onClick: () => void }) {
  const sourceConfig = sourceTypeConfig[item.source.type]
  const SourceIcon = sourceConfig.icon

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 24) return `Il y a ${hours}h`
    return date.toLocaleDateString('fr-FR')
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4 flex gap-4">
        {/* Thumbnail */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
          {item.previewImage ? (
            <Image
              src={item.previewImage}
              alt=""
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <SourceIcon className={`h-8 w-8 ${sourceConfig.color}`} />
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
            {!item.isRead && <Badge className="text-xs">Nouveau</Badge>}
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 mb-2">
            {item.content}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            {formatDate(item.detectedAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DetailModal({ item, onClose, onSaveToggle }: {
  item: FeedItem | null
  onClose: () => void
  onSaveToggle: (alertId: string, currentlySaved: boolean) => Promise<boolean>
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [lastItemId, setLastItemId] = useState<string | null>(null)

  // Dérivé de item.status
  const isSaved = item?.status === 'SAVED'

  // Reset image index when item changes (sans useEffect)
  if (item?.id && item.id !== lastItemId) {
    setLastItemId(item.id)
    setCurrentImageIndex(0)
  }

  const handleSaveClick = async () => {
    if (!item || isSaving) return
    setIsSaving(true)
    await onSaveToggle(item.id, isSaved)
    setIsSaving(false)
  }

  if (!item) return null

  const sourceConfig = sourceTypeConfig[item.source.type]
  const SourceIcon = sourceConfig.icon

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      <Dialog open={!!item} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0">
          <VisuallyHidden>
            <DialogTitle>Détail de l&apos;article</DialogTitle>
            <DialogDescription>Détails et images de l&apos;article sélectionné</DialogDescription>
          </VisuallyHidden>
          {/* Image gallery with navigation */}
          {item.media.length > 0 && (
            <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-800">
              <Image
                src={item.media[currentImageIndex]?.url || item.previewImage || ''}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
              {/* Navigation arrows */}
              {item.media.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + item.media.length) % item.media.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % item.media.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  {/* Counter */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-sm font-medium">
                    {currentImageIndex + 1}/{item.media.length}
                  </div>
                  {/* Dots indicator */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {item.media.slice(0, 10).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentImageIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="p-6">
            {/* Source info */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {item.authorAvatar ? (
                  <Image
                    src={item.authorAvatar}
                    alt={item.authorName}
                    width={40}
                    height={40}
                    className="rounded-full"
                    unoptimized
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full ${sourceConfig.bgColor} flex items-center justify-center`}>
                    <SourceIcon className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {item.authorName}
                  </p>
                  <p className="text-sm text-slate-500">{item.authorHandle}</p>
                </div>
              </div>
              <Badge variant="outline">
                <SourceIcon className={`h-3 w-3 mr-1 ${sourceConfig.color}`} />
                {item.source.name}
              </Badge>
            </div>

            {/* Content */}
            <div className="mb-4">
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {item.content}
              </p>
            </div>

            {/* Thumbnail strip for multiple images */}
            {item.media.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                {item.media.slice(0, 10).map((media, i) => (
                  <button
                    key={media.id}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden ${
                      i === currentImageIndex ? 'ring-2 ring-blue-500' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={media.url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Date */}
            <p className="text-sm text-slate-500 mb-4">
              <Clock className="h-4 w-4 inline mr-1" />
              {formatDate(item.detectedAt)}
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4 border-t">
              {/* Primary action: Publish */}
              <Button
                onClick={() => setShowPublishModal(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                Prêt à publier
              </Button>

              {/* Secondary actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={isSaved ? 'text-yellow-500' : ''}
                    onClick={handleSaveClick}
                    disabled={isSaving}
                  >
                    {isSaved ? (
                      <BookmarkCheck className="h-4 w-4 mr-1 fill-current" />
                    ) : (
                      <Bookmark className="h-4 w-4 mr-1" />
                    )}
                    {isSaving ? 'En cours...' : isSaved ? 'Sauvegardé' : 'Sauvegarder'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(item.permalink)
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Copier le lien
                  </Button>
                </div>
                <Button variant="outline" onClick={() => window.open(item.permalink, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir l&apos;original
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish Modal */}
      <PublishModal
        isOpen={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        item={{
          content: item.content,
          permalink: item.permalink,
          authorName: item.authorName,
          previewImage: item.previewImage,
          media: item.media.map(m => ({ url: m.url })),
        }}
      />
    </>
  )
}
