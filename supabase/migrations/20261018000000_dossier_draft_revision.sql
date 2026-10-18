-- Fence unpublished drafts so a save that arrives after cancel cannot recreate them.

alter table public.dossier_drafts
  add column if not exists revision bigint not null default 0;

comment on column public.dossier_drafts.revision is
  'Monotonic write fence. A save at or below this value is rejected after cancel or publish.';
