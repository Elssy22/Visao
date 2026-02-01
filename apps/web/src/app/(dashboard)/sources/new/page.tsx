'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Twitter, Rss, Instagram, Globe, Loader2 } from 'lucide-react'
import type { SourceType } from '@/types/database'

export default function NewSourcePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultType = searchParams.get('type') || 'twitter'

  const [activeTab, setActiveTab] = useState<string>(defaultType)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [twitterHandle, setTwitterHandle] = useState('')
  const [rssUrl, setRssUrl] = useState('')
  const [instagramHandle, setInstagramHandle] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [sourceName, setSourceName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let sourceData: { name: string; type: SourceType; url: string }

      switch (activeTab) {
        case 'twitter':
          sourceData = {
            name: sourceName || `@${twitterHandle}`,
            type: 'TWITTER',
            url: twitterHandle.startsWith('@') ? twitterHandle : `@${twitterHandle}`,
          }
          break
        case 'rss':
          sourceData = {
            name: sourceName || new URL(rssUrl).hostname,
            type: 'RSS',
            url: rssUrl,
          }
          break
        case 'instagram':
          sourceData = {
            name: sourceName || `@${instagramHandle}`,
            type: 'INSTAGRAM',
            url: instagramHandle.startsWith('@') ? instagramHandle : `@${instagramHandle}`,
          }
          break
        case 'website':
          sourceData = {
            name: sourceName || new URL(websiteUrl).hostname,
            type: 'WEBSITE',
            url: websiteUrl,
          }
          break
        default:
          throw new Error('Type de source invalide')
      }

      // TODO: Appeler l'API pour créer la source
      console.log('Creating source:', sourceData)

      // Simuler un délai
      await new Promise((resolve) => setTimeout(resolve, 1000))

      router.push('/sources')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/sources">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux sources
        </Link>
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Ajouter une source
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Choisissez le type de source que vous souhaitez surveiller
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="twitter" className="flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                <span className="hidden sm:inline">Twitter</span>
              </TabsTrigger>
              <TabsTrigger value="rss" className="flex items-center gap-2">
                <Rss className="h-4 w-4" />
                <span className="hidden sm:inline">RSS</span>
              </TabsTrigger>
              <TabsTrigger value="instagram" className="flex items-center gap-2">
                <Instagram className="h-4 w-4" />
                <span className="hidden sm:inline">Instagram</span>
              </TabsTrigger>
              <TabsTrigger value="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Site</span>
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-lg">
                  {error}
                </div>
              )}

              <TabsContent value="twitter" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="twitter-handle">Compte Twitter</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 text-sm">
                      @
                    </span>
                    <Input
                      id="twitter-handle"
                      placeholder="SneakerNews"
                      className="rounded-l-none"
                      value={twitterHandle}
                      onChange={(e) => setTwitterHandle(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Entrez le nom d&apos;utilisateur Twitter sans le @
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="rss" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="rss-url">URL du flux RSS</Label>
                  <Input
                    id="rss-url"
                    type="url"
                    placeholder="https://example.com/feed.xml"
                    value={rssUrl}
                    onChange={(e) => setRssUrl(e.target.value)}
                    required
                  />
                  <p className="text-xs text-slate-500">
                    L&apos;URL complète du flux RSS ou Atom
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="instagram" className="space-y-4 mt-0">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Note :</strong> Instagram nécessite une configuration supplémentaire (Apify).
                    Cette fonctionnalité sera bientôt disponible.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram-handle">Compte Instagram</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 text-sm">
                      @
                    </span>
                    <Input
                      id="instagram-handle"
                      placeholder="hypebeast"
                      className="rounded-l-none"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value)}
                      disabled
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="website" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="website-url">URL du site web</Label>
                  <Input
                    id="website-url"
                    type="url"
                    placeholder="https://example.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Le site sera surveillé pour détecter les nouveaux contenus
                  </p>
                </div>
              </TabsContent>

              {/* Common fields */}
              <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="source-name">Nom de la source (optionnel)</Label>
                <Input
                  id="source-name"
                  placeholder="Mon nom personnalisé"
                  value={sourceName}
                  onChange={(e) => setSourceName(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Laissez vide pour utiliser le nom par défaut
                </p>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" asChild>
                  <Link href="/sources">Annuler</Link>
                </Button>
                <Button type="submit" disabled={loading || activeTab === 'instagram'}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Ajouter la source
                </Button>
              </div>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
