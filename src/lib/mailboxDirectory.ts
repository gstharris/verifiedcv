import { companyTokens, emailDomain, type MailboxDirectoryStatus } from "./corporateEmail";
import { companiesMatch } from "./tenureOverlap";

export type MailboxDirectoryReport = {
  status: MailboxDirectoryStatus;
  score: number | null;
  smtpCheck: boolean | null;
  mxRecords: boolean | null;
  sourceCount: number;
  organization: string;
  listedInDirectory: boolean;
  summary: string;
};

type HunterVerifierData = {
  status?: string;
  score?: number;
  regexp?: boolean;
  gibberish?: boolean;
  disposable?: boolean;
  webmail?: boolean;
  mx_records?: boolean;
  smtp_server?: boolean;
  smtp_check?: boolean;
  accept_all?: boolean;
  block?: boolean;
  sources?: unknown[];
};

type HunterDomainData = {
  organization?: string;
  emails?: Array<{ value?: string }>;
};

export function hunterApiKey() {
  return String(process.env.HUNTER_API_KEY || "").trim();
}

export function directoryLookupRequired() {
  return process.env.VERIFIEDCV_REQUIRE_HUNTER === "1" || process.env.NODE_ENV === "production";
}

export function directoryOrganizationMatches(company: string, organization: string) {
  const org = String(organization || "").trim();
  if (!org) return null;
  if (companiesMatch(company, org)) return true;
  const compactOrg = org.toLowerCase().replace(/[^a-z0-9]/g, "");
  return companyTokens(company).some((token) => {
    if (token.length < 4) return compactOrg === token;
    return compactOrg.includes(token);
  });
}

export function decideMailboxDirectory(input: {
  company: string;
  email: string;
  configured: boolean;
  requireDirectory: boolean;
  verifier?: HunterVerifierData | null;
  verifierError?: boolean;
  organization?: string;
  directoryEmails?: string[];
}): MailboxDirectoryReport {
  const empty = (status: MailboxDirectoryStatus, summary: string): MailboxDirectoryReport => ({
    status,
    score: null,
    smtpCheck: null,
    mxRecords: null,
    sourceCount: 0,
    organization: "",
    listedInDirectory: false,
    summary
  });

  if (!input.configured) {
    if (input.requireDirectory) {
      return empty("invalid", "Corporate directory lookup is not configured.");
    }
    return empty("skipped", "Directory lookup skipped.");
  }

  if (input.verifierError || !input.verifier) {
    if (input.requireDirectory) {
      return empty("unknown", "The company directory could not be reached. Try again in a moment.");
    }
    return empty("unknown", "Directory lookup was inconclusive.");
  }

  const verifier = input.verifier;
  const statusRaw = String(verifier.status || "unknown").toLowerCase();
  const score = typeof verifier.score === "number" ? verifier.score : null;
  const listedInDirectory = (input.directoryEmails || []).some(
    (value) => value.toLowerCase().trim() === input.email.toLowerCase().trim()
  );
  const organization = String(input.organization || "").trim();
  const orgMatch = directoryOrganizationMatches(input.company, organization);

  const report = (status: MailboxDirectoryStatus, summary: string): MailboxDirectoryReport => ({
    status,
    score,
    smtpCheck: typeof verifier.smtp_check === "boolean" ? verifier.smtp_check : null,
    mxRecords: typeof verifier.mx_records === "boolean" ? verifier.mx_records : null,
    sourceCount: Array.isArray(verifier.sources) ? verifier.sources.length : 0,
    organization,
    listedInDirectory,
    summary
  });

  if (verifier.disposable || statusRaw === "disposable") {
    return report("invalid", "That address is from a disposable email service.");
  }
  if (verifier.webmail || statusRaw === "webmail") {
    return report("invalid", "Use a company inbox, not a personal webmail address.");
  }
  if (verifier.gibberish) {
    return report("invalid", "That mailbox looks automatically generated, not an issued work inbox.");
  }
  if (statusRaw === "invalid") {
    return report("invalid", "That mailbox does not appear to exist at this company.");
  }
  if (verifier.mx_records === false) {
    return report("invalid", `${emailDomain(input.email)} does not appear to accept company email.`);
  }
  if (orgMatch === false) {
    return report(
      "invalid",
      `Public records list ${organization} on that domain, which does not match ${input.company}.`
    );
  }
  if (statusRaw === "valid" && score !== null && score < 50) {
    return report("invalid", "The company directory has low confidence that mailbox exists.");
  }
  if (statusRaw === "valid" && verifier.smtp_check === false && !verifier.accept_all && !verifier.block) {
    return report("invalid", "That mailbox was rejected by the company mail server.");
  }

  if (statusRaw === "valid") {
    return report(
      "valid",
      listedInDirectory
        ? `Public company directory listed this inbox${score !== null ? ` (score ${score})` : ""}.`
        : `Company mailbox confirmed${score !== null ? ` (score ${score})` : ""}.`
    );
  }

  if (statusRaw === "accept_all" || verifier.accept_all) {
    return report(
      "accept_all",
      "This company accepts all addresses at that domain. The inbox code is what proves you can open it."
    );
  }

  if (input.requireDirectory && statusRaw === "unknown" && verifier.block !== true) {
    return report("unknown", "The company directory could not confirm that mailbox. Try a different work inbox.");
  }

  return report("unknown", "Directory lookup was inconclusive. The inbox code still has to be received.");
}

export function directoryProofLabel(report: MailboxDirectoryReport) {
  if (report.listedInDirectory) return "Public directory + mailbox + inbox code";
  if (report.status === "valid") return "Mailbox directory + inbox code";
  if (report.status === "accept_all") return "Company mail server + inbox code";
  return "Inbox code";
}

async function hunterGet<T>(path: string, query: Record<string, string>, key: string): Promise<T | null> {
  const url = new URL(`https://api.hunter.io/v2/${path}`);
  for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
  url.searchParams.set("api_key", key);
  const res = await fetch(url);
  if (res.status === 202) return null;
  if (!res.ok) return null;
  const payload = (await res.json()) as { data?: T };
  return payload.data || null;
}

export async function lookupMailboxDirectory(
  email: string,
  company = ""
): Promise<MailboxDirectoryReport> {
  const key = hunterApiKey();
  const requireDirectory = directoryLookupRequired();
  if (!key) {
    return decideMailboxDirectory({
      company,
      email,
      configured: false,
      requireDirectory
    });
  }

  try {
    const domain = emailDomain(email);
    const [verifier, domainInfo] = await Promise.all([
      hunterGet<HunterVerifierData>("email-verifier", { email }, key),
      domain
        ? hunterGet<HunterDomainData>("domain-search", { domain, limit: "1" }, key)
        : Promise.resolve(null)
    ]);

    return decideMailboxDirectory({
      company,
      email,
      configured: true,
      requireDirectory,
      verifier,
      verifierError: !verifier,
      organization: domainInfo?.organization || "",
      directoryEmails: (domainInfo?.emails || []).map((row) => String(row.value || "")).filter(Boolean)
    });
  } catch {
    return decideMailboxDirectory({
      company,
      email,
      configured: true,
      requireDirectory,
      verifierError: true
    });
  }
}
