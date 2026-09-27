import { describe, expect, it } from "vitest";
import {
  createOAuthState,
  isSafeNextPath,
  mapUserInfoToIdentity,
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
  });
});
