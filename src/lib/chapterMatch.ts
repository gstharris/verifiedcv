export type ChapterAsk<T> =
  | { status: "unrelated" }
  | { status: "next" }
  | { status: "identity"; field: "email" | "linkedin" | "phone" }
  | { status: "missing"; phrase: string }
  | { status: "ambiguous"; phrase: string; chapters: T[] }
  | { status: "match"; phrase: string; chapter: T };

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(inc|llc|ltd|corp|co|the|company)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = i - 1;
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const current = row[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + cost);
      previous = current;
    }
  }
  return row[right.length];
}

function ratio(left: string, right: string) {
  if (!left || !right) return 0;
  if (left === right) return 1;
  return 1 - levenshtein(left, right) / Math.max(left.length, right.length);
}

function nameScore(query: string, company: string) {
  const asked = normalizeName(query);
  if (!asked || !company.trim()) return 0;
  const parts = [company, ...company.split(/\s*[\/|]\s*/)];
  let best = 0;
  for (const part of parts) {
    const name = normalizeName(part);
    if (!name) continue;
    const askedCompact = asked.replace(/ /g, "");
    const nameCompact = name.replace(/ /g, "");
    if (askedCompact === nameCompact) {
      best = 1;
      continue;
    }
    if (askedCompact.length >= 3 && nameCompact.includes(askedCompact)) best = Math.max(best, 0.9);
    if (nameCompact.length >= 3 && askedCompact.startsWith(nameCompact)) best = Math.max(best, 0.9);
    best = Math.max(best, ratio(askedCompact, nameCompact));
    const askedTokens = asked.split(" ").filter(Boolean);
    const nameTokens = name.split(" ").filter(Boolean);
    if (askedTokens.length && nameTokens.length) {
      const covered = askedTokens.map((token) => Math.max(...nameTokens.map((other) => ratio(token, other))));
      best = Math.max(best, covered.reduce((sum, score) => sum + score, 0) / covered.length);
    }
  }
  return best;
}

export function companyPhraseFromRequest(text: string) {
  const match = String(text || "").match(/\b(?:verify|validate|validation|confirm|corroborate|check)\b([\s\S]*)$/i);
  if (!match) return null;
  const rest = match[1]
    .replace(/^(?:\s+(?:my|the|a|an|for|of|time|work|chapter|company|at|please|now|this|that))+/i, "")
    .replace(/\b(please|now|chapter|company)\b/gi, "")
    .replace(/[?.!]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!rest) return null;
  if (/^(it|this|that|next|portfolio|resume|profile|identity)$/i.test(rest)) return null;
  return rest;
}

export function interpretVerificationAsk<T extends { company?: string }>(text: string, chapters: T[]): ChapterAsk<T> {
  const raw = String(text || "").trim();
  const direct = /\b(verify|validate|validation|confirm|corroborate)\b/i.test(raw);
  const check = /\bcheck\b/i.test(raw);
  if (!direct && !check) return { status: "unrelated" };

  const phrase = companyPhraseFromRequest(raw);
  if (!phrase) return direct ? { status: "next" } : { status: "unrelated" };
  if (/^(e-?mail|inbox)$/i.test(phrase)) return { status: "identity", field: "email" };
  if (/^linkedin$/i.test(phrase)) return { status: "identity", field: "linkedin" };
  if (/^(phone|mobile)$/i.test(phrase)) return { status: "identity", field: "phone" };

  const ranked = chapters
    .map((chapter) => ({ chapter, score: nameScore(phrase, chapter.company || "") }))
    .filter((item) => item.score >= 0.82)
    .sort((left, right) => right.score - left.score);

  if (!ranked.length) return direct || check ? { status: "missing", phrase } : { status: "unrelated" };
  const close = ranked.filter((item) => ranked[0].score - item.score <= 0.05);
  if (close.length > 1) return { status: "ambiguous", phrase, chapters: close.map((item) => item.chapter) };
  return { status: "match", phrase, chapter: ranked[0].chapter };
}
