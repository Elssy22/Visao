-- Visao - Migration initiale
-- Script SQL pour Supabase
-- Créé automatiquement depuis le schéma Prisma

-- ==================== EXTENSIONS ====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ENUMS ====================

CREATE TYPE plan AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');
CREATE TYPE user_role AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');
CREATE TYPE source_type AS ENUM ('TWITTER', 'INSTAGRAM', 'TIKTOK', 'RSS', 'WEBSITE');
CREATE TYPE suggestion_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE alert_status AS ENUM ('NEW', 'VIEWED', 'SAVED', 'PUBLISHED', 'DISMISSED');
CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO', 'GIF');
CREATE TYPE publish_platform AS ENUM ('TWITTER');
CREATE TYPE publish_status AS ENUM ('PENDING', 'SCHEDULED', 'PUBLISHED', 'FAILED');

-- ==================== ORGANISATIONS ====================

CREATE TABLE organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- White-label (Phase 2)
  custom_domain TEXT UNIQUE,
  logo TEXT,
  primary_color TEXT DEFAULT '#3b82f6',
  secondary_color TEXT DEFAULT '#1e293b',

  -- Abonnement
  plan plan DEFAULT 'FREE',
  plan_expires_at TIMESTAMPTZ,

  -- Limites selon le plan
  max_users INTEGER DEFAULT 1,
  max_sources INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_custom_domain ON organizations(custom_domain);

-- ==================== PROFILS UTILISATEURS ====================

CREATE TABLE profiles (
  id TEXT PRIMARY KEY, -- Même ID que auth.users
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role user_role DEFAULT 'EDITOR',
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Appartenance à une organisation
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ==================== INVITATIONS ====================

CREATE TABLE invitations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  role user_role DEFAULT 'EDITOR',
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_organization_id ON invitations(organization_id);

-- ==================== PUSH SUBSCRIPTIONS ====================

CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  keys JSONB NOT NULL,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_subscriptions_profile_id ON push_subscriptions(profile_id);

-- ==================== SOURCES ====================

CREATE TABLE sources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  type source_type NOT NULL,
  url TEXT NOT NULL,
  identifier TEXT,
  is_active BOOLEAN DEFAULT true,
  check_interval INTEGER DEFAULT 60,
  last_checked_at TIMESTAMPTZ,
  last_error TEXT,

  -- Métadonnées
  metadata JSONB,

  -- Appartenance à une organisation
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, type, identifier)
);

CREATE INDEX idx_sources_type_active ON sources(type, is_active);
CREATE INDEX idx_sources_organization_id ON sources(organization_id);

-- ==================== SOURCE SUGGESTIONS ====================

CREATE TABLE source_suggestions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Qui propose
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Organisation concernée
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- La source proposée
  name TEXT NOT NULL,
  type source_type NOT NULL,
  url TEXT NOT NULL,
  reason TEXT,

  -- Statut
  status suggestion_status DEFAULT 'PENDING',
  reviewed_by_id TEXT,
  review_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_source_suggestions_org_status ON source_suggestions(organization_id, status);
CREATE INDEX idx_source_suggestions_profile_id ON source_suggestions(profile_id);

-- ==================== ALERTES ====================

CREATE TABLE alerts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

  -- Contenu original
  external_id TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  author_avatar TEXT,
  permalink TEXT NOT NULL,

  -- Statut
  status alert_status DEFAULT 'NEW',
  is_read BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,

  -- Assignation
  assigned_to_id TEXT REFERENCES profiles(id),

  detected_at TIMESTAMPTZ DEFAULT NOW(),
  posted_at TIMESTAMPTZ NOT NULL,

  UNIQUE(source_id, external_id)
);

CREATE INDEX idx_alerts_status_detected ON alerts(status, detected_at);
CREATE INDEX idx_alerts_source_id ON alerts(source_id);
CREATE INDEX idx_alerts_assigned_to_id ON alerts(assigned_to_id);

-- ==================== MEDIA ====================

CREATE TABLE media (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  alert_id TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,

  type media_type NOT NULL,
  original_url TEXT NOT NULL,
  stored_url TEXT,
  thumbnail TEXT,

  -- Métadonnées
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  size INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_alert_id ON media(alert_id);

-- ==================== SAVED CONTENTS ====================

CREATE TABLE saved_contents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  alert_id TEXT UNIQUE NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(id),

  notes TEXT,
  tags TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_contents_profile_created ON saved_contents(profile_id, created_at);

-- ==================== PUBLICATIONS ====================

CREATE TABLE publications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  alert_id TEXT REFERENCES alerts(id),
  profile_id TEXT NOT NULL REFERENCES profiles(id),

  platform publish_platform NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],

  -- Résultat
  status publish_status DEFAULT 'PENDING',
  external_id TEXT,
  external_url TEXT,
  error TEXT,

  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_publications_profile_status ON publications(profile_id, status);
CREATE INDEX idx_publications_profile_created ON publications(profile_id, created_at);

-- ==================== COMPETITORS ====================

CREATE TABLE competitors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  url TEXT,
  organization_id TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitors_organization_id ON competitors(organization_id);

-- ==================== SYSTEM CONFIG ====================

CREATE TABLE system_config (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== AUDIT LOGS ====================

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  profile_id TEXT,
  organization_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org_created ON audit_logs(organization_id, created_at);
CREATE INDEX idx_audit_logs_profile_created ON audit_logs(profile_id, created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ==================== TRIGGERS ====================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur les tables avec updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sources_updated_at
  BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==================== ROW LEVEL SECURITY (RLS) ====================

-- Activer RLS sur toutes les tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Politique pour les organisations: les utilisateurs peuvent voir leur propre organisation
CREATE POLICY "Users can view own organization"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()::text
    )
  );

