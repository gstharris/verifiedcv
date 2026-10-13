# VerifiedCV product overview

Code snapshot from 10 October 2026. Later product decisions are in `docs/strategy.md` and `docs/product-teardown.md`.

10 October 2026. Written from the product as it exists on main, and from the live site at www.verifiedcv.app. This is an assessment of where the product is, for a conversation about what to do next.

## Where we are

VerifiedCV is a working beta of a page a candidate owns. The promise on the homepage is the right size: upload a resume, add proof, share one link. That loop is built. A visitor can open www.verifiedcv.app, the app is deployed on Vercel, and the public address is verifiedcv.app/yourname.

The product is furthest along for the person building the page. Hiring teams can read that page. They do not have an account, a search tool, or a workflow of their own.

The trust checks that are wired up are real and modest. A chapter can show a matched work inbox, a scanned employment document, or a colleague who signed in with LinkedIn and stated an overlap. Identity can be confirmed with an email code, LinkedIn, and, when Twilio is configured, a phone code. Sample work is a public link or a file, with a lighter check.

The main risk is language that is stronger than the check. Older types in the code still talk about SEC filings, patent registries, and cryptographic anchors. What a reader can rely on today is narrower than that vocabulary. I would keep the public page saying exactly what was checked, and I would retire the leftover “forensic registry” wording before showing this to a hiring team as a finished trust product.

## What the product is

VerifiedCV (verifiedcv.app) is a candidate portfolio with proof attached to each job chapter. It is meant to sit under a person’s name on a resume and on an application that asks for a website. The audience the marketing copy aims at is operators and product leaders, alongside designers who already have portfolios.

The page is free while the product is in beta. Studio can be gated with a private access code when that environment variable is set. I did not inspect the Vercel environment, so I am not claiming the private-code gate, Twilio, Hunter, or the writing assistant are switched on in production. The code paths are there.

## Users

- **Candidates.** The primary user. They upload or paste a resume, claim a handle, edit the page in Studio, add proof, and share the link.
- **Colleagues.** Someone the candidate asks. They open a private link, sign in with LinkedIn, state the years they overlapped, and can endorse individual achievements. Their name stays off the public page by default. The page shows a title at that company.
- **Hiring teams.** Readers. The homepage has a recruiter view of the same page: proof sits on the chapter. There is no recruiter login.

## Core flows

**1. Claim a page.** On the homepage, upload a PDF or Word file, or paste resume text. The server extracts career chapters and sends the draft into Studio. The candidate signs in with Google or an email magic link, picks a handle, and saves. Until the portfolio is saved, the editor stays locked.

**2. Build the page.** Studio is the resume: name and headline, summary, experience chapters, skills, education, and sample work. A section bar jumps between those parts. One layout choice places sample work at the bottom, at the top, or in a two-column grid at the top. That choice applies to the whole page.

**3. Confirm it is you.** The suggested order is email, then LinkedIn, then each job chapter, then a stronger second proof on chapters that only have one, then an optional phone number.

**4. Prove a chapter.** For a company, the candidate can confirm a work email, upload an employment document, or email a colleague. One independent source labels the chapter Verified. A second source labels it Verified+.

**5. A colleague confirms.** The email contains a link to verifiedcv.app/attest/…. The colleague signs in with LinkedIn, enters a title and overlap dates, and submits. The public dossier then shows that confirmation beside the chapter.

**6. Someone reads it.** verifiedcv.app/handle is the public dossier: identity strip, chapters with their proof, skills, education, and sample work in the chosen layout.

## Features that are in the product

- Homepage with a beta label, resume upload, paste, and a studio-versus-recruiter preview.
- Resume parsing that keeps company names containing slashes, compound titles, and start months next to “Present.” Education is kept out of the skills list. Very short leftover bullet fragments are dropped.
- Studio editing for chapters, achievements, summary, skills, education, and contact details.
- Handle claim, with reserved words such as studio, auth, attest, and pricing blocked. Ownership is a cookie tied to the saved portfolio. A taken handle can be restored by the owner.
- Verified email, phone, and LinkedIn fields lock after they are confirmed. Editing one clears that confirmation until it is done again.
- Ally, a writing assistant in Studio. With an AI key it helps rewrite bullets and reminds the candidate to leave confidential employer numbers off a public page. Without a key it still returns that same guidance.
- Sample work: project, prototype, app, presentation, certification, patent, or a general link. Files can be uploaded. Public credential and patent URLs get a “registry” label after a format check.
- A public dossier and three layouts for where sample work sits.
- Analytics events when a PostHog key is present.

## Verification we offer

Proof is per chapter. A confirmed email or LinkedIn does not, by itself, turn a job into Verified. It tells a reader the contact details belong to this person.

### Identity

- **Email.** A six-digit code, sent from verify@verifiedcv.app, expires in 10 minutes.
- **LinkedIn.** The account has to return a real profile: a verified email, a first and last name, and a profile photo. Throwaway email domains are rejected.
- **Phone.** Optional, and last in the queue. It sends an SMS through Twilio Verify. If those keys are missing, the product says phone verification is not configured.

### A job chapter

