const SKIPPED = new Set([
  "inc",
  "llc",
  "ltd",
  "corp",
  "co",
  "company",
  "the",
  "enterprises",
  "enterprise",
  "group",
  "labs",
  "holdings",
  "and"
]);

export function companySiteGuesses(name: string) {
  const parts = String(name || "")
    .split(/\s*[/|]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .reverse();
  const hosts: string[] = [];
  for (const part of parts) {
    const words = part
      .toLowerCase()
      .replace(/&/g, " and ")
      .split(/[^a-z0-9]+/)
      .filter((word) => word && !SKIPPED.has(word));
    if (!words.length) continue;
    const joined = words.join("");
    const hyphenated = words.join("-");
    if (joined.length >= 2 && joined.length <= 48) hosts.push(`${joined}.com`);
    if (hyphenated !== joined && hyphenated.length >= 3 && hyphenated.length <= 48) hosts.push(`${hyphenated}.com`);
  }
  const urls = hosts.flatMap((host) => [`https://www.${host}`, `https://${host}`]);
  return [...new Set(urls)].slice(0, 4);
}

export function faviconUrl(pageUrl: string) {
  try {
    const host = new URL(pageUrl).hostname;
    if (!host) return "";
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  } catch {
    return "";
  }
}

export function publicHttpsUrl(value: string) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    const host = url.hostname.toLowerCase();
    if (!host.includes(".") || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return "";
    if (/^(127\.|10\.|192\.168\.|0\.0\.0\.0|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function siteLabel(pageUrl: string) {
  try {
    return new URL(pageUrl).hostname.replace(/^www\./, "");
  } catch {
    return pageUrl;
  }
}
