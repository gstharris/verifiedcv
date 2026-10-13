# VerifiedCV strategy

Source: strategy notes from 10 October 2026. This file is the product decision source. The companion teardown is `docs/product-teardown.md`. Engineering guardrails in `.cursorrules` still govern how code is written.

## Overview

VerifiedCV should launch as a candidate-first platform that gives any candidate a live, polished public dossier immediately after resume upload, content review, save, and authentication. The initial value is ownership of a shareable slug such as `verifiedcv.app/gharris`. The long-term value is a portable trust layer that gets stronger over time through identity checks, portfolio depth, credentials, and peer corroboration.

The strategic distinction is not another verification tool for recruiters. VerifiedCV should be the candidate-owned professional profile that recruiters discover through shared links, then later become a recruiter workflow and ATS signal once the candidate network and trust graph are established.

## Positioning

VerifiedCV is a professional profile a candidate owns, with proof attached. Frame it as a universal product for anyone whose story needs more than a PDF: product managers, engineers, designers, marketers, nurses, truckers, students, tradespeople, and credential-heavy professionals.

The message should be “one link for identity, work, credentials, and what you built.” It should not be “for non-engineers.”

VerifiedCV sits between three categories:

| Category | What they emphasize | VerifiedCV response |
| --- | --- | --- |
| Employer-first verification vendors | Formal verification of identity, employment, education, and credentials for hiring teams. | Match selected trust layers, but remain candidate-first. |
| Credential wallets | Portable verified records and digital credentials. | Add richer dossiers, peer corroboration, and role-flexible portfolio content. |
| Proof-of-skill platforms | Identity plus work proof like videos or samples. | Make portfolios and artifacts first-class for many role types, not only frontline or video-first roles. |

The strongest near-term wedge is: candidate-owned dossier + rich portfolio + chapter-level corroboration + future recruiter readability.

## Product principles

1. **Instant first value.** The dossier goes live immediately after the minimum publish path: upload resume, review parsed contents, save, authenticate, and claim the slug. This is the first-value event and should happen fast.
2. **No hard verification gates.** Publishing is never blocked by missing verification. A candidate should be able to look good on day one. Verification, corroboration, and credentials strengthen the profile over time.
3. **Activation is not publish.** “Slug created” is not real activation. The predictive activation milestone is the first corroboration request sent, because that improves candidate value and drives distribution through the collaborator loop.
4. **Portfolio first, proof layered in.** The emotional reason to use VerifiedCV is a better professional home than a PDF, and often a better portfolio object than LinkedIn. Trust features make the portfolio more credible. They should not overshadow it.
5. **Progressive disclosure everywhere.** Hide complexity and reveal only the next best action. The candidate should not have to understand the full trust model up front.

## Trust model

Maintain a richer internal proof taxonomy than the public page exposes. That leaves room for later ATS and recruiter integrations without cluttering the dossier.

### Internal trust ladder

1. Baseline identity and contact: email, phone, LinkedIn.
2. Public consistency: personal site, GitHub, portfolio links, public profiles, credential URLs.
3. Issuer and public-record evidence: certifications, licenses, patents, alumni pages, digital credentials.
4. Corroborated employment: work email, employment documents, colleague overlap confirmation.
5. Deep corroboration: achievement-level confirmation and richer relationship evidence.

### Public trust model

The dossier stays visually restrained. The public experience uses a small number of readable states and only rewards added proof. It does not punish candidates for being early.

- The profile is live and polished by default.
- The header shows a simple trust summary, such as identity confirmed, corroborated chapters, and work samples.
- Each chapter shows one simple state, for example base profile, corroborated, or multi-source.
- Proof details live behind hover, tap, or a drawer.

### Terminology

Avoid public language that overstates certainty, especially when only one source is present or the evidence is candidate-supplied. Use “Verified” only where the evidence supports it.

Safer language:

- Identity confirmed
- Corroborated
- Multi-source
- Candidate-provided
- Issuer-linked
- License or credential linked

### Education

Include education at launch, in layers. OCR on a diploma, transcript, certificate, or alumni record is useful evidence. It is not institution-confirmed verification unless VerifiedCV checks an institutional source.

| Level | What it means | Cost profile |
| --- | --- | --- |
| Candidate-entered education | User-supplied school, degree, dates | Very low cost |
| OCR-read diploma, transcript, or certificate | Document fields extracted and checked for consistency | Low cost |
| Public or issuer-linked evidence | Alumni page, digital credential, school-hosted record | Low cost |
| Institution-confirmed verification | Registry or source-backed verification | Higher cost, later |

