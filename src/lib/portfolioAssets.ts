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
export type ResumeTemplate = "summary" | "experience" | "summary-highlights" | "highlights";
export type SamplePlacement = "top" | "bottom";
export type RecruiterLayout = string;
export type LayoutBlock = "summary" | "highlights" | "experience" | "skills" | "education" | "work";
export type AssetVerificationStatus = "unverified" | "link_checked" | "registry";

export const RESUME_TEMPLATES: { id: ResumeTemplate; title: string; summary: string }[] = [
  { id: "summary", title: "Summary", summary: "Summary, then experience, skills, and education." },
  { id: "experience", title: "No summary", summary: "Experience first. The summary stays off the public page." },
  { id: "summary-highlights", title: "Summary and highlights", summary: "Summary, a few highlight lines, then experience." },
  { id: "highlights", title: "Highlights", summary: "Highlight lines, then experience. Skills stay at the bottom." }
];

export function encodeDossierLayout(template: ResumeTemplate, placement: SamplePlacement) {
  return `${template}:${placement}`;
}

export function parseDossierLayout(id?: string | null) {
  const raw = String(id || "").trim();
  if (raw === "hybrid" || raw === "creative") {
    return { template: "summary" as ResumeTemplate, placement: "top" as SamplePlacement, id: "summary:top" };
  }
  if (raw === "traditional" || !raw) {
    return { template: "summary" as ResumeTemplate, placement: "bottom" as SamplePlacement, id: "summary:bottom" };
  }
  const [templateRaw, placementRaw] = raw.split(":");
  const template = RESUME_TEMPLATES.some((option) => option.id === templateRaw)
    ? (templateRaw as ResumeTemplate)
    : "summary";
  const placement: SamplePlacement = placementRaw === "top" ? "top" : "bottom";
  return { template, placement, id: encodeDossierLayout(template, placement) };
}

export function dossierSectionOrder(id?: string | null): LayoutBlock[] {
  const parsed = parseDossierLayout(id);
  const blocks: LayoutBlock[] = [];
  if (parsed.placement === "top") blocks.push("work");
  if (parsed.template === "highlights" || parsed.template === "summary-highlights") blocks.push("highlights");
  if (parsed.template === "summary" || parsed.template === "summary-highlights") blocks.push("summary");
  blocks.push("experience", "skills", "education");
  if (parsed.placement === "bottom") blocks.push("work");
  return blocks;
}

export function dossierSectionRank(id?: string | null) {
  const rank: Record<string, number> = {};
  dossierSectionOrder(id).forEach((block, index) => {
    rank[block] = index + 1;
  });
  if (!rank.summary) rank.summary = 20;
  if (!rank.highlights) rank.highlights = 21;
  if (!rank.work) rank.work = 22;
  return rank;
}

export function highlightLines<T extends { company?: string; claims?: string[] }>(chapters: T[]) {
  return chapters
    .map((chapter) => ({
      company: String(chapter.company || "").trim(),
      line: (chapter.claims || []).map((claim) => String(claim || "").trim()).find(Boolean) || ""
    }))
    .filter((item) => item.line)
    .slice(0, 4);
}

export function recruiterLayout(id?: string | null) {
  const parsed = parseDossierLayout(id);
  const template = RESUME_TEMPLATES.find((option) => option.id === parsed.template) || RESUME_TEMPLATES[0];
  const placementLabel = parsed.placement === "top" ? "Sample work sits at the top." : "Sample work sits at the bottom.";
  return {
    id: parsed.id,
    title: parsed.placement === "top" ? "Top" : "Bottom",
    summary: `${template.summary} ${placementLabel}`,
    featured: parsed.placement === "top",
    blocks: dossierSectionOrder(id),
    template: parsed.template,
    placement: parsed.placement
  };
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

export function publicRegistryLabel(type: string) {
  if (type === "credly" || type === "uspto") return "Issuer-linked";
  return "Public link";
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
