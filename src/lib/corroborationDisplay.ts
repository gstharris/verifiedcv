export type CorroborationRecord = {
  name?: string;
  role?: string;
};

function articleFor(title: string) {
  return /^[aeiou]/i.test(title.trim()) ? "an" : "a";
}

export function publicTitleFromVerification(record: CorroborationRecord) {
  const name = String(record.name || "").trim();
  const role = String(record.role || "").trim();
  const overlapLike = /^overlapped\b/i.test(role);

  const strip = (value: string) =>
    value
      .replace(/^former\s+/i, "")
      .replace(/\s*@\s*.+$/i, "")
      .replace(/\s*\([^)]*\)\s*$/g, "")
      .trim();

  const fromName = strip(name);
  if (fromName && !/^colleague$/i.test(fromName)) return fromName;
  if (role && !overlapLike) {
    const fromRole = strip(role);
    if (fromRole) return fromRole;
  }
  return "colleague";
}

export function corroborationHeadline(company: string, verifications: CorroborationRecord[]) {
  const count = verifications.length;
  const place = String(company || "this company").trim() || "this company";
  if (count <= 0) return "";
  if (count === 1) {
    const title = publicTitleFromVerification(verifications[0]);
    return `Confirmed by ${articleFor(title)} ${title} at ${place}`;
  }
  return `Corroborated by ${count} LinkedIn members who worked at ${place}`;
}
