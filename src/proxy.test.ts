import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { isProtectedWrite, proxy } from "./proxy";

describe("vault write protection", () => {
  it("gates draft and identity writes, including PATCH", () => {
    expect(isProtectedWrite("PUT", "/api/vault/draft")).toBe(true);
    expect(isProtectedWrite("DELETE", "/api/vault/draft")).toBe(true);
    expect(isProtectedWrite("PATCH", "/api/vault/identity")).toBe(true);
    expect(isProtectedWrite("GET", "/api/vault/draft")).toBe(false);
    expect(isProtectedWrite("GET", "/api/vault")).toBe(false);
  });

  it("marks Studio, admin, and attest pages no-store and leaves public pages alone", () => {
    expect(proxy(new NextRequest("http://localhost/studio")).headers.get("Cache-Control")).toBe("no-store");
    expect(proxy(new NextRequest("http://localhost/admin/reset")).headers.get("Cache-Control")).toBe("no-store");
    expect(proxy(new NextRequest("http://localhost/attest/token")).headers.get("Cache-Control")).toBe("no-store");
    expect(proxy(new NextRequest("http://localhost/gharris")).headers.get("Cache-Control")).toBeNull();
  });
});
