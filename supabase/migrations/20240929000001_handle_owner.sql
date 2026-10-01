ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS owner_token_hash TEXT;

CREATE TABLE IF NOT EXISTS public.owner_codes (
    handle TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.owner_codes ENABLE ROW LEVEL SECURITY;

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
