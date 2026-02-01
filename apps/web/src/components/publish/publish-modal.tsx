'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Twitter,
  Image as ImageIcon,
  X,
  Loader2,
  Link as LinkIcon,
  AlertCircle,
} from 'lucide-react'

interface MediaItem {
  id: string
  type: 'IMAGE' | 'VIDEO' | 'GIF'
  url: string
  thumbnail: string | null
}

interface PublishModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialContent?: string
  media?: MediaItem[]
  sourceUrl?: string
  onPublish?: (data: { content: string; mediaIds: string[]; includeLink: boolean }) => Promise<void>
}

const MAX_TWEET_LENGTH = 280
const LINK_LENGTH = 23 // Twitter raccourcit les liens à 23 caractères

export function PublishModal({
  open,
  onOpenChange,
  initialContent = '',
  media = [],
  sourceUrl,
  onPublish,
}: PublishModalProps) {
  const [content, setContent] = useState(initialContent)
  const [selectedMedia, setSelectedMedia] = useState<string[]>(media.slice(0, 4).map((m) => m.id))
  const [includeLink, setIncludeLink] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculer la longueur restante
  const linkLength = includeLink && sourceUrl ? LINK_LENGTH + 1 : 0 // +1 pour l'espace
  const remainingChars = MAX_TWEET_LENGTH - content.length - linkLength

  const handleMediaToggle = (mediaId: string) => {
    setSelectedMedia((prev) => {
      if (prev.includes(mediaId)) {
        return prev.filter((id) => id !== mediaId)
      }
      if (prev.length >= 4) {
        return prev // Max 4 médias sur Twitter
      }
      return [...prev, mediaId]
    })
  }

  const handlePublish = async () => {
    if (!onPublish) return
    if (content.length === 0 && selectedMedia.length === 0) {
      setError('Ajoutez du texte ou sélectionnez au moins un média')
      return
    }
    if (remainingChars < 0) {
      setError('Le tweet est trop long')
      return
    }

    setIsPublishing(true)
    setError(null)

    try {
      await onPublish({
        content,
        mediaIds: selectedMedia,
        includeLink,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Twitter className="h-5 w-5 text-blue-500" />
            Publier sur X
          </DialogTitle>
          <DialogDescription>
            Personnalisez votre publication avant de la partager
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Content textarea */}
          <div className="space-y-2">
            <Textarea
              placeholder="Qu'avez-vous à dire ?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={MAX_TWEET_LENGTH}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">
                {includeLink && sourceUrl && (
                  <span className="flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    Lien inclus ({LINK_LENGTH} car.)
                  </span>
                )}
              </span>
              <span
                className={`text-sm font-medium ${
                  remainingChars < 0
                    ? 'text-red-500'
                    : remainingChars < 20
                    ? 'text-yellow-500'
                    : 'text-slate-500'
                }`}
              >
                {remainingChars}
              </span>
            </div>
          </div>

          {/* Include link option */}
          {sourceUrl && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-link"
                checked={includeLink}
                onCheckedChange={(checked) => setIncludeLink(checked as boolean)}
              />
              <Label htmlFor="include-link" className="text-sm cursor-pointer">
                Inclure le lien vers la source
              </Label>
            </div>
          )}

          {/* Media selection */}
          {media.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Médias ({selectedMedia.length}/4)
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {media.map((item) => {
                  const isSelected = selectedMedia.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMediaToggle(item.id)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      <Image
                        src={item.thumbnail || item.url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                      {item.type === 'VIDEO' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Badge variant="secondary" className="text-xs">
                            Vidéo
                          </Badge>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {selectedMedia.indexOf(item.id) + 1}
                          </span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-slate-500">
                Cliquez pour sélectionner les médias à inclure (max 4)
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Aperçu
            </p>
            <div className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
              {content || <span className="italic text-slate-400">Votre tweet apparaîtra ici...</span>}
              {includeLink && sourceUrl && content && (
                <span className="text-blue-500 block mt-1">{sourceUrl}</span>
              )}
            </div>
            {selectedMedia.length > 0 && (
              <div className="flex gap-1 mt-2">
                {selectedMedia.map((id) => {
                  const m = media.find((item) => item.id === id)
                  if (!m) return null
                  return (
                    <div
                      key={id}
                      className="w-12 h-12 rounded overflow-hidden bg-slate-200 dark:bg-slate-700"
                    >
                      <Image
                        src={m.thumbnail || m.url}
                        alt=""
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing || remainingChars < 0}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <Twitter className="h-4 w-4 mr-2" />
                Publier
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
