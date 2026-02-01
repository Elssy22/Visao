'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Twitter,
  Instagram,
  Linkedin,
  Facebook,
  Copy,
  Check,
  Download,
  ExternalLink,
  Sparkles,
  Hash,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  CheckSquare,
  Square,
} from 'lucide-react'

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  item: {
    content: string
    permalink: string
    authorName: string
    previewImage: string | null
    media: Array<{ url: string }>
  } | null
}

type Platform = 'twitter' | 'instagram' | 'linkedin' | 'facebook'

const platformConfig: Record<Platform, {
  name: string
  icon: typeof Twitter
  color: string
  bgColor: string
  maxLength: number
  maxImages: number
}> = {
  twitter: {
    name: 'Twitter/X',
    icon: Twitter,
    color: 'text-sky-500',
    bgColor: 'bg-sky-500',
    maxLength: 280,
    maxImages: 4,
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-500',
    bgColor: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
    maxLength: 2200,
    maxImages: 10,
  },
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-700',
    bgColor: 'bg-blue-700',
    maxLength: 3000,
    maxImages: 9,
  },
  facebook: {
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600',
    maxLength: 63206,
    maxImages: 10,
  },
}

function generateText(platform: Platform, content: string, permalink: string, authorName: string): string {
  const shortContent = content.length > 200 ? content.substring(0, 197) + '...' : content

  switch (platform) {
    case 'twitter':
      return `${shortContent}\n\n🔗 ${permalink}`
    case 'instagram':
      return `${content}\n\n✨ Source: ${authorName}\n\n#sneakers #fashion #streetwear #sneakerhead #kicks #style #hypebeast`
    case 'linkedin':
      return `📰 ${content}\n\n🔗 ${permalink}\n\n#Fashion #Sneakers #Trends`
    case 'facebook':
      return `${content}\n\n👉 ${permalink}`
    default:
      return content
  }
}

const hashtagSuggestions = ['#sneakers', '#kicks', '#sneakerhead', '#sneakernews', '#fashion', '#style', '#streetwear', '#hypebeast', '#nike', '#jordan', '#adidas']

