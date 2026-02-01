import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import Parser from 'rss-parser'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Parser customisé pour récupérer les champs media
type CustomItem = {
  title?: string
  link?: string
  guid?: string
  pubDate?: string
  isoDate?: string
  content?: string
  contentSnippet?: string
  'content:encoded'?: string
  enclosure?: { url?: string; type?: string }
  'media:content'?: { $?: { url?: string } } | { $?: { url?: string } }[]
  'media:thumbnail'?: { $?: { url?: string } } | { $?: { url?: string } }[]
}

const parser = new Parser<Record<string, unknown>, CustomItem>({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'content:encoded'],
      ['enclosure', 'enclosure'],
    ],
  },
})

// Fonction pour extraire TOUTES les images d'un article RSS
function extractAllImagesFromRSS(item: CustomItem): string[] {
  const images: string[] = []
  const seen = new Set<string>()

  const addImage = (url: string | undefined | null) => {
    if (url && !seen.has(url) && isValidImageUrl(url)) {
      seen.add(url)
      images.push(url)
    }
  }

  // 1. Essayer enclosure (format standard)
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) {
    addImage(item.enclosure.url)
  }

  // 2. Essayer media:content (peut être un array)
  const mediaContent = item['media:content']
  if (mediaContent) {
    if (Array.isArray(mediaContent)) {
      mediaContent.forEach(m => addImage(m.$?.url))
    } else {
      addImage(mediaContent.$?.url)
    }
  }

  // 3. Essayer media:thumbnail (peut être un array)
  const mediaThumbnail = item['media:thumbnail']
  if (mediaThumbnail) {
    if (Array.isArray(mediaThumbnail)) {
      mediaThumbnail.forEach(m => addImage(m.$?.url))
    } else {
      addImage(mediaThumbnail.$?.url)
    }
  }

  // 4. Extraire TOUTES les images du contenu HTML
  const htmlContent = item['content:encoded'] || item.content || ''
  const imgMatches = htmlContent.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)
  for (const match of imgMatches) {
    addImage(match[1])
  }

  return images
}

// Vérifier si c'est une URL d'image valide
function isValidImageUrl(url: string): boolean {
  const lowUrl = url.toLowerCase()

  const excludePatterns = [
    'pixel', 'track', 'beacon', '1x1', 'spacer',
    'logo', 'icon', 'favicon', 'avatar', 'emoji',
    'button', 'badge', 'share', 'social',
    'google-analytics', 'facebook.com/tr', 'doubleclick'
  ]

  if (excludePatterns.some(p => lowUrl.includes(p))) {
    return false
  }

  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
  const hasValidExtension = validExtensions.some(ext => lowUrl.includes(ext))
  const knownImageCDNs = ['cloudinary', 'imgix', 'wp-content', 'uploads', 'images', 'media', 'cdn']
  const isFromCDN = knownImageCDNs.some(cdn => lowUrl.includes(cdn))

  return hasValidExtension || isFromCDN
}

// Interface pour les données extraites de la page
interface PageData {
  title: string
  content: string
  images: string[]
  metadata: {
    price?: string
    releaseDate?: string
    sku?: string
    colorway?: string
    brand?: string
  }
}

