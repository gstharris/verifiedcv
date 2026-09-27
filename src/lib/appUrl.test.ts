import { afterEach, describe, expect, it } from "vitest";
import { getAppUrl } from "./appUrl";

describe("getAppUrl", () => {
  const originalApp = process.env.NEXT_PUBLIC_APP_URL;
  const originalVercel = process.env.VERCEL_URL;
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalApp;
    process.env.VERCEL_URL = originalVercel;
    process.env.VERCEL_ENV = originalVercelEnv;
  });

  it("prefers NEXT_PUBLIC_APP_URL and canonicalizes the apex domain", () => {
    process.env.VERCEL_ENV = "";
    process.env.NEXT_PUBLIC_APP_URL = "https://verifiedcv.app/";
    expect(getAppUrl()).toBe("https://www.verifiedcv.app");
  });

  it("ignores localhost on Vercel production", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(getAppUrl()).toBe("https://www.verifiedcv.app");
  });
});
