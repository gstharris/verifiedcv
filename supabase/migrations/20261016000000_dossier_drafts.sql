-- Unpublished Candidate Studio drafts. One row per signed-in user.
-- The public dossier stays in candidates, milestones, and the other live tables.
-- anon and authenticated have no grants and no policies. Routes use the service role.

create table if not exists public.dossier_drafts (
  auth_user_id uuid primary key references auth.users (id) on delete cascade,
  handle text,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  constraint dossier_drafts_payload_object check (jsonb_typeof(payload) = 'object')
);

alter table public.dossier_drafts enable row level security;

revoke all on table public.dossier_drafts from anon, authenticated;
grant select, insert, update, delete on table public.dossier_drafts to service_role;

comment on table public.dossier_drafts is
  'Private unpublished studio drafts. Service role only. Never selected by the public dossier.';