// Fonction pour extraire le contenu complet et les métadonnées d'une page
async function fetchPageData(url: string): Promise<PageData | null> {
  const images: string[] = []
  const seen = new Set<string>()

  // Fonction pour normaliser une URL d'image (retirer les params de redimensionnement)
  const normalizeImageUrl = (imgUrl: string): string => {
    try {
      const urlObj = new URL(imgUrl)
      // Garder seulement le chemin de base sans les params de resize
      const pathWithoutParams = urlObj.pathname
      // Créer une clé unique basée sur le domaine + chemin
      return urlObj.hostname + pathWithoutParams
    } catch {
      return imgUrl
    }
  }

  const addImage = (imgUrl: string | undefined | null) => {
    if (!imgUrl) return

    let finalUrl = imgUrl
    if (imgUrl.startsWith('//')) {
      finalUrl = 'https:' + imgUrl
    } else if (imgUrl.startsWith('/')) {
      try {
        const urlObj = new URL(url)
        finalUrl = urlObj.origin + imgUrl
      } catch { return }
    }

    if (isValidImageUrl(finalUrl)) {
      // Utiliser l'URL normalisée pour détecter les doublons
      const normalizedKey = normalizeImageUrl(finalUrl)
      if (!seen.has(normalizedKey)) {
        seen.add(normalizedKey)
        images.push(finalUrl)
      }
    }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) return null

    const html = await response.text()

    // === EXTRAIRE LE TITRE ===
    let title = ''
    // og:title
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i)
    if (ogTitleMatch) title = ogTitleMatch[1]
    // Fallback: <title>
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch) title = titleMatch[1]
    }
    // Fallback: h1
    if (!title) {
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
      if (h1Match) title = h1Match[1]
    }

    // === EXTRAIRE LE CONTENU ===
    let content = ''

    // og:description pour un résumé
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)
    if (ogDescMatch) content = ogDescMatch[1]

    // Chercher le contenu de l'article
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    const contentMatch = html.match(/<div[^>]+class=["'][^"']*(?:post-content|article-content|entry-content|content-body|article-body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)

    const articleHtml = contentMatch?.[1] || articleMatch?.[1] || mainMatch?.[1] || ''

    // Extraire les paragraphes de texte
    const paragraphs: string[] = []
    const pMatches = articleHtml.matchAll(/<p[^>]*>([^<]+(?:<[^>]+>[^<]*)*)<\/p>/gi)
    for (const match of pMatches) {
      // Nettoyer le HTML
      const text = match[1]
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      if (text.length > 20) {
        paragraphs.push(text)
      }
    }

    // Combiner le contenu
    if (paragraphs.length > 0) {
      content = paragraphs.slice(0, 5).join('\n\n') // Max 5 paragraphes
    }

    // === EXTRAIRE LES MÉTADONNÉES (prix, date, SKU, etc.) ===
    const metadata: PageData['metadata'] = {}

    // Patterns communs pour les infos sneakers
    // Prix
    const pricePatterns = [
      /(?:price|prix|msrp|retail)[:\s]*\$?(\d+(?:[.,]\d{2})?)\s*(?:usd|eur|€|\$)?/i,
      /\$(\d+(?:\.\d{2})?)/,
      /(\d+)\s*(?:€|EUR)/i,
    ]
    for (const pattern of pricePatterns) {
      const match = html.match(pattern)
      if (match) {
        metadata.price = match[1].includes('$') ? match[1] : `$${match[1]}`
        break
      }
    }

    // Date de sortie
    const datePatterns = [
      /(?:release\s*date|date\s*de\s*sortie|drops?|available|launching)[:\s]*([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4})/i,
      /(?:release\s*date|date\s*de\s*sortie)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}/i,
    ]
    for (const pattern of datePatterns) {
      const match = html.match(pattern)
      if (match) {
        metadata.releaseDate = match[1] || match[0]
        break
      }
    }

    // SKU / Style Code
    const skuPatterns = [
      /(?:sku|style\s*code|style\s*#|product\s*code)[:\s]*([A-Z0-9]{2,}-?[A-Z0-9]{2,}-?[A-Z0-9]{0,})/i,
      /(?:sku|style)[:\s]*([A-Z]{2}\d{4}-\d{3})/i,
    ]
    for (const pattern of skuPatterns) {
      const match = html.match(pattern)
      if (match) {
        metadata.sku = match[1].toUpperCase()
        break
      }
    }

    // Colorway - exclure les valeurs CSS (rgb, rgba, hex, etc.)
    const colorwayPatterns = [
      /(?:colorway|colorway:)[:\s]*["']?([A-Za-z]+(?:[\/\-\s][A-Za-z]+){0,4})["']?/i,
    ]
    for (const pattern of colorwayPatterns) {
      const match = html.match(pattern)
      if (match && match[1].length < 50 && match[1].length > 2) {
        const colorVal = match[1].trim().toLowerCase()
        // Exclure les valeurs CSS
        if (!colorVal.startsWith('rgb') && !colorVal.startsWith('#') &&
            !colorVal.includes('(') && colorVal !== 'inherit' &&
            colorVal !== 'transparent' && colorVal !== 'initial') {
          metadata.colorway = match[1].trim()
          break
        }
      }
    }

    // Brand
    const brandPatterns = [
      /\b(Nike|Adidas|Jordan|New Balance|Puma|Reebok|Converse|Vans|Asics|Yeezy)\b/i,
    ]
    for (const pattern of brandPatterns) {
      const match = html.match(pattern)
      if (match) {
        metadata.brand = match[1]
        break
      }
    }

    // === EXTRAIRE LES IMAGES ===
    // og:image
    const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    if (ogImgMatch) addImage(ogImgMatch[1])

    // twitter:image
    const twitterImgMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i)
    if (twitterImgMatch) addImage(twitterImgMatch[1])

    // Images dans l'article
    const imgMatches = articleHtml.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)
    for (const match of imgMatches) {
      addImage(match[1])
    }

    // srcset
    const srcsetMatches = articleHtml.matchAll(/srcset=["']([^"']+)["']/gi)
    for (const match of srcsetMatches) {
      const srcset = match[1]
      const urls = srcset.split(',').map(s => s.trim().split(' ')[0])
      urls.forEach(u => addImage(u))
    }

    return {
      title: decodeHTMLEntities(title),
      content: decodeHTMLEntities(content),
      images: images.slice(0, 10),
      metadata,
    }

  } catch (err) {
    return null
  }
}

