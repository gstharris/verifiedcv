DO $$ BEGIN
  CREATE POLICY "vcv verifications delete" ON public.verifications FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "vcv attestations delete" ON public.attestations FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
