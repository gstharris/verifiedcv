import { contactIdentity, type DossierContact, type DossierMilestone, type DossierSnapshot } from "./dossierChanges";

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function proofId(item: unknown) {
  if (!item || typeof item !== "object") return "";
  return clean((item as { id?: string }).id);
}

function mergeProof(liveItems: unknown, draftItems: unknown) {
  const liveList = asArray<unknown>(liveItems);
  const draftList = asArray<unknown>(draftItems);
  const seen = new Set<string>();
  const merged: unknown[] = [];

  for (const item of liveList) {
    const id = proofId(item);
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    merged.push(structuredClone(item));
  }

  for (const item of draftList) {
    const id = proofId(item);
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push(structuredClone(item));
      continue;
    }
    const alreadyKept = liveList.some((liveItem) => JSON.stringify(liveItem) === JSON.stringify(item));
    if (!alreadyKept) merged.push(structuredClone(item));
  }

  return merged;
}

function withLiveFlags(liveContact: DossierContact, draftContact: DossierContact): DossierContact {
  const liveIdentity = contactIdentity(liveContact);
  const draftIdentity = contactIdentity(draftContact);
  return {
    ...draftContact,
    emailVerified: draftIdentity.email === liveIdentity.email ? Boolean(liveContact.emailVerified) : false,
    phoneVerified: draftIdentity.phone === liveIdentity.phone ? Boolean(liveContact.phoneVerified) : false,
    linkedinVerified: draftIdentity.linkedin === liveIdentity.linkedin ? Boolean(liveContact.linkedinVerified) : false
  };
}

function mergeMilestone(live: DossierMilestone | undefined, draft: DossierMilestone): DossierMilestone {
  if (!live) return draft;
  const merged: DossierMilestone = {
    ...draft,
    verifications: mergeProof(live.verifications, draft.verifications),
    artifacts: mergeProof(live.artifacts, draft.artifacts),
    registryLinks: mergeProof(live.registryLinks, draft.registryLinks)
  };
  if (Array.isArray(live.endorsedClaimIds)) merged.endorsedClaimIds = [...live.endorsedClaimIds];
  return merged;
}

/**
 * Overlay draft content on the live dossier.
 * Surviving chapters keep live proof. A stale or empty draft cannot delete it.
 * Verification flags stay only when the published contact value is unchanged.
 */
export function publishDraft(
  live: DossierSnapshot | null | undefined,
  draft: DossierSnapshot | null | undefined
): DossierSnapshot {
  const published = live || {};
  const next = structuredClone(draft || {}) as DossierSnapshot;
  const draftContact = { ...(next.contact || {}) };
  next.contact = withLiveFlags(published.contact || {}, draftContact);
  if (clean(draftContact.email)) next.email = clean(draftContact.email);

  if (!clean(next.linkedinSub) && clean(published.linkedinSub)) {
    next.linkedinSub = published.linkedinSub;
  }

  if (Array.isArray(next.milestones)) {
    const liveById = new Map<string, DossierMilestone>();
    for (const milestone of asArray<DossierMilestone>(published.milestones)) {
      const id = clean(milestone?.id);
      if (id && !liveById.has(id)) liveById.set(id, milestone);
    }
    next.milestones = next.milestones.map((milestone) => mergeMilestone(liveById.get(clean(milestone?.id)), milestone || {}));
  }

  return next;
}
