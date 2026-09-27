-- Initial Schema for VerifiedCV

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Candidates / Profiles
CREATE TABLE IF NOT EXISTS public.candidates (
    handle TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    headline TEXT,
    summary_statement TEXT,
    email TEXT,
    phone TEXT,
    linkedin TEXT,
    location TEXT,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    linkedin_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones / Chapters
CREATE TABLE IF NOT EXISTS public.milestones (
    id TEXT PRIMARY KEY,
    candidate_handle TEXT REFERENCES public.candidates(handle) ON DELETE CASCADE,
    company TEXT NOT NULL,
    role TEXT NOT NULL,
    period TEXT NOT NULL,
    location TEXT,
    claims JSONB DEFAULT '[]'::jsonb,
    calibrated_claim TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artifacts (Documents)
CREATE TABLE IF NOT EXISTS public.artifacts (
    id TEXT PRIMARY KEY,
    milestone_id TEXT REFERENCES public.milestones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registry Links (Cryptographic Anchors)
CREATE TABLE IF NOT EXISTS public.registry_links (
    id TEXT PRIMARY KEY,
    milestone_id TEXT REFERENCES public.milestones(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    label TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peer Verifications
CREATE TABLE IF NOT EXISTS public.verifications (
    id TEXT PRIMARY KEY,
    milestone_id TEXT REFERENCES public.milestones(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    linkedin_url TEXT,
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- Education
CREATE TABLE IF NOT EXISTS public.education (
    id TEXT PRIMARY KEY,
    candidate_handle TEXT REFERENCES public.candidates(handle) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    year TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    candidate_handle TEXT REFERENCES public.candidates(handle) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (Open for now for MVP)
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.candidates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.candidates FOR UPDATE USING (true);

CREATE POLICY "Allow public read access" ON public.milestones FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.milestones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.milestones FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.milestones FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.artifacts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.artifacts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON public.registry_links FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.registry_links FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON public.verifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.verifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON public.education FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.education FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON public.education FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.skills FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.skills FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON public.skills FOR DELETE USING (true);

