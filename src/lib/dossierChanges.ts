import { readChapterExtras } from "./chapterMeta";
import { linkedInHandle } from "./linkedin";
import { parseDossierLayout } from "./portfolioAssets";

export const DOSSIER_CHANGE_LIMIT = 12;

export type DossierContact = {
  email?: string;
  phone?: string;
  linkedin?: string;
  location?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  linkedinVerified?: boolean;
};

export type DossierEducation = {
  id?: string;
  institution?: string;
  degree?: string;
  year?: string;
};

export type DossierAsset = {
  id?: string;
  title?: string;
  description?: string;
  url?: string;
  type?: string;
  issuer?: string;
  issuedAt?: string;
  verificationStatus?: string;
  verificationNote?: string;
};

export type DossierMilestone = {
  id?: string;
  company?: string;
  role?: string;
  period?: string;
  location?: string;
  claims?: unknown[];
  calibratedClaim?: string;
  companyUrl?: string;
  highlightIndexes?: number[];
  artifacts?: unknown[];
  registryLinks?: unknown[];
  verifications?: unknown[];
  endorsedClaimIds?: string[];
};

/** Editor payload or public vault record. Proof and verification flags are not content. */
export type DossierSnapshot = {
  handle?: string;
  email?: string;
  fullName?: string;
  headline?: string;
  summaryStatement?: string;
  contact?: DossierContact;
  skills?: unknown[];
  education?: DossierEducation[];
  preferredLayout?: string;
  highlights?: unknown[];
  portfolioAssets?: DossierAsset[];
  milestones?: DossierMilestone[];
  linkedinSub?: string;
};

export type DossierChangeSection =
  | "summary"
  | "headline"
  | "name"
  | "experience"
  | "skills"
  | "education"
  | "sampleWork"
  | "highlights"
  | "contact"
  | "layout";

export type DossierChange = {
  section: DossierChangeSection;
  text: string;
};

export type DossierChangeSummary = {
  changes: DossierChange[];
  overflow: number;
  overflowLabel: string;
  hasChanges: boolean;
};

