import { describe, expect, it } from "vitest";
import {
  createOAuthState,
  isSafeNextPath,
  confirmedLinkedInLabel,
  confirmedLinkedInProfile,
  linkedInHandle,
  linkedInProfileUrl,
  linkedInVerifiedForWrite,
  mapUserInfoToIdentity,
  preferLinkedInProfile,
  parseOAuthState,
  sanitizeNextPath
} from "./linkedin";

describe("linkedin helpers", () => {
  it("rejects open redirects in next paths", () => {
    expect(isSafeNextPath("/studio")).toBe(true);
    expect(isSafeNextPath("/attest/abc-token")).toBe(true);
    expect(isSafeNextPath("//evil.com")).toBe(false);
    expect(isSafeNextPath("https://evil.com")).toBe(false);
    expect(isSafeNextPath("/\\evil")).toBe(false);
    expect(sanitizeNextPath("https://evil.com", "/studio")).toBe("/studio");
  });

  it("round-trips oauth state and keeps a safe next path", () => {
    const { nonce, state } = createOAuthState("/attest/token-1");
    const parsed = parseOAuthState(state);
    expect(parsed?.nonce).toBe(nonce);
    expect(parsed?.next).toBe("/attest/token-1");
    expect(parseOAuthState("not-valid")).toBeNull();
  });

  it("maps LinkedIn userinfo into a verified identity", () => {
    const identity = mapUserInfoToIdentity({
      sub: "linkedin-member-1",
      name: "Alex Rivera",
      given_name: "Alex",
      family_name: "Rivera",
      email: "alex@example.com",
      email_verified: true,
      picture: "https://media.licdn.com/photo.jpg"
    });

    expect(identity?.sub).toBe("linkedin-member-1");
    expect(identity?.name).toBe("Alex Rivera");
    expect(identity?.email).toBe("alex@example.com");
    expect(identity?.emailVerified).toBe(true);
    expect(mapUserInfoToIdentity({ name: "Missing Sub" })).toBeNull();
    expect(mapUserInfoToIdentity({ sub: "linkedin-member-2", email: "alex@example.com" })?.name).toBe("alex");
  });

  it("shows the confirmed handle and never a typed url", () => {
    expect(confirmedLinkedInLabel({ vanityName: "gstharris", name: "Graham Harris" })).toBe("gstharris");
    expect(confirmedLinkedInLabel({ profileUrl: "https://www.linkedin.com/in/gstharris/", name: "Graham Harris" })).toBe(
      "gstharris"
    );
    expect(confirmedLinkedInLabel({ name: "Graham Harris" })).toBe("Graham Harris");
    expect(linkedInHandle("https://www.linkedin.com/in/gstharris/")).toBe("gstharris");
    expect(linkedInHandle("Graham Harris")).toBe("");
    expect(linkedInProfileUrl("linkedin.com/in/gstharris")).toBe("https://www.linkedin.com/in/gstharris");
    expect(preferLinkedInProfile("linkedin.com/in/gstharris", "Graham Harris")).toBe(
      "https://www.linkedin.com/in/gstharris"
    );
    expect(preferLinkedInProfile("Graham Harris", "Graham Harris")).toBe("");
  });

  it("keeps the résumé handle when LinkedIn sign-in has no public profile url", () => {
    expect(confirmedLinkedInProfile("linkedin.com/in/gstharris", { vanityName: "" })).toEqual({
      linkedin: "https://www.linkedin.com/in/gstharris"
    });
    expect(confirmedLinkedInProfile("", { vanityName: "Graham Harris" })).toBeNull();
    expect(confirmedLinkedInProfile("linkedin.com/in/gstharris", { profileUrl: "https://www.linkedin.com/in/other" })).toEqual({
      linkedin: "https://www.linkedin.com/in/other"
    });
  });

  it("keeps a stored LinkedIn confirmation when a later save repeats the same handle", () => {
    expect(linkedInVerifiedForWrite({
      existingLinkedIn: "https://www.linkedin.com/in/gstharris",
      existingVerified: true,
      incomingLinkedIn: "https://www.linkedin.com/in/gstharris",
      incomingVerified: false
    })).toBe(true);
    expect(linkedInVerifiedForWrite({
      existingLinkedIn: "https://www.linkedin.com/in/gstharris",
      existingVerified: true,
      incomingLinkedIn: "https://www.linkedin.com/in/other",
      incomingVerified: false
    })).toBe(false);
    expect(linkedInVerifiedForWrite({
      existingLinkedIn: "",
      existingVerified: false,
      incomingLinkedIn: "",
      incomingVerified: true
    })).toBe(false);
  });
});
