# VerifiedCV Project Context & Architecture

## 1. Route Map
- `src/app/page.tsx` (`/`): Landing page with conversational ingress, candidate vs. recruiter perspective switcher, strategic resume placement strip, and multi-line safe textarea that passes payload to `/studio` via `sessionStorage`.
- `src/app/studio/page.tsx` (`/studio`):
  - **Left (fixed 320px):** CV Ally Copilot with interactive prompt suggestions (`Validate Achievements`, `Request Peer Corroboration`, `Confirm LinkedIn URL`).
  - **Right (Full Canvas):** Compact Trust Spectrum scorecard, Candidate Identity & Contact Verification Strip (Email, Phone, LinkedIn, Location), and editable milestone cards with atomic claim items.
- `src/app/[handle]/page.tsx` (`/[handle]`): Hosted forensic candidate dossier reflecting Vault ground truth with client session hydration fallback.
- `src/app/api/parse/route.ts` (`/api/parse`): Multimodal ingestion engine powered by `unpdf`.
- `src/app/api/vault/route.ts` (`/api/vault`): Dossier persistence and retrieval endpoint.
- `src/app/api/vault/check/route.ts` (`/api/vault/check`): Real-time handle availability verification endpoint.

---

## 2. Bug Graveyard (Resolved Edge Cases — Do Not Regress)
1. **Google Docs Bullet Clusters:** Google Docs exports all bullet symbols in a cluster above paragraph text. The parser uses sentence termination and action verbs (`Direct`, `Designed`, `Built`, `Scale`, etc.) to split paragraphs into atomic claims.
2. **Binary PDF Byte Scrambling:** Client-side binary decoding produced corrupted text streams. Modern compressed PDFs must be parsed server-side via `unpdf`.
3. **Compound Title & Slash Truncation:** Headers are parsed by extracting pipe tokens (`split('|')`) and trimming without stripping slashes or hyphens.
4. **Missing Lucide Icon Build Failures:** `Linkedin` was removed from `lucide-react` imports and replaced with `LinkedInIcon` SVG.
5. **Dossier Availability 404:** Fixed by casing-normalization (`toLowerCase().trim()`) and local session hydration fallback in `[handle]/page.tsx`.

---

## 3. Current Phase: Test-Driven Development (TDD)
- Install Vitest (`vitest`, `@vitejs/plugin-react`).
- Establish `src/app/api/parse/parse.test.ts` to test parser edge cases against canonical resumes.
- Eliminate manual browser-testing overhead for parsing and tokenization.
