import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Supabase est optionnel en mode dev (pour tester sans backend)
let supabase: SupabaseClient | null = null

if (supabaseUrl && supabaseServiceKey && !supabaseUrl.includes('placeholder')) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  console.log('✅ Supabase connected')
} else {
  console.log('⚠️ Supabase not configured - workers will run in dry-run mode')
}

export { supabase }

// Types pour les opérations DB
export interface Source {
  id: string
  name: string
  type: 'TWITTER' | 'INSTAGRAM' | 'TIKTOK' | 'RSS' | 'WEBSITE'
  url: string
  identifier: string | null
  is_active: boolean
  check_interval: number
  last_checked_at: string | null
  last_error: string | null
  metadata: Record<string, unknown> | null
  organization_id: string
  created_at: string
  updated_at: string
}

export interface Alert {
  id: string
  source_id: string
  external_id: string
  content: string
  author_name: string
  author_handle: string
  author_avatar: string | null
  permalink: string
  status: 'NEW' | 'VIEWED' | 'SAVED' | 'PUBLISHED' | 'DISMISSED'
  is_read: boolean
  is_pinned: boolean
  assigned_to_id: string | null
  detected_at: string
  posted_at: string
}

export interface Media {
  id: string
  alert_id: string
  type: 'IMAGE' | 'VIDEO' | 'GIF'
  original_url: string
  stored_url: string | null
  thumbnail: string | null
  width: number | null
  height: number | null
  duration: number | null
  size: number | null
  created_at: string
}
