const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12
};

export type MonthYear = { year: number; month: number };

function parseMonthYear(token: string, bound: "start" | "end"): MonthYear | null {
  const cleaned = token.replace(/\./g, " ").replace(/,/g, " ").trim();
  if (/^(present|now|current)$/i.test(cleaned)) {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  }

  const monthYear = cleaned.match(/^([a-z]+)\s+(\d{4})$/i);
  if (monthYear) {
    const month = MONTHS[monthYear[1].toLowerCase()];
    const year = Number(monthYear[2]);
    if (month && year) return { year, month };
  }

  const yearMonth = cleaned.match(/^(\d{4})-(\d{1,2})$/);
  if (yearMonth) {
    return { year: Number(yearMonth[1]), month: Number(yearMonth[2]) };
  }

  const yearOnly = cleaned.match(/^(\d{4})$/);
  if (yearOnly) {
    return { year: Number(yearOnly[1]), month: bound === "end" ? 12 : 1 };
  }

  return null;
}

export function parseTenureRange(period: string): { start: MonthYear; end: MonthYear } | null {
  const parts = String(period || "")
    .split(/\s*(?:—|–|-|\bto\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const start = parseMonthYear(parts[0], "start");
  const end = parseMonthYear(parts[parts.length - 1], "end");
  if (!start || !end) return null;
  return { start, end };
}

export function formatTenurePeriod(
  startMonth: string,
  startYear: string,
  endMonth: string,
  endYear: string,
  present: boolean
) {
  const start = `${startMonth} ${startYear}`.trim();
  const end = present ? "Present" : `${endMonth} ${endYear}`.trim();
  return `${start} — ${end}`;
}

export function overlapCaption(attestorPeriod: string, months: number) {
  return `Overlapped ${attestorPeriod} · ${months} month${months === 1 ? "" : "s"} (stated)`;
}

function toIndex(point: MonthYear) {
  return point.year * 12 + (point.month - 1);
}

export function overlapMonths(
  candidatePeriod: string,
  attestorPeriod: string
): { ok: boolean; months: number; label: string } {
  const candidate = parseTenureRange(candidatePeriod);
  const attestor = parseTenureRange(attestorPeriod);
  if (!candidate || !attestor) {
    return { ok: false, months: 0, label: "Could not read those dates." };
  }

  const start = Math.max(toIndex(candidate.start), toIndex(attestor.start));
  const end = Math.min(toIndex(candidate.end), toIndex(attestor.end));
  const months = end >= start ? end - start + 1 : 0;
  return {
    ok: months >= 1,
    months,
    label: months >= 1 ? `${months} overlapping month${months === 1 ? "" : "s"}` : "Those dates do not overlap."
  };
}

export function companiesMatch(left: string, right: string) {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(inc|llc|ltd|corp|co|the)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}
