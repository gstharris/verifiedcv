import { describe, expect, it } from "vitest";
import {
  authorizeVaultWrite,
  createOwnerToken,
  emailsMatch,
  hashOwnerToken,
  parseHandleOwnerCookie,
  serializeHandleOwnerCookie
} from "./handleOwner";

describe("handle ownership", () => {
  it("round-trips the owner cookie", () => {
    const token = createOwnerToken();
    const encoded = serializeHandleOwnerCookie({ handle: "gharris", token });
    expect(parseHandleOwnerCookie(encoded)).toEqual({ handle: "gharris", token });
    expect(parseHandleOwnerCookie("not-valid")).toBeNull();
  });

  it("hashes tokens stably", () => {
    const token = "abc123";
    expect(hashOwnerToken(token)).toBe(hashOwnerToken(token));
    expect(hashOwnerToken(token)).not.toBe(hashOwnerToken("other"));
  });

  it("mints a token for a new handle", () => {
    const decision = authorizeVaultWrite({
      handle: "gharris",
      incomingEmail: "graham@example.com",
      existing: null,
      cookie: null
    });
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.isNewClaim).toBe(true);
      expect(decision.tokenToSet.length).toBeGreaterThan(20);
    }
  });

  it("blocks a claimed handle without the owner cookie", () => {
    const token = createOwnerToken();
    const decision = authorizeVaultWrite({
      handle: "gharris",
      incomingEmail: "other@example.com",
      existing: { email: "graham@example.com", owner_token_hash: hashOwnerToken(token) },
      cookie: null
    });
    expect(decision.ok).toBe(false);
  });

  it("allows the owner cookie to keep writing", () => {
    const token = createOwnerToken();
    const decision = authorizeVaultWrite({
      handle: "gharris",
      incomingEmail: "graham@example.com",
      existing: { email: "graham@example.com", owner_token_hash: hashOwnerToken(token) },
      cookie: { handle: "gharris", token }
    });
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.isNewClaim).toBe(false);
      expect(decision.tokenToSet).toBe(token);
    }
  });

  it("lets the matching email claim a legacy handle with no hash", () => {
    const decision = authorizeVaultWrite({
      handle: "gharris",
      incomingEmail: "graham@example.com",
      existing: { email: "graham@example.com", owner_token_hash: null },
      cookie: null
    });
    expect(decision.ok).toBe(true);
    if (decision.ok) expect(decision.isNewClaim).toBe(true);
    expect(emailsMatch("Graham@example.com", "graham@example.com")).toBe(true);
  });
});
