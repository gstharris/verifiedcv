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
export type LayoutBlock = "experience" | "skills" | "education" | "work";
export type AssetVerificationStatus = "unverified" | "link_checked" | "registry";

export const RECRUITER_LAYOUTS: {
  id: RecruiterLayout;
  title: string;
  summary: string;
  featured: boolean;
  blocks: LayoutBlock[];
}[] = [
  {
    id: "traditional",
    title: "Bottom",
    summary: "Sample work sits after experience.",
    featured: false,
    blocks: ["experience", "skills", "education", "work"]
  },
  {
    id: "hybrid",
    title: "Top",
    summary: "Sample work sits before experience.",
    featured: false,
    blocks: ["work", "experience", "skills", "education"]
  },
  {
    id: "creative",
    title: "Top grid",
    summary: "Sample work is a two-column grid before experience.",
    featured: true,
    blocks: ["work", "experience", "skills", "education"]
  }
];

export function recruiterLayout(id?: string | null) {
  return RECRUITER_LAYOUTS.find((layout) => layout.id === id) || RECRUITER_LAYOUTS[0];
}

const PORTFOLIO_UPLOAD_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "ppt", "pptx", "key", "zip"];

export function isAllowedPortfolioUpload(name: string) {
  const ext = String(name || "").split(".").pop()?.toLowerCase() || "";
  return PORTFOLIO_UPLOAD_EXTENSIONS.includes(ext);
}

export type AssetForm = {
  hint: string;
  title: string;
  url?: string;
  file?: string;
  description?: string;
  issuer?: string;
  issuedAt?: string;
};

const ASSET_FORMS: Record<PortfolioAssetType, AssetForm> = {
  project: {
    hint: "Something you shipped. Add a link or a file.",
    title: "Project name",
    description: "What should a recruiter notice?",
    url: "Link to the project",
    file: "Or upload a PDF or image"
  },
  prototype: {
    hint: "A prototype or demo.",
    title: "Prototype name",
    description: "What should a recruiter notice?",
    url: "Link to the prototype",
    file: "Or upload a file"
  },
  app: {
    hint: "An app people can open.",
    title: "App name",
    description: "What should a recruiter notice?",
    url: "App link"
  },
  presentation: {
    hint: "A deck or a talk. Upload the file, or paste a link.",
    title: "Presentation title",
    file: "Upload the deck",
    url: "Or paste a public link",
    description: "What should a recruiter notice?"
  },
  certification: {
    hint: "A credential. A public badge link is the useful part.",
    title: "Certification name",
    issuer: "Who issued it",
    issuedAt: "Year",
    url: "Public credential link"
  },
  patent: {
    hint: "Paste the public filing page.",
    title: "Patent title",
    url: "Google Patents or USPTO link",
    issuer: "Inventor",
    issuedAt: "Year"
  },
  link: {
    hint: "Any other public page.",
    title: "Name",
    url: "https://"
  }
};

export function assetForm(type: PortfolioAssetType) {
  return ASSET_FORMS[type];
}

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
