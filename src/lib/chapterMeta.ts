const MARK = "vcv-meta:";

export type ChapterExtras = {
  companyUrl: string;
  highlightIndexes: number[];
  note: string;
};

export function readChapterExtras(value?: string): ChapterExtras {
  const raw = String(value || "");
  if (!raw.startsWith(MARK)) {
    return { companyUrl: "", highlightIndexes: [], note: raw };
  }
  try {
    const parsed = JSON.parse(raw.slice(MARK.length)) as Partial<ChapterExtras>;
    const highlightIndexes = Array.isArray(parsed.highlightIndexes)
      ? parsed.highlightIndexes.filter((index) => Number.isInteger(index) && index >= 0)
      : [];
    return {
      companyUrl: typeof parsed.companyUrl === "string" ? parsed.companyUrl : "",
      highlightIndexes,
      note: typeof parsed.note === "string" ? parsed.note : ""
    };
  } catch {
    return { companyUrl: "", highlightIndexes: [], note: "" };
  }
}

export function writeChapterExtras(extras: ChapterExtras) {
  const companyUrl = String(extras.companyUrl || "").trim();
  const highlightIndexes = (extras.highlightIndexes || []).filter((index) => Number.isInteger(index) && index >= 0);
  const note = String(extras.note || "");
  if (!companyUrl && highlightIndexes.length === 0) return note;
  return `${MARK}${JSON.stringify({ companyUrl, highlightIndexes, note })}`;
}

export function packChapter<T extends { calibratedClaim?: string; companyUrl?: string; highlightIndexes?: number[] }>(chapter: T) {
  const current = readChapterExtras(chapter.calibratedClaim);
  return {
    ...chapter,
    calibratedClaim: writeChapterExtras({
      companyUrl: chapter.companyUrl || current.companyUrl,
      highlightIndexes: chapter.highlightIndexes || current.highlightIndexes,
      note: current.note
    })
  };
}

function claimText(claim: unknown) {
  return typeof claim === "string" ? claim.trim() : "";
}

export function readableClaims(claims: unknown, calibratedClaim?: string) {
  const extras = readChapterExtras(calibratedClaim);
  const source = Array.isArray(claims) ? claims.map(claimText).filter(Boolean) : [];
  const usable = source.filter((claim) => !claim.startsWith(MARK) && claim.replace(/[^a-zA-Z]/g, "").length >= 12);
  if (usable.length) return usable;
  const note = extras.note.trim();
  if (note.replace(/[^a-zA-Z]/g, "").length >= 12) return [note];
  return [];
}

export function hydrateChapter<T extends { claims?: unknown; calibratedClaim?: string; companyUrl?: string; highlightIndexes?: number[] }>(
  chapter: T
) {
  const extras = readChapterExtras(chapter.calibratedClaim);
  const explicitIndexes = Array.isArray(chapter.highlightIndexes) ? chapter.highlightIndexes : [];
  return {
    ...chapter,
    claims: readableClaims(chapter.claims, chapter.calibratedClaim),
    companyUrl: String(chapter.companyUrl || extras.companyUrl || ""),
    highlightIndexes: explicitIndexes.length ? explicitIndexes : extras.highlightIndexes,
    calibratedClaim: extras.note
  };
}