The same ladder applies to certifications, licenses, and other portable credentials.

## Candidate journey

### Launch flow

1. Upload resume.
2. Review parsed content and fix errors.
3. Save and authenticate.
4. Slug goes live immediately.
5. The assistant recommends the next best action: verify email, verify phone, verify LinkedIn, add a work sample, add education proof, send a corroboration request, or preview a better layout.

### Activation milestones

| Milestone | Why it matters |
| --- | --- |
| Slug claimed and page live | First value. The user owns a public dossier. |
| Baseline identity completed | Stronger trust and a cleaner recruiter impression. |
| First work sample or credential added | The portfolio becomes more useful. |
| Education and credential proof added | Portable credentials start to accumulate. |
| First corroboration request sent | True activation, and the start of the network loop. |
| First corroboration completed | Core trust value realized. |
| Corroborator becomes a candidate | The network effect begins. |

Nudge candidates hard to send at least one corroboration request. Never block publishing if they decline. The best post-publish prompt is some variant of: make one chapter more believable by asking someone who worked with you.

## Corroboration model

Relationship types stay structured and visible in metadata, even when names stay private by default. A recruiter should be able to tell whether support came from a former manager, peer, cross-functional partner, direct report, or another relationship.

Achievement corroboration is separate from employment corroboration. Employment says this person worked here. Achievement corroboration says this person contributed to these specific things.

## Assistant strategy

The always-visible assistant is the orchestration engine. It is a product concierge with short prompts, one-click next steps, and visible progress. It is not an open-ended chatbot.

Jobs:

- Tell the candidate the best next action.
- Explain why a verification matters.
- Suggest which chapter to corroborate first.
- Recommend which template best fits the user’s role.
- Re-engage when a new proof type becomes available.
- Turn weak resume bullets into stronger case-study or work-sample content.

Rules:

- One primary call to action per session.
- Secondary options behind progressive disclosure.
- Push the next step inside the studio.
- Base the recommendation on current dossier gaps.

## Competitive strategy

Do not match every employer-first verification feature on day one.

| Area | Launch stance |
| --- | --- |
| Email, phone, LinkedIn | Cover now. |
| Employment corroboration | Cover now with work email, document upload, and colleague confirmation. |
| Education proof | Cover now with OCR and issuer or public-link evidence. Do not overstate source verification. |
| Certifications and licenses | Cover now with public or issuer-linked evidence where possible. |
| Formal institutional verification | Defer until a clear buyer emerges. |
| Recruiter workflow and ATS | Defer. This is the monetization layer after the candidate network exists. |
| Portfolio richness | Differentiate. |
| Peer corroboration loop | Differentiate. |

The core difference is candidate-first sequencing: candidates get immediate value now. Recruiter and ATS monetization come later.

## Monetization path

Monetization follows candidate adoption. Stay free for candidates at launch.

1. Free candidate profiles and basic verification.
2. Optional candidate premium later: advanced templates, analytics, richer portfolio presentation.
3. Recruiter features later: saved dossiers, team notes, compare mode, custom trust summaries, request-verification workflows.
4. ATS or screening integrations once the evidence model is mature.

The earliest proof of the business is recruiter engagement on shared links, not candidate willingness to pay.

## Metrics

Measure the product loop, not vanity counts.

- Publish rate: upload to live slug.
- Identity completion rate: live slug to email, phone, and LinkedIn confirmation.
- Portfolio enrichment rate: live slug to first work sample or credential.
- Activation rate: live slug to first corroboration request sent.
- Corroboration completion rate: request sent to confirmation completed.
- Loop conversion rate: corroborator to new profile created.
- Retention differential: users with corroboration versus users without.

## Next 90 days

### Immediate launch priorities

- Keep the publish path extremely fast.
- Tighten wording so public claims match actual checks.
- Instrument corroboration completion and loop metrics.
- Improve portfolio and work-sample presentation.
- Use the assistant to drive the next best action.
- Add structured education and credential proof.
- Add better chapter-level evidence drawers.
- Add role-aware templates, starting with PM and adjacent knowledge-worker templates.
- Improve collaborator invitations and completion.
- Strengthen public and private storage and the database policies identified in the beta review.

### Future monetization priorities

- Recruiter save and share flows.
- A recruiter summary card or hiring-brief export.
- Team workflows and simple integrations.
- An ATS trust flag or structured export once the evidence model is stable.

## Conclusion

VerifiedCV’s path is the candidate-owned dossier that looks good immediately, gets stronger through guided proof, and grows through collaborator loops until recruiter demand and monetization are obvious.
