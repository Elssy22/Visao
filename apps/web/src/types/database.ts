// Types pour la base de données Supabase
// Ces types seront générés automatiquement par Supabase CLI plus tard

export type UserRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER'
export type Plan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
export type SourceType = 'TWITTER' | 'INSTAGRAM' | 'TIKTOK' | 'RSS' | 'WEBSITE'
export type AlertStatus = 'NEW' | 'VIEWED' | 'SAVED' | 'PUBLISHED' | 'DISMISSED'
export type MediaType = 'IMAGE' | 'VIDEO' | 'GIF'
export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type PublishPlatform = 'TWITTER'
export type PublishStatus = 'PENDING' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED'

export interface Organization {
  id: string
  name: string
  slug: string
  customDomain: string | null
  logo: string | null
  primaryColor: string | null
  secondaryColor: string | null
  plan: Plan
  planExpiresAt: string | null
  maxUsers: number
  maxSources: number
  createdAt: string
  updatedAt: string
}

export interface Profile {
  id: string
  email: string
  name: string | null
  role: UserRole
  avatar: string | null
  isActive: boolean
  organizationId: string
  organization?: Organization
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

export interface Source {
  id: string
  name: string
  type: SourceType
  url: string
  identifier: string | null
  isActive: boolean
  checkInterval: number
  lastCheckedAt: string | null
  lastError: string | null
  metadata: Record<string, unknown> | null
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface Alert {
  id: string
  sourceId: string
  source?: Source
  externalId: string
  content: string
  authorName: string
  authorHandle: string
  authorAvatar: string | null
  permalink: string
  media?: Media[]
  status: AlertStatus
  isRead: boolean
  isPinned: boolean
  assignedToId: string | null
  assignedTo?: Profile
  savedContent?: SavedContent
  detectedAt: string
  postedAt: string
}

export interface Media {
  id: string
  alertId: string
  type: MediaType
  originalUrl: string
  storedUrl: string | null
  thumbnail: string | null
  width: number | null
  height: number | null
  duration: number | null
  size: number | null
  createdAt: string
}

export interface SavedContent {
  id: string
  alertId: string
  profileId: string
  notes: string | null
  tags: string[]
  createdAt: string
}

export interface SourceSuggestion {
  id: string
  profileId: string
  profile?: Profile
  organizationId: string
  name: string
  type: SourceType
  url: string
  reason: string | null
  status: SuggestionStatus
  reviewedById: string | null
  reviewNote: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface Publication {
  id: string
  alertId: string | null
  alert?: Alert
  profileId: string
  profile?: Profile
  platform: PublishPlatform
  content: string
  mediaUrls: string[]
  status: PublishStatus
  externalId: string | null
  externalUrl: string | null
  error: string | null
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
}
