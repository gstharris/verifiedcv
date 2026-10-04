export const PORTFOLIO_ASSET_TYPES = [
  "project",
  "prototype",
  "app",
  "presentation",
  "certification",
  "patent",
  "link"
] as const;

export type PortfolioAssetType = (typeof PORTFOLIO_ASSET_TYPES)[number];
export type RecruiterLayout = "traditional" | "hybrid" | "creative";
export type AssetVerificationStatus = "unverified" | "link_checked" | "registry";

export type PortfolioAsset = {
  id: string;
  title: string;
  description?: string;
  url?: string;
  type: PortfolioAssetType;
  issuer?: string;
  issuedAt?: string;
  verificationStatus: AssetVerificationStatus;
  verificationNote?: string;
};

export function assetTypeLabel(type: PortfolioAssetType) {
  if (type === "app") return "App";
  if (type === "prototype") return "Prototype";
  if (type === "presentation") return "Presentation";
  if (type === "certification") return "Certification";
  if (type === "patent") return "Patent";
  if (type === "link") return "Link";
  return "Project";
}

export function assessPortfolioAssetLink(url: string, type: PortfolioAssetType) {
  const trimmed = String(url || "").trim();
  if (!trimmed) {
    return {
      verificationStatus: "unverified" as const,
      verificationNote: "Add a public URL so recruiters can open this work."
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      verificationStatus: "unverified" as const,
      verificationNote: "That URL is not valid."
    };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return {
      verificationStatus: "unverified" as const,
      verificationNote: "Use an http or https link."
    };
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();

  if (type === "certification" && (host.includes("credly.com") || host.includes("accredible.com") || host.includes("coursera.org"))) {
    return {
      verificationStatus: "registry" as const,
      verificationNote: "Public credential page. We confirmed the link format, not that you own the badge."
    };
  }

  if (type === "patent" && (host.includes("uspto.gov") || host.includes("patents.google.com") || /\/patent\//.test(path))) {
    return {
      verificationStatus: "registry" as const,
      verificationNote: "Public patent record link. We confirmed the source, not inventorship beyond the filing page."
    };
  }

  return {
    verificationStatus: "link_checked" as const,
    verificationNote: "Public link saved. We did not independently certify this work."
  };
}

export function normalizePortfolioAsset(raw: Partial<PortfolioAsset> & { title?: string }): PortfolioAsset | null {
  const title = String(raw.title || "").trim();
  if (!title) return null;
  const type = PORTFOLIO_ASSET_TYPES.includes(raw.type as PortfolioAssetType) ? (raw.type as PortfolioAssetType) : "project";
  const url = String(raw.url || "").trim();
  const assessed = assessPortfolioAssetLink(url, type);
  return {
    id: String(raw.id || `asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
    title,
    description: String(raw.description || "").trim(),
    url,
    type,
    issuer: String(raw.issuer || "").trim(),
    issuedAt: String(raw.issuedAt || "").trim(),
    verificationStatus: assessed.verificationStatus,
    verificationNote: assessed.verificationNote
  };
}