// Fonction pour décoder les entités HTML
function decodeHTMLEntities(text: string): string {
  // Décoder les entités numériques &#xxx;
  let decoded = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))

  // Décoder les entités hexadécimales &#xXXX;
  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))

  // Décoder les entités nommées courantes
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
    '&ndash;': '-',
    '&mdash;': '-',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&hellip;': '...',
    '&copy;': '(c)',
    '&reg;': '(R)',
    '&trade;': '(TM)',
  }

  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'gi'), char)
  }

  return decoded.trim()
}

// Formater le contenu final avec les métadonnées
function formatContent(title: string, content: string, metadata: PageData['metadata']): string {
  const parts: string[] = []

  // Titre
  if (title) {
    parts.push(decodeHTMLEntities(title))
  }

  // Métadonnées en format lisible (seulement si valides)
  const metaParts: string[] = []

  // Valider les métadonnées avant de les ajouter
  if (metadata.sku && metadata.sku.length >= 6 && metadata.sku.length <= 20) {
    metaParts.push(`SKU: ${metadata.sku}`)
  }
  if (metadata.price && /^\$?\d+/.test(metadata.price)) {
    metaParts.push(`Price: ${metadata.price}`)
  }
  if (metadata.releaseDate && metadata.releaseDate.length > 3 && metadata.releaseDate.length < 50) {
    metaParts.push(`Release: ${metadata.releaseDate}`)
  }
  if (metadata.colorway && metadata.colorway.length > 3 && metadata.colorway.length < 40 && !/^[a-z]$/.test(metadata.colorway)) {
    metaParts.push(`Colorway: ${metadata.colorway}`)
  }

  if (metaParts.length > 0) {
    parts.push(metaParts.join(' | '))
  }

  // Contenu (description) - nettoyer et décoder
  if (content && content.length > 50) {
    const cleanContent = decodeHTMLEntities(content)
      .replace(/\s+/g, ' ')
      .trim()
    if (cleanContent.length > 50) {
      parts.push(cleanContent)
    }
  }

  return parts.join('\n\n')
}

