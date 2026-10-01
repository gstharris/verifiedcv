-- VerifiedCV live compatibility
-- Safe to run on the existing Pith/Supabase project.
-- Adds the columns and tables the app writes, without dropping Pith data.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- candidates already exists with a UUID id + handle. Add app columns.
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS summary_statement TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS linkedin_verified BOOLEAN DEFAULT false;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS linkedin_sub TEXT;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS owner_token_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS candidates_handle_uidx ON public.candidates (handle);

-- milestones already exists (empty) with UUID id + candidate_id + NOT NULL calibrated_claim.
-- App IDs are text like m-chapter-..., so widen id and add handle-scoped columns.
ALTER TABLE public.milestones ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.milestones ALTER COLUMN calibrated_claim DROP NOT NULL;
ALTER TABLE public.milestones ALTER COLUMN candidate_id DROP NOT NULL;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS candidate_handle TEXT;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS claims JSONB DEFAULT '[]'::jsonb;

DO $$ BEGIN
  ALTER TABLE public.milestones
    ADD CONSTRAINT milestones_candidate_handle_fkey
    FOREIGN KEY (candidate_handle) REFERENCES public.candidates(handle) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.artifacts (
    id TEXT PRIMARY KEY,
    milestone_id TEXT REFERENCES public.milestones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.registry_links (
    id TEXT PRIMARY KEY,
    milestone_id TEXT REFERENCES public.milestones(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verifications (
    id TEXT PRIMARY KEY,
    milestone_id TEXT REFERENCES public.milestones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    linkedin_url TEXT,
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.education (
    id TEXT PRIMARY KEY,
    candidate_handle TEXT REFERENCES public.candidates(handle) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    year TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.skills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_handle TEXT REFERENCES public.candidates(handle) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.attestations (
    token TEXT PRIMARY KEY,
    candidate_handle TEXT REFERENCES public.candidates(handle) ON DELETE CASCADE,
    milestone_id TEXT REFERENCES public.milestones(id) ON DELETE CASCADE,
    candidate_name TEXT,
    company_name TEXT NOT NULL,
    role_title TEXT,
    tenure_dates TEXT,
    claims JSONB DEFAULT '[]'::jsonb,
    attestor_email TEXT NOT NULL,
    attestor_name TEXT,
    attestor_title TEXT,
    career_years INTEGER,
    relationship TEXT,
    is_role_masked BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'PENDING',
    notes TEXT,
    endorsed_claim_ids JSONB DEFAULT '[]'::jsonb,
    cryptographic_signature TEXT,
    linkedin_sub TEXT,
    linkedin_email TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.email_codes (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.owner_codes (
    handle TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "vcv candidates select" ON public.candidates FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv candidates insert" ON public.candidates FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv candidates update" ON public.candidates FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vcv milestones select" ON public.milestones FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv milestones insert" ON public.milestones FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv milestones update" ON public.milestones FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv milestones delete" ON public.milestones FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vcv artifacts select" ON public.artifacts FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv artifacts insert" ON public.artifacts FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv artifacts delete" ON public.artifacts FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vcv registry select" ON public.registry_links FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv registry insert" ON public.registry_links FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv registry delete" ON public.registry_links FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vcv verifications select" ON public.verifications FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv verifications insert" ON public.verifications FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv verifications delete" ON public.verifications FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vcv education select" ON public.education FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv education insert" ON public.education FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv education delete" ON public.education FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vcv skills select" ON public.skills FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv skills insert" ON public.skills FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv skills delete" ON public.skills FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vcv attestations select" ON public.attestations FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv attestations insert" ON public.attestations FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv attestations update" ON public.attestations FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv attestations delete" ON public.attestations FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vcv email_codes select" ON public.email_codes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv email_codes insert" ON public.email_codes FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv email_codes update" ON public.email_codes FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv email_codes delete" ON public.email_codes FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vcv owner_codes select" ON public.owner_codes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv owner_codes insert" ON public.owner_codes FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv owner_codes update" ON public.owner_codes FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "vcv owner_codes delete" ON public.owner_codes FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON public.candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
