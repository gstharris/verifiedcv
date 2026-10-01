import type { LinkedInIdentity } from "@/lib/linkedin";

const THROWAWAY_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "10minutemail.com",
  "yopmail.com",
  "trashmail.com"
]);

export function assessLinkedInIdentity(identity: LinkedInIdentity | null) {
  if (!identity?.sub) {
    return { ok: false, message: "LinkedIn sign-in did not return an account." };
  }

  const email = String(identity.email || "").toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return { ok: false, message: "This LinkedIn account needs a verified email before it can confirm." };
  }

  const domain = email.split("@")[1] || "";
  if (THROWAWAY_EMAIL_DOMAINS.has(domain)) {
    return { ok: false, message: "Use a durable email on the LinkedIn account, not a throwaway address." };
  }

  if (identity.emailVerified !== true) {
    return {
      ok: false,
      message: "This LinkedIn email is not verified. Verify it on LinkedIn, then sign in again."
    };
  }

  const given = String(identity.givenName || "").trim();
  const family = String(identity.familyName || "").trim();
  const nameParts = String(identity.name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const hasPersonName =
    (given.length > 0 && family.length > 0) ||
    (nameParts.length >= 2 && identity.name !== "LinkedIn member");
  if (!hasPersonName) {
    return { ok: false, message: "This LinkedIn account needs a first and last name before it can confirm." };
  }

  const picture = String(identity.picture || "");
  if (!picture || !/licdn\.com|linkedin\.com/i.test(picture)) {
    return {
      ok: false,
      message: "This LinkedIn account needs a profile photo before it can confirm. Add one on LinkedIn, then sign in again."
    };
  }

  return { ok: true, message: "" };
}

export function emailsMatch(left?: string, right?: string) {
  const a = String(left || "").toLowerCase().trim();
  const b = String(right || "").toLowerCase().trim();
  return Boolean(a && b && a === b);
}