-- Politique pour les profils: les utilisateurs peuvent voir les profils de leur organisation
CREATE POLICY "Users can view profiles in own organization"
  ON profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()::text
    )
  );

-- Politique pour les profils: les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid()::text);

-- Politique pour les sources: les utilisateurs peuvent voir les sources de leur organisation
CREATE POLICY "Users can view sources in own organization"
  ON sources FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()::text
    )
  );

-- Politique pour les sources: OWNER et ADMIN peuvent créer des sources
CREATE POLICY "Admins can create sources"
  ON sources FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()::text AND role IN ('OWNER', 'ADMIN', 'EDITOR')
    )
  );

-- Politique pour les alertes: les utilisateurs peuvent voir les alertes de leur organisation
CREATE POLICY "Users can view alerts in own organization"
  ON alerts FOR SELECT
  USING (
    source_id IN (
      SELECT s.id FROM sources s
      JOIN profiles p ON s.organization_id = p.organization_id
      WHERE p.id = auth.uid()::text
    )
  );

-- Politique pour les média: les utilisateurs peuvent voir les médias de leur organisation
CREATE POLICY "Users can view media in own organization"
  ON media FOR SELECT
  USING (
    alert_id IN (
      SELECT a.id FROM alerts a
      JOIN sources s ON a.source_id = s.id
      JOIN profiles p ON s.organization_id = p.organization_id
      WHERE p.id = auth.uid()::text
    )
  );

-- Politique pour les publications: les utilisateurs peuvent voir leurs publications
CREATE POLICY "Users can view own publications"
  ON publications FOR SELECT
  USING (profile_id = auth.uid()::text);

-- Politique pour les publications: les utilisateurs peuvent créer des publications
CREATE POLICY "Users can create publications"
  ON publications FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

-- Politique pour les saved_contents: les utilisateurs peuvent voir leurs contenus sauvegardés
CREATE POLICY "Users can view own saved contents"
  ON saved_contents FOR SELECT
  USING (profile_id = auth.uid()::text);

-- Politique pour les saved_contents: les utilisateurs peuvent créer des contenus sauvegardés
CREATE POLICY "Users can create saved contents"
  ON saved_contents FOR INSERT
  WITH CHECK (profile_id = auth.uid()::text);

-- Politique pour les push_subscriptions: les utilisateurs peuvent gérer leurs souscriptions
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (profile_id = auth.uid()::text);

-- ==================== FONCTION POUR CRÉER UN NOUVEAU PROFIL ====================

-- Cette fonction est appelée automatiquement quand un nouvel utilisateur s'inscrit
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id TEXT;
  org_slug TEXT;
BEGIN
  -- Générer un slug unique pour l'organisation
  org_slug := LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)), ' ', '-'));
  org_slug := org_slug || '-' || SUBSTR(gen_random_uuid()::text, 1, 8);

  -- Créer l'organisation
  INSERT INTO public.organizations (id, name, slug)
  VALUES (
    gen_random_uuid()::text,
    COALESCE(NEW.raw_user_meta_data->>'organization_name', COALESCE(NEW.raw_user_meta_data->>'name', 'Mon Organisation')),
    org_slug
  )
  RETURNING id INTO org_id;

  -- Créer le profil
  INSERT INTO public.profiles (id, email, name, role, organization_id)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    'OWNER',
    org_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement le profil
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================== VUES UTILES ====================

-- Vue pour avoir les alertes avec les infos de la source
CREATE OR REPLACE VIEW alerts_with_source AS
SELECT
  a.*,
  s.name as source_name,
  s.type as source_type,
  s.organization_id
FROM alerts a
JOIN sources s ON a.source_id = s.id;

-- Vue pour le feed (alertes récentes avec média)
CREATE OR REPLACE VIEW feed_items AS
SELECT
  a.id,
  a.content,
  a.author_name,
  a.author_handle,
  a.author_avatar,
  a.permalink,
  a.status,
  a.is_read,
  a.is_pinned,
  a.detected_at,
  a.posted_at,
  s.id as source_id,
  s.name as source_name,
  s.type as source_type,
  s.organization_id,
  COALESCE(
    (SELECT json_agg(json_build_object(
      'id', m.id,
      'type', m.type,
      'url', COALESCE(m.stored_url, m.original_url),
      'thumbnail', m.thumbnail
    ))
    FROM media m WHERE m.alert_id = a.id),
    '[]'::json
  ) as media
FROM alerts a
JOIN sources s ON a.source_id = s.id
ORDER BY a.detected_at DESC;

-- ==================== DONNÉES INITIALES ====================

-- Configuration système par défaut
INSERT INTO system_config (key, value) VALUES
  ('twitter_rate_limit', '{"requests_per_15min": 450}'::jsonb),
  ('rss_check_interval', '{"default_seconds": 300}'::jsonb),
  ('media_storage', '{"max_size_mb": 50, "allowed_types": ["image/jpeg", "image/png", "image/gif", "video/mp4"]}'::jsonb);

-- Plan limites par défaut
COMMENT ON COLUMN organizations.max_users IS 'FREE=1, STARTER=3, PRO=10, ENTERPRISE=unlimited';
COMMENT ON COLUMN organizations.max_sources IS 'FREE=3, STARTER=10, PRO=50, ENTERPRISE=unlimited';
