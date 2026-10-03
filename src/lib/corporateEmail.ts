const CONSUMER_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "gmx.com",
  "mail.com",
  "zoho.com",
  "icloud.com"
]);

const LEGAL_SUFFIXES = new Set([
  "inc",
  "llc",
  "ltd",
  "corp",
  "corporation",
  "company",
  "co",
  "enterprises",
  "group",
  "holdings",
  "the"
]);

const COMPANY_DOMAIN_ALIASES: Record<string, string[]> = {
  google: ["google.com"],
  alphabet: ["abc.xyz", "google.com"],
  meta: ["meta.com", "facebook.com"],
  facebook: ["facebook.com", "meta.com"],
  amazon: ["amazon.com"],
  microsoft: ["microsoft.com"],
  apple: ["apple.com"]
};

function lettersAndDigits(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function emailDomain(email: string) {
  return String(email || "")
    .toLowerCase()
    .trim()
    .split("@")[1]
    ?.replace(/\.$/, "") || "";
}

export function isConsumerEmailDomain(domain: string) {
  return CONSUMER_EMAIL_DOMAINS.has(domain.toLowerCase().trim());
}

export function companyTokens(company: string) {
  const tokens = new Set<string>();
  const parts = String(company || "")
    .split(/[\s/|,]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const compact = lettersAndDigits(part);
    if (compact.length >= 2 && !LEGAL_SUFFIXES.has(compact)) {
      tokens.add(compact);
    }
  }

  const joined = lettersAndDigits(company);
  if (joined.length >= 4) tokens.add(joined);
  return [...tokens];
}

export function corporateEmailMatchesCompany(company: string, email: string) {
  const domain = emailDomain(email);
  if (!domain) {
    return { ok: false, reason: "Enter a valid work email." };
  }
  if (isConsumerEmailDomain(domain)) {
    return {
      ok: false,
      reason: "Use a company email, not Gmail, Yahoo, Outlook, or another personal inbox."
    };
  }

  const host = domain.replace(/^(mail|email|smtp)\./, "");
  const hostCore = lettersAndDigits(host.split(".")[0] || "");
  const hostCompact = lettersAndDigits(host);
  const tokens = companyTokens(company);
  const aliases = tokens.flatMap((token) => COMPANY_DOMAIN_ALIASES[token] || []);

  if (aliases.some((alias) => host === alias || host.endsWith(`.${alias}`))) {
    return { ok: true, reason: "" };
  }

  const matched = tokens.some((token) => {
    if (token.length >= 4) {
      return hostCompact.includes(token) || hostCore.includes(token);
    }
    return hostCore === token;
  });

  if (!matched) {
    return {
      ok: false,
      reason: `That email domain does not match ${company}. Use an inbox issued by this employer.`
    };
  }

  return { ok: true, reason: "" };
}
