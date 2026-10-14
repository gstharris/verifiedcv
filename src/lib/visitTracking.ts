export const VISIT_COLLECT_PATH = "/vc-collect";

const RESERVED_SURFACES = new Set([
  "studio",
  "attest",
  "auth",
  "api",
  "verify",
  "mock-linkedin",
  "ingest",
  "vc-collect"
]);

const ALLOWED_QUERY = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"] as const;

export type VisitSurface = "landing" | "studio" | "dossier" | "attest" | "other";

export type PageviewInput = {
  pathname: string;
  search?: string;
  origin?: string;
  referrer?: string;
};

export type ActiveVisit = PageviewInput & {
  key: string;
  startedAt: number;
  left: boolean;
};

function stripQuery(pathname: string) {
  const raw = (pathname || "/").split("?")[0].split("#")[0] || "/";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.length > 1 && withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}

export function visitSurface(pathname: string): VisitSurface {
  const path = stripQuery(pathname);
  if (path === "/") return "landing";
  const parts = path.split("/").filter(Boolean);
  const first = parts[0];
  if (!first) return "landing";
  if (first === "studio") return "studio";
  if (first === "attest") return "attest";
  if (parts.length === 1 && !RESERVED_SURFACES.has(first)) return "dossier";
  return "other";
}

export function publicHandle(pathname: string) {
  if (visitSurface(pathname) !== "dossier") return null;
  const handle = stripQuery(pathname).split("/").filter(Boolean)[0];
  return handle ? handle.toLowerCase() : null;
}

export function analyticsPath(pathname: string) {
  const path = stripQuery(pathname);
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "attest" && parts.length > 1) return "/attest/[token]";
  if (visitSurface(path) === "dossier" && parts[0]) return `/${parts[0].toLowerCase()}`;
  return path;
}

export function analyticsSearch(search: string) {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const kept = new URLSearchParams();
  for (const key of ALLOWED_QUERY) {
    const value = params.get(key);
    if (!value) continue;
    if (key === "ref" && !/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(value)) continue;
    kept.set(key, key === "ref" ? value.toLowerCase() : value);
  }
  return kept.toString();
}

export function visitKey(pathname: string, search = "") {
  const path = analyticsPath(pathname);
  const query = analyticsSearch(search);
  return query ? `${path}?${query}` : path;
}

export function sanitizeAnalyticsUrl(value: string) {
  if (!value) return value;
  try {
    const url = new URL(value, "https://verifiedcv.local");
    const path = analyticsPath(url.pathname);
    const search = analyticsSearch(url.search);
    const relative = search ? `${path}?${search}` : path;
    if (value.startsWith("/") && !value.startsWith("//")) return relative;
    if (/^https?:\/\//i.test(value)) return `${url.origin}${relative}`;
  } catch {
    return analyticsPath(value);
  }
  return analyticsPath(value);
}

export function pageviewProperties(input: PageviewInput) {
  const pathname = analyticsPath(input.pathname || "/");
  const search = analyticsSearch(input.search || "");
  const path = search ? `${pathname}?${search}` : pathname;
  const origin = (input.origin || "").replace(/\/$/, "");
  const properties: Record<string, string> = {
    $current_url: origin ? `${origin}${path}` : path,
    $pathname: pathname,
    surface: visitSurface(input.pathname || "/")
  };
  const handle = publicHandle(input.pathname || "/");
  if (handle) properties.public_handle = handle;
  if (input.referrer) {
    const referrer = sanitizeAnalyticsUrl(input.referrer);
    if (referrer) {
      properties.$referrer = referrer;
      try {
        properties.$referring_domain = new URL(input.referrer).hostname;
      } catch {
        // A relative referrer has no hostname.
      }
    }
  }
  return properties;
}

export function pageleaveProperties(input: PageviewInput & { startedAt: number; endedAt: number }) {
  return {
    ...pageviewProperties(input),
    duration_seconds: Math.max(0, Math.round((input.endedAt - input.startedAt) / 1000))
  };
}

let activeVisit: ActiveVisit | null = null;

export function resetVisitTracking() {
  activeVisit = null;
}

export function trackNavigation(input: PageviewInput & { startedAt: number }) {
  const key = visitKey(input.pathname, input.search);
  if (activeVisit && activeVisit.key === key && !activeVisit.left) {
    return { pageview: null, pageleave: null };
  }

  const pageleave = activeVisit && !activeVisit.left
    ? pageleaveProperties({ ...activeVisit, endedAt: input.startedAt })
    : null;
  const referrer = activeVisit ? pageviewProperties(activeVisit).$current_url : input.referrer;
  activeVisit = {
    pathname: input.pathname,
    search: input.search,
    origin: input.origin,
    referrer,
    key,
    startedAt: input.startedAt,
    left: false
  };
  return { pageview: pageviewProperties(activeVisit), pageleave };
}

export function trackPageHide(endedAt: number) {
  if (!activeVisit || activeVisit.left) return null;
  const pageleave = pageleaveProperties({ ...activeVisit, endedAt });
  activeVisit = { ...activeVisit, left: true };
  return pageleave;
}

const DEFAULT_POSTHOG_API = "https://us.i.posthog.com";
const DEFAULT_POSTHOG_ASSETS = "https://us-assets.i.posthog.com";

export function posthogUpstreams(configuredHost = process.env.NEXT_PUBLIC_POSTHOG_HOST) {
  const host = configuredHost?.trim().replace(/\/$/, "") || "";
  if (host.includes("eu.i.posthog.com") || host.includes("eu.posthog.com")) {
    return { api: "https://eu.i.posthog.com", assets: "https://eu-assets.i.posthog.com" };
  }
  return { api: DEFAULT_POSTHOG_API, assets: DEFAULT_POSTHOG_ASSETS };
}

export function posthogProxyRewrites(configuredHost?: string) {
  const { api, assets } = posthogUpstreams(configuredHost);
  return [
    {
      source: `${VISIT_COLLECT_PATH}/static/:path*`,
      destination: `${assets}/static/:path*`
    },
    {
      source: `${VISIT_COLLECT_PATH}/:path*`,
      destination: `${api}/:path*`
    }
  ];
}
