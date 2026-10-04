import {
  corporateEmailMatchesCompany,
  emailDomain,
  type MailboxDirectoryStatus,
  type MailExchangeLookup
} from "./corporateEmail";
import type { MailboxDirectoryReport } from "./mailboxDirectory";

export async function domainHasMailExchange(domain: string): Promise<boolean> {
  const host = String(domain || "").toLowerCase().trim();
  if (!host) return false;
  try {
    const { resolveMx } = await import("node:dns/promises");
    const records = await resolveMx(host);
    return Array.isArray(records) && records.some((record) => Boolean(record?.exchange));
  } catch {
    return false;
  }
}

function mailboxReport(
  mailbox?: MailboxDirectoryReport | MailboxDirectoryStatus
): MailboxDirectoryReport | null {
  if (!mailbox) return null;
  if (typeof mailbox === "string") {
    return {
      status: mailbox,
      score: null,
      smtpCheck: null,
      mxRecords: null,
      sourceCount: 0,
      organization: "",
      listedInDirectory: false,
      summary:
        mailbox === "invalid"
          ? "That mailbox does not appear to exist at this company. Use the inbox they issued you."
          : ""
    };
  }
  return mailbox;
}

export async function assessCorporateEmail(
  company: string,
  email: string,
  options?: {
    lookupMx?: MailExchangeLookup;
    mailbox?: MailboxDirectoryReport | MailboxDirectoryStatus;
    mailboxStatus?: MailboxDirectoryStatus;
  }
) {
  const match = corporateEmailMatchesCompany(company, email);
  if (!match.ok) return match;

  const domain = emailDomain(email);
  const lookup = options?.lookupMx || domainHasMailExchange;
  const hasMx = await lookup(domain);
  if (!hasMx) {
    return {
      ok: false,
      reason: `${domain} does not appear to accept company email. No mail servers were found for that domain.`
    };
  }

  const directory = mailboxReport(options?.mailbox || options?.mailboxStatus);
  if (directory?.status === "invalid") {
    return {
      ok: false,
      reason: directory.summary || "That mailbox does not appear to exist at this company. Use the inbox they issued you."
    };
  }
  if (directory?.status === "unknown" && directory.summary && /could not confirm/i.test(directory.summary)) {
    return { ok: false, reason: directory.summary };
  }

  return { ok: true, reason: directory?.summary || "" };
}