type ChapterView = {
  company: string;
  role: string;
  period: string;
  location: string;
  companyUrl: string;
  highlightIndexes: number[];
  claims: string[];
  note: string;
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function emailKey(value: unknown) {
  return clean(value).toLowerCase();
}

function phoneKey(value: unknown) {
  const digits = clean(value).replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
}

function linkedInKey(value: unknown) {
  const handle = linkedInHandle(clean(value));
  return (handle || clean(value)).toLowerCase();
}

function locationKey(value: unknown) {
  return clean(value).replace(/\s+/g, " ").toLowerCase();
}

export function contactIdentity(contact?: DossierContact | null) {
  return {
    email: emailKey(contact?.email),
    phone: phoneKey(contact?.phone),
    linkedin: linkedInKey(contact?.linkedin),
    location: locationKey(contact?.location)
  };
}

function countNoun(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function sectionForLabel(label: "Summary" | "Headline" | "Name"): DossierChangeSection {
  if (label === "Summary") return "summary";
  if (label === "Headline") return "headline";
  return "name";
}

function presenceChange(before: string, after: string, label: "Summary" | "Headline" | "Name"): DossierChange | null {
  if (before === after) return null;
  const section = sectionForLabel(label);
  if (!before && after) return { section, text: `${label} added` };
  if (before && !after) return { section, text: `${label} removed` };
  return { section, text: `${label} updated` };
}

function claimDelta(before: string[], after: string[]) {
  const shared = Math.min(before.length, after.length);
  let edited = 0;
  for (let index = 0; index < shared; index += 1) {
    if (before[index] !== after[index]) edited += 1;
  }
  return {
    edited,
    added: Math.max(0, after.length - before.length),
    removed: Math.max(0, before.length - after.length)
  };
}

function listDelta(before: string[], after: string[]) {
  const counts = new Map<string, number>();
  for (const item of before) counts.set(item, (counts.get(item) || 0) + 1);
  let added = 0;
  for (const item of after) {
    const remaining = counts.get(item) || 0;
    if (remaining > 0) counts.set(item, remaining - 1);
    else added += 1;
  }
  let removed = 0;
  for (const remaining of counts.values()) removed += remaining;
  return { added, removed };
}

function textList(value: unknown) {
  return asArray<unknown>(value).map((item) => clean(item)).filter(Boolean);
}

function highlightsOf(value: unknown) {
  return asArray<unknown>(value).map((item) => clean(item).replace(/\s+/g, " ")).filter(Boolean);
}

function educationOf(value: unknown) {
  return asArray<DossierEducation>(value)
    .map((record) => ({
      institution: clean(record?.institution),
      degree: clean(record?.degree),
      year: clean(record?.year)
    }))
    .filter((record) => record.institution || record.degree || record.year);
}

function assetContent(asset: DossierAsset) {
  return {
    id: clean(asset?.id),
    title: clean(asset?.title),
    description: clean(asset?.description),
    url: clean(asset?.url),
    type: clean(asset?.type),
    issuer: clean(asset?.issuer),
    issuedAt: clean(asset?.issuedAt)
  };
}

function sameAsset(left: ReturnType<typeof assetContent>, right: ReturnType<typeof assetContent>) {
  return (
    left.title === right.title &&
    left.description === right.description &&
    left.url === right.url &&
    left.type === right.type &&
    left.issuer === right.issuer &&
    left.issuedAt === right.issuedAt
  );
}

function viewChapter(milestone: DossierMilestone | null | undefined): ChapterView {
  const chapter = milestone || {};
  const extras = readChapterExtras(chapter.calibratedClaim);
  const explicitIndexes = asArray<number>(chapter.highlightIndexes).filter((index) => Number.isInteger(index) && index >= 0);
  return {
    company: clean(chapter.company),
    role: clean(chapter.role),
    period: clean(chapter.period),
    location: clean(chapter.location),
    companyUrl: clean(chapter.companyUrl || extras.companyUrl),
    highlightIndexes: explicitIndexes.length ? explicitIndexes : extras.highlightIndexes,
    claims: textList(chapter.claims),
    note: extras.note.trim()
  };
}

function chapterKey(milestone: DossierMilestone | null | undefined, index: number) {
  const id = clean(milestone?.id);
  return id || `index:${index}`;
}

function atChapter(company: string) {
  return company ? ` at ${company}` : "";
}

function hasProof(milestone: DossierMilestone | null | undefined) {
  const chapter = milestone || {};
  return (
    asArray(chapter.verifications).length > 0 ||
    asArray(chapter.artifacts).length > 0 ||
    asArray(chapter.registryLinks).length > 0 ||
    asArray(chapter.endorsedClaimIds).length > 0
  );
}

function removalLine(removed: number, withProof: number) {
  const base = `${countNoun(removed, "chapter", "chapters")} removed`;
  if (withProof <= 0) return base;
  if (removed === 1) return `${base}. Proof on this chapter is removed when you publish.`;
  if (withProof === removed) return `${base}. Proof on these chapters is removed when you publish.`;
  return `${base}. Proof on ${countNoun(withProof, "chapter", "chapters")} is removed when you publish.`;
}

function sameIndexes(left: number[], right: number[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function layoutId(value: unknown) {
  return parseDossierLayout(clean(value)).id;
}

function pushCount(changes: DossierChange[], section: DossierChangeSection, count: number, singular: string, verb: string) {
  if (count <= 0) return;
  const noun = count === 1 ? singular : `${singular}s`;
  changes.push({ section, text: `${count} ${noun} ${verb}` });
}

export function summarizeDossierChanges(
  published: DossierSnapshot | null | undefined,
  draft: DossierSnapshot | null | undefined
): DossierChangeSummary {
  const live = published || {};
  const next = draft || {};
  const changes: DossierChange[] = [];

  const summary = presenceChange(clean(live.summaryStatement), clean(next.summaryStatement), "Summary");
  if (summary) changes.push(summary);
  const headline = presenceChange(clean(live.headline), clean(next.headline), "Headline");
  if (headline) changes.push(headline);
  const name = presenceChange(clean(live.fullName), clean(next.fullName), "Name");
  if (name) changes.push(name);

  const liveChapters = asArray<DossierMilestone>(live.milestones).map((milestone, index) => ({
    key: chapterKey(milestone, index),
    milestone,
    view: viewChapter(milestone)
  }));
  const draftChapters = asArray<DossierMilestone>(next.milestones).map((milestone, index) => ({
    key: chapterKey(milestone, index),
    view: viewChapter(milestone)
  }));
  const draftByKey = new Map(draftChapters.map((chapter) => [chapter.key, chapter]));
  const liveKeys = new Set(liveChapters.map((chapter) => chapter.key));

  const added = draftChapters.filter((chapter) => !liveKeys.has(chapter.key)).length;
  const removedChapters = liveChapters.filter((chapter) => !draftByKey.has(chapter.key));
  if (added > 0) changes.push({ section: "experience", text: `${countNoun(added, "chapter", "chapters")} added` });
  if (removedChapters.length > 0) {
    const withProof = removedChapters.filter((chapter) => hasProof(chapter.milestone)).length;
    changes.push({ section: "experience", text: removalLine(removedChapters.length, withProof) });
  }

  let achievementsEdited = 0;
  let achievementsAdded = 0;
  let achievementsRemoved = 0;
  for (const chapter of liveChapters) {
    const match = draftByKey.get(chapter.key);
    if (!match) continue;
    const before = chapter.view;
    const after = match.view;
    const where = atChapter(before.company);
    if (before.company !== after.company) changes.push({ section: "experience", text: `Company updated${where}` });
    if (before.role !== after.role) changes.push({ section: "experience", text: `Role updated${where}` });
    if (before.period !== after.period) changes.push({ section: "experience", text: `Dates updated${where}` });
    if (before.location !== after.location) changes.push({ section: "experience", text: `Work location updated${where}` });
    if (before.companyUrl !== after.companyUrl) changes.push({ section: "experience", text: `Company site updated${where}` });
    if (!sameIndexes(before.highlightIndexes, after.highlightIndexes)) {
      changes.push({ section: "experience", text: `Highlighted achievements updated${where}` });
    }
    if (before.note !== after.note) changes.push({ section: "experience", text: `Details updated${where}` });
    const claims = claimDelta(before.claims, after.claims);
    achievementsEdited += claims.edited;
    achievementsAdded += claims.added;
    achievementsRemoved += claims.removed;
  }
  pushCount(changes, "experience", achievementsEdited, "achievement", "edited");
  pushCount(changes, "experience", achievementsAdded, "achievement", "added");
  pushCount(changes, "experience", achievementsRemoved, "achievement", "removed");

  const liveSkills = textList(live.skills);
  const draftSkills = textList(next.skills);
  const skillDelta = listDelta(liveSkills, draftSkills);
  const skillCount = skillDelta.added + skillDelta.removed;
  if (skillCount > 0) {
    changes.push({ section: "skills", text: `${countNoun(skillCount, "skill", "skills")} updated` });
  } else if (liveSkills.join("\0") !== draftSkills.join("\0")) {
    changes.push({ section: "skills", text: "Skills updated" });
  }

  const liveEducation = educationOf(live.education);
  const draftEducation = educationOf(next.education);
  const educationSignature = (records: ReturnType<typeof educationOf>) =>
    records.map((record) => `${record.institution}\0${record.degree}\0${record.year}`).join("\n");
  if (educationSignature(liveEducation) !== educationSignature(draftEducation)) {
    const text = !liveEducation.length ? "Education added" : !draftEducation.length ? "Education removed" : "Education updated";
    changes.push({ section: "education", text });
  }

  const liveAssets = asArray<DossierAsset>(live.portfolioAssets).map(assetContent);
  const draftAssets = asArray<DossierAsset>(next.portfolioAssets).map(assetContent);
  const usedDraft = new Set<number>();
  let assetsUpdated = 0;
  let assetsRemoved = 0;
  for (const asset of liveAssets) {
    const match = draftAssets.findIndex((candidate, index) => {
      if (usedDraft.has(index)) return false;
      if (asset.id && candidate.id) return asset.id === candidate.id;
      return !asset.id && !candidate.id && sameAsset(asset, candidate);
    });
    if (match < 0) {
      assetsRemoved += 1;
      continue;
    }
    usedDraft.add(match);
    if (!sameAsset(asset, draftAssets[match])) assetsUpdated += 1;
  }
  const assetsAdded = draftAssets.filter((_, index) => !usedDraft.has(index)).length;
  pushCount(changes, "sampleWork", assetsAdded, "sample work item", "added");
  pushCount(changes, "sampleWork", assetsRemoved, "sample work item", "removed");
  pushCount(changes, "sampleWork", assetsUpdated, "sample work item", "updated");

  const liveHighlights = highlightsOf(live.highlights);
  const draftHighlights = highlightsOf(next.highlights);
  if (liveHighlights.join("\0") !== draftHighlights.join("\0")) {
    const text = !liveHighlights.length ? "Highlights added" : !draftHighlights.length ? "Highlights removed" : "Highlights updated";
    changes.push({ section: "highlights", text });
  }

  const liveContact = contactIdentity(live.contact);
  const draftContact = contactIdentity(next.contact);
  if (liveContact.email !== draftContact.email) changes.push({ section: "contact", text: "Email updated" });
  if (liveContact.phone !== draftContact.phone) changes.push({ section: "contact", text: "Phone updated" });
  if (liveContact.linkedin !== draftContact.linkedin) changes.push({ section: "contact", text: "LinkedIn updated" });
  if (liveContact.location !== draftContact.location) changes.push({ section: "contact", text: "Location updated" });

  if (layoutId(live.preferredLayout) !== layoutId(next.preferredLayout)) {
    changes.push({ section: "layout", text: "Layout updated" });
  }

  const overflow = Math.max(0, changes.length - DOSSIER_CHANGE_LIMIT);
  return {
    changes: overflow > 0 ? changes.slice(0, DOSSIER_CHANGE_LIMIT) : changes,
    overflow,
    overflowLabel: overflow === 0 ? "" : `and ${countNoun(overflow, "more edit", "more edits")}`,
    hasChanges: changes.length > 0
  };
}

export function hasUnpublishedChanges(
  published: DossierSnapshot | null | undefined,
  draft: DossierSnapshot | null | undefined
) {
  return summarizeDossierChanges(published, draft).hasChanges;
}
