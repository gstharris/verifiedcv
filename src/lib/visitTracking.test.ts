import { afterEach, describe, expect, it } from "vitest";
import {
  analyticsPath,
  analyticsSearch,
  pageleaveProperties,
  pageviewProperties,
  posthogProxyRewrites,
  resetVisitTracking,
  sanitizeAnalyticsUrl,
  trackNavigation,
  trackPageHide,
  visitSurface
} from "./visitTracking";

describe("visit surfaces", () => {
  it("classifies the public routes", () => {
    expect(visitSurface("/")).toBe("landing");
    expect(visitSurface("/studio")).toBe("studio");
    expect(visitSurface("/gharris")).toBe("dossier");
    expect(visitSurface("/attest/secret-token")).toBe("attest");
    expect(visitSurface("/mock-linkedin")).toBe("other");
  });
});

describe("analytics urls", () => {
  it("hides corroboration tokens and private query values", () => {
    expect(analyticsPath("/attest/one-time-token")).toBe("/attest/[token]");
    expect(analyticsSearch("?token=abc&email=a@b.com&utm_source=linkedin&ref=GHarris")).toBe(
      "utm_source=linkedin&ref=gharris"
    );
    expect(sanitizeAnalyticsUrl("https://www.verifiedcv.app/attest/one-time-token?code=123#secret")).toBe(
      "https://www.verifiedcv.app/attest/[token]"
    );
  });

  it("builds a pageview with the absolute url and dossier handle", () => {
    expect(pageviewProperties({
      pathname: "/GHarris",
      search: "utm_medium=share&phone=555",
      origin: "https://www.verifiedcv.app",
      referrer: "https://www.linkedin.com/in/example"
    })).toEqual({
      $current_url: "https://www.verifiedcv.app/gharris?utm_medium=share",
      $pathname: "/gharris",
      surface: "dossier",
      public_handle: "gharris",
      $referrer: "https://www.linkedin.com/in/example",
      $referring_domain: "www.linkedin.com"
    });
  });

  it("records how long a page was used", () => {
    expect(pageleaveProperties({
      pathname: "/studio",
      origin: "http://localhost:3000",
      startedAt: 1_000,
      endedAt: 6_400
    })).toMatchObject({
      $pathname: "/studio",
      surface: "studio",
      duration_seconds: 5
    });
  });
});

describe("visit session", () => {
  afterEach(() => {
    resetVisitTracking();
  });

  it("records one pageview for a repeated render and a pageleave when the route changes", () => {
    const first = trackNavigation({
      pathname: "/",
      search: "",
      origin: "https://www.verifiedcv.app",
      referrer: "https://news.ycombinator.com/",
      startedAt: 1_000
    });
    const repeat = trackNavigation({
      pathname: "/",
      origin: "https://www.verifiedcv.app",
      startedAt: 1_500
    });
    const next = trackNavigation({
      pathname: "/studio",
      origin: "https://www.verifiedcv.app",
      startedAt: 4_200
    });

    expect(first.pageview).toMatchObject({
      $pathname: "/",
      surface: "landing",
      $referrer: "https://news.ycombinator.com/"
    });
    expect(repeat).toEqual({ pageview: null, pageleave: null });
    expect(next.pageleave).toMatchObject({ $pathname: "/", duration_seconds: 3 });
    expect(next.pageview).toMatchObject({
      $pathname: "/studio",
      surface: "studio",
      $referrer: "https://www.verifiedcv.app/"
    });
  });

  it("records a single pageleave when the visitor leaves", () => {
    trackNavigation({ pathname: "/studio", origin: "https://www.verifiedcv.app", startedAt: 0 });
    const leave = trackPageHide(2_500);
    expect(leave).toMatchObject({ surface: "studio", duration_seconds: 3 });
    expect(trackPageHide(9_000)).toBeNull();
  });
});

describe("posthog proxy", () => {
  it("keeps collection on this site and forwards to PostHog", () => {
    expect(posthogProxyRewrites()).toEqual([
      {
        source: "/vc-collect/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*"
      },
      {
        source: "/vc-collect/:path*",
        destination: "https://us.i.posthog.com/:path*"
      }
    ]);
    expect(posthogProxyRewrites("https://eu.i.posthog.com")[1].destination).toBe(
      "https://eu.i.posthog.com/:path*"
    );
  });
});