async function refetchWithImages() {
  console.log('🧹 Cleaning old alerts and media...\n')

  const { error: deleteError } = await supabase
    .from('alerts')
    .delete()
    .neq('id', '')

  if (deleteError) {
    console.error('❌ Error deleting alerts:', deleteError)
    return
  }

  console.log('✅ Old data cleaned\n')
  console.log('🔄 Fetching all RSS sources with FULL content...\n')

  const { data: sources, error } = await supabase
    .from('sources')
    .select('*')
    .eq('is_active', true)
    .eq('type', 'RSS')

  if (error || !sources) {
    console.error('❌ Error fetching sources:', error)
    return
  }

  console.log(`📡 Found ${sources.length} sources\n`)

  let totalAlerts = 0
  let totalImages = 0

  for (const source of sources) {
    console.log(`\n--- ${source.name} ---`)
    console.log(`URL: ${source.url}`)

    try {
      const feed = await parser.parseURL(source.url)
      console.log(`✅ Feed parsed: ${feed.items.length} items`)

      let newCount = 0
      let imageCount = 0

      for (const item of feed.items.slice(0, 15)) {
        const externalId = item.guid || item.link || item.title || ''

        // Extraire les images du RSS d'abord
        let articleImages = extractAllImagesFromRSS(item)

        // Aller chercher le contenu complet sur la page
        let fullContent = item.contentSnippet || item.title || ''
        let pageMetadata: PageData['metadata'] = {}

        if (item.link) {
          console.log(`    🔍 Fetching full content: ${item.title?.substring(0, 40)}...`)
          const pageData = await fetchPageData(item.link)

          if (pageData) {
            // Utiliser le contenu de la page
            fullContent = formatContent(
              pageData.title || item.title || '',
              pageData.content,
              pageData.metadata
            )
            pageMetadata = pageData.metadata

            // Merger les images
            const seen = new Set(articleImages)
            pageData.images.forEach(img => {
              if (!seen.has(img)) {
                articleImages.push(img)
              }
            })
          }
        }

        // Limiter à 10 images max
        articleImages = articleImages.slice(0, 10)

        const { data: alertData, error: insertError } = await supabase
          .from('alerts')
          .insert({
            source_id: source.id,
            external_id: externalId,
            content: fullContent,
            author_name: feed.title || source.name,
            author_handle: new URL(source.url).hostname,
            author_avatar: feed.image?.url || null,
            permalink: item.link || source.url,
            status: 'NEW',
            is_read: false,
            is_pinned: false,
            posted_at: item.isoDate || item.pubDate || new Date().toISOString(),
          })
          .select('id')
          .single()

        if (!insertError && alertData) {
          newCount++

          if (articleImages.length > 0) {
            const mediaInserts = articleImages.map((url) => ({
              alert_id: alertData.id,
              type: 'IMAGE' as const,
              original_url: url,
            }))

            const { error: mediaError } = await supabase
              .from('media')
              .insert(mediaInserts)

            if (!mediaError) {
              imageCount += articleImages.length
              const metaInfo = pageMetadata.price || pageMetadata.releaseDate ? ' ✓ metadata' : ''
              console.log(`  📷 ${articleImages.length} imgs${metaInfo}: ${item.title?.substring(0, 35)}...`)
            }
          }
        }

        // Petit délai pour ne pas surcharger les serveurs
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      console.log(`📥 ${newCount} alerts, ${imageCount} images total`)
      totalAlerts += newCount
      totalImages += imageCount

      await supabase
        .from('sources')
        .update({ last_checked_at: new Date().toISOString(), last_error: null })
        .eq('id', source.id)

    } catch (err) {
      console.error(`❌ Error:`, err instanceof Error ? err.message : err)
      await supabase
        .from('sources')
        .update({ last_error: err instanceof Error ? err.message : 'Unknown error' })
        .eq('id', source.id)
    }
  }

  console.log('\n\n========================================')
  console.log(`🎉 Done!`)
  console.log(`   Total: ${totalAlerts} alerts, ${totalImages} images`)
  console.log('   Now with FULL content and metadata!')
  console.log('   Check http://localhost:3000/feed')
  console.log('========================================')
}

refetchWithImages()
