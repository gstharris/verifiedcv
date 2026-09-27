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

ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow public read access" ON public.attestations FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public insert access" ON public.attestations FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public update access" ON public.attestations FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public read access" ON public.email_codes FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public insert access" ON public.email_codes FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public update access" ON public.email_codes FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public delete access" ON public.email_codes FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
