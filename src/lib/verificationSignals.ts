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
    lines.push(domain ? `Corporate email @${domain}` : `Corporate email at ${company}`);
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
  if (lines.length === 0) return "Self-attested. No third-party proof yet.";
  return `Verified via ${lines.join(" + ")}.`;
}
