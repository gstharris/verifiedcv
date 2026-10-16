import { describe, expect, it } from "vitest";
import { isProtectedWrite } from "./proxy";

describe("vault write protection", () => {
  it("gates draft and identity writes, including PATCH", () => {
    expect(isProtectedWrite("PUT", "/api/vault/draft")).toBe(true);
    expect(isProtectedWrite("DELETE", "/api/vault/draft")).toBe(true);
    expect(isProtectedWrite("PATCH", "/api/vault/identity")).toBe(true);
    expect(isProtectedWrite("GET", "/api/vault/draft")).toBe(false);
    expect(isProtectedWrite("GET", "/api/vault")).toBe(false);
  });
});
