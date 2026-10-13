export const CORP_EMAIL_VERIFIER = "Corporate Email Verification";

export type ProofRecord = {
  name?: string;
  email?: string;
  role?: string;
};

export function isCorpEmailVerification(record: ProofRecord) {
  return String(record.name || "") === CORP_EMAIL_VERIFIER;
}

export function corpEmailDomain(email?: string) {
  return String(email || "").split("@")[1]?.trim().toLowerCase() || "";
}

export function endorsedClaimIndexes(ids: unknown) {
  if (!Array.isArray(ids)) return [];
  return [
    ...new Set(
      ids
        .map((id) => {
          const match = /^c(\d+)$/.exec(String(id));
          return match ? Number(match[1]) : -1;
        })
        .filter((index) => index >= 0)
    )
  ].sort((a, b) => a - b);
}

export function companyProofLines(
  company: string,
  verifications: ProofRecord[] = [],
  docs = 0
) {
  const lines: string[] = [];
  const corp = verifications.find(isCorpEmailVerification);
  if (corp) {
    const domain = corpEmailDomain(corp.email);
    const directory = Boolean(corp.role && /directory/i.test(corp.role));
    lines.push(
      domain
        ? `Work email @${domain}${directory ? ", checked against the company directory" : ""}`
        : `Work email at ${company}`
    );
  }

  const humans = verifications.filter((record) => !isCorpEmailVerification(record));
  if (humans.length === 1) lines.push("1 colleague confirmation");
  if (humans.length > 1) lines.push(`${humans.length} colleague confirmations`);
  if (docs === 1) lines.push("Employment document");
  if (docs > 1) lines.push(`${docs} employment documents`);

  return lines;
}

export function companyVerificationTooltip(
  company: string,
  verifications: ProofRecord[] = [],
  docs = 0
) {
  const lines = companyProofLines(company, verifications, docs);
  if (lines.length === 0) return "";
  return `${lines.join(". ")}.`;
}

export function publicTrustSummary(input: {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  linkedinVerified?: boolean;
  corroboratedChapters?: number;
  workSamples?: number;
}) {
  const lines: string[] = [];
  const identity = [
    input.emailVerified ? "email" : "",
    input.linkedinVerified ? "LinkedIn" : "",
    input.phoneVerified ? "phone" : ""
  ].filter(Boolean);
  if (identity.length) lines.push(`Identity confirmed: ${identity.join(", ")}`);

  const chapters = input.corroboratedChapters || 0;
  if (chapters === 1) lines.push("1 chapter corroborated");
  if (chapters > 1) lines.push(`${chapters} chapters corroborated`);

  const samples = input.workSamples || 0;
  if (samples === 1) lines.push("1 work sample");
  if (samples > 1) lines.push(`${samples} work samples`);

  return lines;
}

export function firstChapterWithoutColleague<T extends { verifications?: ProofRecord[] }>(chapters: T[]): T | null {
  return (
    chapters.find((chapter) =>
      (chapter.verifications || []).every((record) => isCorpEmailVerification(record))
    ) || null
  );
}

export function postSavePrompt(handle: string, company?: string | null) {
  const slug = String(handle || "").trim().toLowerCase();
  const live = slug ? `Your page is live at verifiedcv.app/${slug}.` : "Your page is live.";
  const place = String(company || "").trim();
  if (!place) return `${live} You can ask a colleague whenever you are ready.`;
  return `${live} Make one chapter more believable. Ask someone who worked with you at ${place}.`;
}
