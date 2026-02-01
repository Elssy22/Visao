'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Search,
  MoreVertical,
  Twitter,
  Instagram,
  Rss,
  Globe,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { SourceType } from '@/types/database'

interface Source {
  id: string
  name: string
  type: SourceType
  url: string
  isActive: boolean
  lastCheckedAt: string | null
  lastError: string | null
}

const sourceTypeConfig: Record<SourceType, { icon: typeof Twitter; label: string; color: string }> = {
  TWITTER: { icon: Twitter, label: 'Twitter', color: 'bg-blue-500' },
  INSTAGRAM: { icon: Instagram, label: 'Instagram', color: 'bg-pink-500' },
  TIKTOK: { icon: Globe, label: 'TikTok', color: 'bg-slate-900' },
  RSS: { icon: Rss, label: 'RSS', color: 'bg-orange-500' },
  WEBSITE: { icon: Globe, label: 'Site web', color: 'bg-green-500' },
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const supabase = createClient()

  const loadSources = async () => {
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('id, name, type, url, is_active, last_checked_at, last_error')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading sources:', error)
        return
      }

      const formattedSources: Source[] = (data || []).map(s => ({
        id: s.id,
        name: s.name,
        type: s.type as SourceType,
        url: s.url,
        isActive: s.is_active,
        lastCheckedAt: s.last_checked_at,
        lastError: s.last_error,
      }))

      setSources(formattedSources)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSources()
  }, [])

  const handleToggleActive = async (source: Source) => {
    const { error } = await supabase
      .from('sources')
      .update({ is_active: !source.isActive })
      .eq('id', source.id)

    if (!error) {
      setSources(prev => prev.map(s =>
        s.id === source.id ? { ...s, isActive: !s.isActive } : s
      ))
    }
  }

  const handleDelete = async (sourceId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette source ?')) return

    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', sourceId)

    if (!error) {
      setSources(prev => prev.filter(s => s.id !== sourceId))
    }
  }

  const filteredSources = sources.filter((source) => {
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         source.url.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' || source.type.toLowerCase() === activeTab
    return matchesSearch && matchesTab
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Sources
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {sources.length} source{sources.length > 1 ? 's' : ''} configurée{sources.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/sources/new">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une source
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Rechercher une source..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="twitter">Twitter</TabsTrigger>
            <TabsTrigger value="rss">RSS</TabsTrigger>
            <TabsTrigger value="website">Sites</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Sources list */}
      {filteredSources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Rss className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Aucune source
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm mb-4">
              Ajoutez votre première source pour commencer à recevoir des alertes
            </p>
            <Button asChild>
              <Link href="/sources/new">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une source
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onToggleActive={() => handleToggleActive(source)}
              onDelete={() => handleDelete(source.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SourceCard({
  source,
  onToggleActive,
  onDelete
}: {
  source: Source
  onToggleActive: () => void
  onDelete: () => void
}) {
  const config = sourceTypeConfig[source.type]
  const Icon = config.icon

  const formatLastChecked = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais vérifié'
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return 'À l\'instant'
    if (minutes < 60) return `Il y a ${minutes}min`
    return `Il y a ${Math.floor(minutes / 60)}h`
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${config.color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">{source.name}</CardTitle>
            <CardDescription className="text-xs truncate max-w-[180px]">
              {source.url}
            </CardDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.open(source.url, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir la source
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onToggleActive}>
              {source.isActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Mettre en pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Activer
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={source.isActive ? 'default' : 'secondary'}>
              {source.isActive ? 'Active' : 'En pause'}
            </Badge>
            {source.lastError && (
              <Badge variant="destructive" className="text-xs">Erreur</Badge>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {formatLastChecked(source.lastCheckedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
