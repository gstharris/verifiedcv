# VerifiedCV product teardown

Source: teardown notes from 10 October 2026. This file is the current-product assessment and the change list. Product decisions live in `docs/strategy.md`. Where they overlap, the strategy file wins on direction and this file wins on what to change in the current build.

## Overview

VerifiedCV already has the bones of a strong product: a candidate studio, chapter-level verification choices, a colleague attestation flow, public dossiers, and a portfolio concept. The product is beyond concept stage. The immediate work is sharpening semantics, simplifying the candidate path, and making the network loop measurable.

## What is working

- **The core object is right.** A persistent public dossier is a better long-term object than a resume export. It can accumulate trust, artifacts, and corroboration across job changes.
- **Chapter-level proof is directionally smart.** Attaching proof to a work-history chapter is better than a single “verified person” badge. Readers evaluate different claims at different confidence levels.
- **The candidate flow is real.** Upload, editing, verification options, colleague invite, document upload, and public viewing already form a coherent loop.
- **Peer corroboration is the wedge.** The colleague confirmation flow can turn trust-building into distribution, which is how VerifiedCV differs from employer-side verification tools.

## Core product problems

1. **Trust semantics are stronger than the checks.** Email, LinkedIn, work email, colleague confirmation, and public-link checks can look equally certain. Readers will infer certainty the system has not earned.
2. **Portfolio value is underpowered.** The product says “dossier,” but work samples can still read like a form field. Candidates tolerate verification friction only if the page looks materially better than LinkedIn or a PDF.
3. **Activation can collapse into a hosted resume.** If people upload, save, and stop, the trust network never starts. Instrumentation has to show movement from live page to corroboration request and completion.
4. **The recruiter side is a reading surface.** That is acceptable for beta. Until there is a thin recruiter workflow, growth has to come from candidate-side value and peer loops.

## Recommended changes

1. **Reframe the product.** Move from “verified resume” to “candidate-owned professional profile with portfolio and proof attached.” Keep it universal. Portfolio depth varies by role. The container is the same.
2. **Keep the publish path fast.** The dossier goes live after upload, parse review, save, and authentication.
3. **Separate first value from activation.**
   - First value: slug live.
   - Activation: first corroboration request sent.
   - Core value realized: first corroboration received.
   - Network effect: corroborator creates a profile.
4. **Make trust additive, not punitive.** A new profile looks strong by default. Missing verification does not produce warning labels. The public page only rewards added proof.
5. **Replace badge sprawl with a restrained trust system.** A minimal trust summary in the header, one simple state per chapter, and expandable evidence details when a reader asks.
6. **Use richer internal proof types than the public UI shows.** Distinguish identity confirmation, contact validation, consistency checks, issuer-linked credentials, employment corroboration, and deep corroboration. Simplify those for the reader.
7. **Add education proof now, and label it carefully.** OCR on diplomas, transcripts, certificates, and alumni records is useful. Do not present it as registry-confirmed or institution-confirmed verification unless the product actually checks that source.
8. **Make the assistant the orchestration layer.** One recommended next action at a time, instead of exposing every verification and portfolio option at once.
9. **Treat corroboration as the network loop.** Publishing stays open. Nudge hard toward at least one corroboration request.
10. **Stay candidate-first while planning recruiter monetization.** Match useful baseline trust categories. Lead with the portfolio and the public dossier. Use peer corroboration for growth. Delay heavyweight recruiter workflow and formal verification breadth until demand is visible.

## Screen-specific observations

- **Upload and save.** Keep the path short. Add a real “review parsed content” checkpoint before publish so parsing errors do not become the public page.
- **Studio.** Make it task-oriented. The assistant highlights the next action and a progress model that distinguishes live, stronger, and most trusted, without negative language.
- **Verification modal.** The grouping is good. Explain what each method proves, and show the expected trust value without making the methods look equivalent.
- **Colleague invite.** Polish this aggressively. Keep relationship context. Reassure both people about privacy, effort, and what will appear on the dossier.
- **Public dossier.** Tighten trust language and raise the portfolio in the hierarchy. A reader should immediately see that this is a real candidate, what outside evidence supports, and what the candidate built.

## Competitive read

Hire ID emphasizes employer trust outcomes, reusable verification, and reduced screening friction across identity, education, employment, certifications, and references. Vetano combines identity verification with proof-of-skill content, especially for frontline roles.

Do not become a weaker copy of both. Match baseline trust categories where helpful, stay candidate-first, lead with the portfolio and the public dossier, and use peer corroboration as the growth mechanism.

## Metrics gaps

The missing collaborator-completion measurement is serious. Without request-sent to request-completed, it is impossible to know whether the core loop works.

Instrument these events:

- Upload started
- Parse completed
- Parse reviewed and approved
- Save and auth complete
- Slug published
- Email verified
- Phone verified
- LinkedIn verified
- Work sample added
- Education proof added
- Corroboration request sent
- Corroboration completed
- Corroborator created a profile

## Launch priorities

### Must-do before a broad launch

- Tighten language so claims match proof.
- Make self-provided content graceful, not stigmatized.
- Improve work-sample presentation and templates.
- Instrument collaborator completion and the loop.
- Clarify proof details by source type.
- Use the assistant to guide post-publish actions.

### Can wait

- Formal recruiter accounts
- ATS integrations
- Deeper institutional verification
- Heavy enterprise workflow features

## Bottom line

There is enough built to launch a meaningful beta. Success depends on publishing fast, guiding relentlessly, explaining proof precisely, and measuring whether peer corroboration creates a loop.
