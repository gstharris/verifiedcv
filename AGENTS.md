<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- `npm ci` is the install. When `.env.local` is missing, the Cloud Agent install writes placeholder `NEXT_PUBLIC_SUPABASE_URL=https://mock-vault.supabase.co` and `NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key-for-build`. Those values let `npm run build` prerender `/studio` and let the Supabase browser client construct. Auth, vault persistence, and corroboration email need a real Supabase project in `.env.local`.
- Dev server: `npm run dev` (hostname `0.0.0.0`, port `3000`). Checks: `npm test`, `npm run lint`, `npm run build`.
- Landing-page paste posts resume text to `POST /api/parse` and opens `/studio` from `localStorage` key `vcv_pending_payload`. That path does not call Supabase.
