-- Migration to add Supabase Auth linking to candidates table

ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- We'll keep the existing owner_token_hash for backwards compatibility and graceful degradation,
-- but auth_user_id will be the primary mechanism going forward.

-- Update RLS policies to allow users to update their own records
-- Note: We are keeping the existing open policies for now to avoid breaking the current friend test,
-- but we will enforce auth_user_id in the API route.
