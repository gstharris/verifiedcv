CREATE TABLE IF NOT EXISTS public.portfolio_assets (
    id TEXT PRIMARY KEY,
    candidate_handle TEXT NOT NULL REFERENCES public.candidates(handle) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    type TEXT NOT NULL,
    issuer TEXT,
    issued_at TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified',
    verification_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portfolio_assets_handle_idx ON public.portfolio_assets(candidate_handle);

ALTER TABLE public.portfolio_assets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow public read access" ON public.portfolio_assets FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public insert access" ON public.portfolio_assets FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public update access" ON public.portfolio_assets FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Allow public delete access" ON public.portfolio_assets FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-assets', 'portfolio-assets', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "Public read portfolio assets"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'portfolio-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Public insert portfolio assets"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'portfolio-assets');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