export function PublishModal({ isOpen, onClose, item }: PublishModalProps) {
  const [activePlatform, setActivePlatform] = useState<Platform>('twitter')
  const [texts, setTexts] = useState<Record<Platform, string>>({
    twitter: '',
    instagram: '',
    linkedin: '',
    facebook: '',
  })
  const [copiedText, setCopiedText] = useState(false)
  const [downloadingImages, setDownloadingImages] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set([0]))

  const allImages = item?.media.map(m => m.url) || []

  useEffect(() => {
    if (item) {
      const images = item.media.map(m => m.url)
      setTexts({
        twitter: generateText('twitter', item.content, item.permalink, item.authorName),
        instagram: generateText('instagram', item.content, item.permalink, item.authorName),
        linkedin: generateText('linkedin', item.content, item.permalink, item.authorName),
        facebook: generateText('facebook', item.content, item.permalink, item.authorName),
      })
      setCurrentImageIndex(0)
      setSelectedImages(new Set(images.length > 0 ? [0] : []))
    }
  }, [item])

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(texts[activePlatform])
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  const nextImage = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
    }
  }

  const prevImage = () => {
    if (allImages.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
    }
  }

  const toggleImageSelection = (index: number) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else if (newSelected.size < platformConfig[activePlatform].maxImages) {
      newSelected.add(index)
    }
    setSelectedImages(newSelected)
  }

  const handleDownloadSelectedImages = async () => {
    if (selectedImages.size === 0) return
    setDownloadingImages(true)
    try {
      for (const index of selectedImages) {
        const url = allImages[index]
        if (!url) continue
        try {
          const response = await fetch(url)
          const blob = await response.blob()
          const blobUrl = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = blobUrl
          a.download = `visao-${Date.now()}-${index + 1}.jpg`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(blobUrl)
          await new Promise(resolve => setTimeout(resolve, 300))
        } catch {
          window.open(url, '_blank')
        }
      }
    } catch (error) {
      console.error('Error downloading images:', error)
    }
    setDownloadingImages(false)
  }

  const addHashtag = (hashtag: string) => {
    setTexts(prev => ({
      ...prev,
      [activePlatform]: prev[activePlatform] + ' ' + hashtag,
    }))
  }

  const currentConfig = platformConfig[activePlatform]
  const currentText = texts[activePlatform]
  const isOverLimit = currentText.length > currentConfig.maxLength

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Prêt à publier
          </DialogTitle>
        </DialogHeader>

        {/* Platform tabs */}
        <div className="px-4 pt-2">
          <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v as Platform)}>
            <TabsList className="grid grid-cols-4 w-full h-9">
              {(Object.keys(platformConfig) as Platform[]).map((platform) => {
                const config = platformConfig[platform]
                const Icon = config.icon
                return (
                  <TabsTrigger key={platform} value={platform} className="gap-1.5 text-xs py-1.5">
                    <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                    <span className="hidden sm:inline">{config.name.split('/')[0]}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-4">
          {/* Left: Image gallery (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            {/* Main image with navigation */}
            <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800">
              {allImages.length > 0 ? (
                <>
                  <Image
                    src={allImages[currentImageIndex]}
                    alt={`Image ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Navigation arrows */}
                  {allImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                      {/* Dots indicator */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {allImages.slice(0, 10).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentImageIndex(i)}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              i === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                      {/* Counter */}
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
                        {currentImageIndex + 1}/{allImages.length}
                      </div>
                    </>
                  )}
                  {/* Selection checkbox */}
                  <button
                    onClick={() => toggleImageSelection(currentImageIndex)}
                    className={`absolute top-2 left-2 p-1 rounded ${
                      selectedImages.has(currentImageIndex) ? 'bg-blue-500' : 'bg-black/60'
                    }`}
                  >
                    {selectedImages.has(currentImageIndex) ? (
                      <CheckSquare className="h-4 w-4 text-white" />
                    ) : (
                      <Square className="h-4 w-4 text-white" />
                    )}
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex gap-1 overflow-x-auto pb-1">
                {allImages.slice(0, 10).map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`relative flex-shrink-0 w-12 h-12 rounded overflow-hidden ${
                      i === currentImageIndex ? 'ring-2 ring-blue-500' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <Image src={url} alt="" fill className="object-cover" unoptimized />
                    {selectedImages.has(i) && (
                      <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Download button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleDownloadSelectedImages}
              disabled={selectedImages.size === 0 || downloadingImages}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {downloadingImages ? 'Téléchargement...' : `Télécharger (${selectedImages.size})`}
            </Button>
          </div>

          {/* Right: Text editor (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            {/* Text editor */}
            <div className="relative">
              <Textarea
                value={texts[activePlatform]}
                onChange={(e) => setTexts(prev => ({ ...prev, [activePlatform]: e.target.value }))}
                className="min-h-[140px] text-sm resize-none"
                placeholder={`Écrivez votre post ${currentConfig.name}...`}
              />
              <div className={`absolute bottom-2 right-2 text-xs px-1.5 py-0.5 rounded ${
                isOverLimit ? 'bg-red-100 text-red-600' : 'text-slate-400'
              }`}>
                {currentText.length}/{currentConfig.maxLength}
              </div>
            </div>

            {/* Hashtags */}
            <div className="flex flex-wrap gap-1">
              {hashtagSuggestions.slice(0, 8).map((tag) => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => addHashtag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleCopyText} className="flex-1" size="sm">
                {copiedText ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                    Copié!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copier le texte
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(item.permalink, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Quick tips */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-600 dark:text-slate-400">
              <p className="font-medium mb-1">Pour publier :</p>
              <p>1. Sélectionnez et téléchargez les images • 2. Copiez le texte • 3. Collez sur {currentConfig.name}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