- **Work email.** Personal inboxes (Gmail, Yahoo, Outlook, iCloud, and similar) are rejected. The domain has to match the company, including a short alias list for names like Google and Meta. In production the code also asks Hunter whether the mailbox looks real, whether the domain belongs to that company, and whether the address is disposable or a known webmail. The candidate then enters a code sent to that inbox. That is the proof: they can open the company mailbox.
- **Employment document.** A PDF of a W-2, offer letter, employment contract, or pay stub. The text has to include the employer, the candidate’s name, and a year that overlaps the chapter. An AI key can help read the employer name. The file still has to pass those checks. The upload limit is 8 MB.
- **Colleague.** The candidate emails a person. That person must sign in with LinkedIn, give a title, and give dates that overlap the chapter by at least one month. The company they enter has to match the chapter. They can endorse specific achievements. They cannot confirm the chapter with the candidate’s own LinkedIn account or email, and the same LinkedIn account cannot confirm the same chapter twice. The stored “signature” is a random token in our database. It is a receipt id, not a public ledger entry.

### How a chapter is labeled

| What is on the chapter | Public label |
| --- | --- |
| No third-party proof | Self-Attested |
| One colleague, or one employment document | Verified |
| Two colleagues, or one colleague and one document | Verified+ |
| Three colleagues, or two colleagues and one document | Verified+ (the count is higher; the public word is the same) |

A work-email confirmation is stored as its own proof record and is described on the chapter (“Corporate email @company.com”). The numeric level above is driven by colleague confirmations and employment documents.

### Sample work

A normal link is saved as “link checked.” A Credly, Accredible, or Coursera URL, or a USPTO or Google Patents URL, is saved as “registry.” The note on those items says we checked the link format, and that we did not confirm the person owns the badge or is the inventor. These links do not change the chapter’s Verified or Verified+ label.

## Decisions we have made

- The candidate owns the page and chooses who to ask.
- Proof is written on the chapter, in plain language, rather than as one sticker for the whole person.
- Colleague names stay private. The public line is a role at that company.
- One month of stated overlap is enough for a colleague confirmation.
- A person cannot confirm their own chapter.
- A personal inbox cannot stand in for employment.
- Hiring teams are told, on the homepage, that they still run their own backchannels. The page is a lead, not a replacement reference check.
- Confidential employer numbers are treated as something to keep off the public page. Ally is instructed to say so.
- Sample-work placement is one decision for the whole dossier.
- The visual system is a light page: white cards, off-white canvas, dark slate text, emerald for trust.
- PDF text is extracted on the server. Client-side binary parsing was abandoned after it corrupted text.
- LinkedIn sign-in for verification stays on our own OAuth flow, after an attempt to run it through Supabase auth was reverted.
- The product is free during beta.

## What we have chosen not to do

- A recruiter product: accounts, search, shortlists, or an applicant-tracking integration.
- A price. “Pricing” is only a reserved handle. The page says the beta is free.
- A background check, a degree verification, or an employer-of-record lookup beyond the work-email and document checks above.
- SEC filings as proof. The channel name exists on an internal type and is unused.
- Confirming that a patent or a certification belongs to this person.
- Letting a patent or badge link raise the chapter verification level.
- Publishing colleague legal names by default.
- Requiring a phone number.
- A global verified-person badge in place of chapter proof.
- Anchoring documents on a public blockchain or an external registry. An older route can mark a file “anchored” inside our own database. That is a local flag.

## What is live

www.verifiedcv.app responds on Vercel. The homepage, Studio, the public dossier, and the colleague confirmation page are the product surface.

On main, these paths are implemented and are what the app calls in the real flows:

- Resume upload and paste, then Studio.
- Save and load a dossier, check whether a handle is free, restore a handle the owner already claimed.
- Google sign-in and email magic link.
- Email confirmation codes.
- LinkedIn for the candidate and for the colleague.
- Work-email codes, with the domain and Hunter checks described above.
- Employment-document scan.
- Colleague invitation by email, and the confirmation page.
- Sample work, including upload, and the three page layouts.
- The verification queue and the Self-Attested / Verified / Verified+ labels.

Phone verification, Hunter, Ally’s model, and the smarter document read all depend on API keys. Treat those as built and ready, and confirm the keys in Vercel before describing them as on for every user.

## What is unfinished

These are in the repository and are easy to mistake for the product. Studio does not use them for the live flows.

- An older “request corroboration” modal that expects a shareable link the invite route does not return.
- A reminder route that writes a timestamp and does not send an email.
- A domain-verification route that stores a token and does not send mail. The live work-email path is the corporate-email code.
- An interrogate route that marks an artifact anchored locally.
- Internal types that still list USPTO and SEC as corroboration channels.
- The project context note in the repo, which still describes an older Studio layout and an earlier phase of the work.
- Database policies that allow broad public read and write. That matches a private beta and is a poor fit for a public launch.
- Portfolio uploads stored in a public storage bucket.

## What I would do with this

The candidate loop is the thing to put in people’s hands: a real resume, one chapter proved with a work email or a colleague, and the public link. That is a complete beta story.

Before a wider hiring-team conversation, I would make the public wording match the checks, remove or hide the unused registry and “anchored” paths so they cannot be demoed by accident, and decide whether open database access and public file storage are acceptable past a private beta.

A recruiter workflow, pricing, degree checks, and true registry verification (inventorship, badge ownership, filings) are future product. They are not hiding in the current build.
