import { companiesMatch, parseTenureRange } from "@/lib/tenureOverlap";

export type EmploymentDocumentClass = "w2" | "offer" | "contract" | "paystub" | null;

export type DocumentMatch = {
  ok: boolean;
  companyMatched: boolean;
  yearMatched: boolean;
  nameMatched: boolean;
  documentClass: EmploymentDocumentClass;
  extractedYears: number[];
  reason: string;
};

export function classifyEmploymentDocument(text: string): EmploymentDocumentClass {
  const haystack = String(text || "").toLowerCase();
  if (/\bform\s*w-?2\b|\bwage and tax statement\b/.test(haystack)) return "w2";
  if (/\boffer of employment\b|\boffer letter\b/.test(haystack)) return "offer";
  if (/\bemployment agreement\b|\bemployment contract\b/.test(haystack)) return "contract";
  if (/\bpay\s*stub\b|\bearnings statement\b|\bpaycheck\b/.test(haystack)) return "paystub";
  return null;
}

function lettersOnly(value: string) {
  return value.replace(/[^a-zA-Z]/g, "");
}

export function extractYears(text: string): number[] {
  const matches = String(text || "").match(/\b(?:19|20)\d{2}\b/g) || [];
  return [...new Set(matches.map(Number))].filter((year) => year >= 1970 && year <= 2035);
}

export function chapterYears(period: string): number[] {
  const range = parseTenureRange(period);
  if (range) {
    const years: number[] = [];
    for (let year = range.start.year; year <= range.end.year; year += 1) {
      years.push(year);
    }
    return years;
  }
  return extractYears(period);
}

export function companyMentioned(company: string, documentText: string): boolean {
  const raw = String(company || "").trim();
  if (!raw || !documentText.trim()) return false;
  if (companiesMatch(raw, documentText)) return true;

  const parts = raw
    .split(/\s*[\/|]\s*/)
    .map((part) => part.trim())
    .filter((part) => lettersOnly(part).length >= 3);

  return parts.some((part) => companiesMatch(part, documentText));
}

export function candidateNameInDocument(fullName: string, documentText: string): boolean {
  const parts = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter((part) => lettersOnly(part).length >= 3);
  if (parts.length === 0) return false;

  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z]/g, "");
  const doc = normalize(documentText);
  const last = normalize(parts[parts.length - 1]);
  if (!last || !doc.includes(last)) return false;
  if (parts.length === 1) return true;
  const first = normalize(parts[0]);
  return !first || doc.includes(first) || lettersOnly(parts[parts.length - 1]).length >= 5;
}

export function matchEmploymentDocument(opts: {
  text: string;
  company: string;
  period: string;
  candidateName?: string;
  extractedEmployer?: string;
}): DocumentMatch {
  const text = String(opts.text || "");
  const companyMatched =
    companyMentioned(opts.company, text) ||
    Boolean(opts.extractedEmployer && companiesMatch(opts.company, opts.extractedEmployer));

  const years = chapterYears(opts.period);
  const extractedYears = extractYears(text);
  const yearMatched = years.some((year) => extractedYears.includes(year));
  const nameMatched = candidateNameInDocument(opts.candidateName || "", text);
  const documentClass = classifyEmploymentDocument(text);

  if (!companyMatched) {
    return {
      ok: false,
      companyMatched,
      yearMatched,
      nameMatched,
      documentClass,
      extractedYears,
      reason: `This file does not name ${opts.company || "that employer"}.`
    };
  }

  if (!nameMatched) {
    return {
      ok: false,
      companyMatched,
      yearMatched,
      nameMatched,
      documentClass,
      extractedYears,
      reason: "This file does not include your name."
    };
  }

  if (!yearMatched) {
    return {
      ok: false,
      companyMatched,
      yearMatched,
      nameMatched,
      documentClass,
      extractedYears,
      reason: "Could not find an overlapping year from this chapter in the file."
    };
  }

  if (!documentClass) {
    return {
      ok: false,
      companyMatched,
      yearMatched,
      nameMatched,
      documentClass,
      extractedYears,
      reason: "This does not look like a W-2, offer letter, employment contract, or pay stub."
    };
  }

  return {
    ok: true,
    companyMatched,
    yearMatched,
    nameMatched,
    documentClass,
    extractedYears,
    reason: "Employer, your name, overlapping year, and document type matched."
  };
}
