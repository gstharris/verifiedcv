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
