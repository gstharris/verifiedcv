type ProofChapter = {
  id?: string;
  verifications?: unknown[];
  artifacts?: unknown[];
  registryLinks?: unknown[];
};

export function mergePeerVerifications<T extends { id?: string; verifications?: unknown[] }>(
  editor: T[],
  live: Array<{ id?: string; verifications?: unknown[] }>
): T[] {
  const liveById = new Map<string, { verifications?: unknown[] }>();
  for (const chapter of live) {
    if (chapter?.id) liveById.set(chapter.id, chapter);
  }
  return editor.map((chapter) => {
    if (!chapter?.id || !liveById.has(chapter.id)) return chapter;
    const incoming = liveById.get(chapter.id);
    return {
      ...chapter,
      verifications: Array.isArray(incoming?.verifications) ? incoming.verifications : chapter.verifications
    };
  });
}

export function overlayChapterProof<T extends ProofChapter>(published: T[], editor: T[]): T[] {
  const editorById = new Map<string, T>();
  for (const chapter of editor) {
    if (chapter?.id) editorById.set(chapter.id, chapter);
  }
  return published.map((chapter) => {
    if (!chapter?.id || !editorById.has(chapter.id)) return chapter;
    const next = editorById.get(chapter.id)!;
    return {
      ...chapter,
      verifications: next.verifications ?? chapter.verifications,
      artifacts: next.artifacts ?? chapter.artifacts,
      registryLinks: next.registryLinks ?? chapter.registryLinks
    };
  });
}

type ReplacedContact = {
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  linkedinVerified: boolean;
};

export function chapterHasProof(chapter: { verifications?: unknown[]; artifacts?: unknown[] } | null | undefined) {
  return Boolean(chapter?.verifications?.length || chapter?.artifacts?.length);
}

export function companyMatchKey(company: unknown) {
  return String(company || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** A new resume replaces chapters. A verified chapter stays when its company matches exactly. */
export function replaceResumeChapters<T extends { company?: string; verifications?: unknown[]; artifacts?: unknown[] }>(
  existing: T[],
  incoming: T[]
) {
  const verified = new Map<string, T>();
  for (const chapter of existing) {
    const key = companyMatchKey(chapter?.company);
    if (!key || !chapterHasProof(chapter) || verified.has(key)) continue;
    verified.set(key, chapter);
  }
  const seen = new Set<string>();
  const next: T[] = [];
  for (const chapter of incoming) {
    const key = companyMatchKey(chapter?.company);
    const kept = key ? verified.get(key) : undefined;
    if (kept) {
      if (!seen.has(key)) {
        seen.add(key);
        next.push(kept);
      }
      continue;
    }
    next.push(chapter);
  }
  return next;
}

export function hasKeptIdentity(record: {
  fullName?: string;
  handle?: string;
  contact?: { email?: string; phone?: string; linkedin?: string; location?: string } | null;
} | null | undefined) {
  if (!record) return false;
  const contact = record.contact || {};
  return Boolean(
    String(record.fullName || "").trim() ||
    String(record.handle || "").trim() ||
    String(contact.email || "").trim() ||
    String(contact.phone || "").trim() ||
    String(contact.linkedin || "").trim() ||
    String(contact.location || "").trim()
  );
}

function blankContact(): ReplacedContact {
  return {
    email: "",
    phone: "",
    linkedin: "",
    location: "",
    emailVerified: false,
    phoneVerified: false,
    linkedinVerified: false
  };
}

/** Blank name, handle, and contact on a draft fall back to the live page. A value the draft actually set stays. */
export function keepPublishedIdentity<T extends {
  handle?: string;
  fullName?: string;
  email?: string;
  contact?: ReplacedContact | null;
}>(
  draft: T,
  live: { handle?: string; fullName?: string; email?: string; contact?: Partial<ReplacedContact> | null }
): T {
  const liveContact = { ...blankContact(), ...(live.contact || {}) };
  const draftContact = { ...blankContact(), ...(draft.contact || {}) };
  const contact = mergeReplacedContact(draftContact, liveContact);
  const same = (left: string, right: string) => left.trim().toLowerCase() === right.trim().toLowerCase();
  contact.emailVerified = same(contact.email, liveContact.email) ? liveContact.emailVerified : draftContact.emailVerified;
  contact.phoneVerified = same(contact.phone, liveContact.phone) ? liveContact.phoneVerified : draftContact.phoneVerified;
  contact.linkedinVerified = same(contact.linkedin, liveContact.linkedin) ? liveContact.linkedinVerified : draftContact.linkedinVerified;
  const handle = String(draft.handle || "").trim() || String(live.handle || "").trim();
  const fullName = String(draft.fullName || "").trim() || String(live.fullName || "").trim();
  return {
    ...draft,
    handle,
    fullName,
    email: contact.email || draft.email || live.email,
    contact
  };
}

/** A new resume can fill blank unverified contact fields. It cannot clear a verified flag or overwrite a value already on the page. */
export function mergeReplacedContact<T extends ReplacedContact>(
  current: T,
  incoming?: { email?: string; phone?: string; linkedin?: string; location?: string } | null
): T {
  const parsed = incoming || {};
  const fill = (verified: boolean, existing: string, next?: string) => {
    if (verified || existing.trim()) return existing;
    const value = String(next || "").trim();
    return value || existing;
  };
  return {
    ...current,
    email: fill(current.emailVerified, current.email, parsed.email),
    phone: fill(current.phoneVerified, current.phone, parsed.phone),
    linkedin: fill(current.linkedinVerified, current.linkedin, parsed.linkedin),
    location: fill(false, current.location, parsed.location),
    emailVerified: current.emailVerified,
    phoneVerified: current.phoneVerified,
    linkedinVerified: current.linkedinVerified
  };
}

export function withIdentity<T extends { contact?: Record<string, unknown>; email?: string; linkedinSub?: string }>(
  record: T,
  contact: Record<string, unknown>,
  linkedinSub?: string
): T {
  const email = typeof contact.email === "string" && contact.email.trim() ? contact.email : record.email;
  return {
    ...record,
    email,
    contact: { ...(record.contact || {}), ...contact },
    ...(linkedinSub ? { linkedinSub } : {})
  };
}

export async function patchVaultIdentity(body: {
  handle?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  linkedinVerified?: boolean;
  linkedinSub?: string;
}) {
  const res = await fetch("/api/vault/identity", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body)
  });
  return res.ok;
}
