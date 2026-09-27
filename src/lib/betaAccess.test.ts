import { afterEach, describe, expect, it } from "vitest";
import { isValidBetaCode, isBetaEnforced, betaAcceptsCode } from "./betaAccess";

describe("beta access", () => {
  const originalCode = process.env.BETA_ACCESS_CODE;
  const originalVercel = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.BETA_ACCESS_CODE = originalCode;
    process.env.VERCEL_ENV = originalVercel;
  });

  it("is open when no code is set and not on Vercel production", () => {
    delete process.env.BETA_ACCESS_CODE;
    delete process.env.VERCEL_ENV;
    expect(isBetaEnforced()).toBe(false);
    expect(betaAcceptsCode()).toBe(false);
    expect(isValidBetaCode("anything")).toBe(false);
  });

  it("accepts only the configured code", () => {
    process.env.BETA_ACCESS_CODE = "invite-test";
    expect(isValidBetaCode("invite-test")).toBe(true);
    expect(isValidBetaCode("wrong")).toBe(false);
  });
});
