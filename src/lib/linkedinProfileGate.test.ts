import { describe, expect, it } from "vitest";
import { assessLinkedInIdentity, emailsMatch } from "./linkedinProfileGate";
import type { LinkedInIdentity } from "./linkedin";

function identity(overrides: Partial<LinkedInIdentity> = {}): LinkedInIdentity {
  return {
    sub: "linkedin-member-1",
    name: "Alex Rivera",
    givenName: "Alex",
    familyName: "Rivera",
    email: "alex@example.com",
    emailVerified: true,
    picture: "https://media.licdn.com/photo.jpg",
    authenticatedAt: new Date().toISOString(),
    ...overrides
  };
}

describe("LinkedIn identity gate", () => {
  it("accepts a named account with verified email and photo", () => {
    expect(assessLinkedInIdentity(identity()).ok).toBe(true);
  });

  it("rejects missing verified email, throwaway domains, and missing photos", () => {
    expect(assessLinkedInIdentity(identity({ emailVerified: false })).ok).toBe(false);
    expect(assessLinkedInIdentity(identity({ email: "temp@mailinator.com" })).ok).toBe(false);
    expect(assessLinkedInIdentity(identity({ picture: undefined })).ok).toBe(false);
    expect(assessLinkedInIdentity(identity({ name: "alex", givenName: undefined, familyName: undefined })).ok).toBe(
      false
    );
  });

  it("detects matching emails", () => {
    expect(emailsMatch("Alex@Yahoo.com", "alex@yahoo.com")).toBe(true);
    expect(emailsMatch("a@x.com", "b@x.com")).toBe(false);
  });
});
