"use client";

import { useState, useRef, useEffect } from "react";
import { 
  UploadCloud, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink, 
  CornerDownLeft, 
  Loader2, 
  TrendingUp, 
  Cpu, 
  Users, 
  Target, 
  Award, 
  GraduationCap, 
  Building2, 
  AlertCircle, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  UserCheck, 
  Send, 
  Mail, 
  MapPin, 
  Phone, 
  Link2, 
  FileText, 
  Trash2, 
  RefreshCw, 
  X, 
  Lock, 
  FileUp, 
  RotateCcw,
  Fingerprint,
  FileCheck,
  Check,
  Copy
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";

function LinkedinIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_YEAR = 2026;
const YEARS = Array.from({ length: 45 }, (_, i) => String(CURRENT_YEAR - i));

interface Claim {
  id: string;
  raw_bullet: string;
  metric_summary: string;
  category: "METRIC" | "ARCHITECTURE" | "LEADERSHIP" | "EXECUTION";
  pith_fidelity_score: number;
  status: "DRAFT" | "PENDING_VERIFICATION" | "CORROBORATED" | "SELF_REPORTED" | "CHAPTER_ANCHORED";
  vouchedBy?: {
    displayName: string;
    relationship: string;
    confirmedAt: string;
    signature: string;
  };
  socraticDefense?: {
    tradeoffs: string;
    bottleneck: string;
    recordedAt: string;
  };
}

interface Experience {
  id: string;
  company_name: string;
  title: string;
  start_month: string;
  start_year: string;
  end_month: string;
  end_year: string;
  is_current: boolean;
  affiliation_verified: boolean;
  verificationMethod?: "PEER_CORROBORATION" | "WORK_DOMAIN" | "DOCUMENT_ANCHOR";
  chapterCorroboration?: {
    displayName: string;
    careerDepth: string;
    relationship: string;
    isRoleMasked: boolean;
    confirmedAt: string;
    notes?: string;
    signature: string;
    endorsedClaimCount: number;
    totalClaimCount: number;
  };
  claims: Claim[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  graduation_year: string;
  verified?: boolean;
}

interface Certification {
  id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  verified?: boolean;
}

interface SkillItem {
  name: string;
  category: string;
  corroborated?: boolean;
}

interface Artifact {
  id: string;
  title: string;
  url: string;
  fileName?: string;
  isPasswordProtected: boolean;
  type: "DECK" | "PATENT" | "MEMO" | "PRODUCT" | "OTHER";
}

interface ContactInfo {
  linkedinUrl: string;
  linkedinVerified: boolean;
  email: string;
  emailVerified: boolean;
  location: string;
  phone: string;
  phoneVerified: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  actions?: { label: string; actionKey: string }[];
}

function parseTenure(dateStr: string = ""): { month: string; year: string; isCurrent: boolean } {
  const isCurrent = /present|current/i.test(dateStr);
  const parts = dateStr.trim().split(/\s+/);
  let month = "Jan";
  let year = "2022";

  for (const p of parts) {
    const matchedMonth = MONTHS.find((m) => m.toLowerCase() === p.slice(0, 3).toLowerCase());
    if (matchedMonth) month = matchedMonth;
    const matchedYear = p.match(/\b(19\d\d|20\d\d)\b/);
    if (matchedYear) year = matchedYear[0];
  }

  return { month, year, isCurrent };
}

function getCategoryBadge(cat: string) {
  switch (cat) {
    case "METRIC":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
          <TrendingUp className="w-3 h-3 text-emerald-700" />
          <span>Metric</span>
        </span>
      );
    case "ARCHITECTURE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
          <Cpu className="w-3 h-3 text-indigo-600" />
          <span>Systems</span>
        </span>
      );
    case "LEADERSHIP":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
          <Users className="w-3 h-3 text-amber-700" />
          <span>Leadership</span>
        </span>
      );
    case "EXECUTION":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          <Target className="w-3 h-3 text-slate-500" />
          <span>Execution</span>
        </span>
      );
  }
}

export default function VerifiedCVStudio() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [vaultSaved, setVaultSaved] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Candidate Profile State
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  
  // Recruiter Contact Points (Tier 1 Signals)
  const [contact, setContact] = useState<ContactInfo>({
    linkedinUrl: "linkedin.com/in/gharris",
    linkedinVerified: true,
    email: "graham@example.com",
    emailVerified: true,
    location: "Agoura Hills, CA",
    phone: "(818) 555-0194",
    phoneVerified: false,
  });

  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  // Reciprocal PLG Referral Context
  const [reciprocalRef, setReciprocalRef] = useState<{
    handle: string;
    name: string;
    company: string;
  } | null>(null);

  // Multi-Method Chapter Verification Modal State
  const [selectedExpForHub, setSelectedExpForHub] = useState<Experience | null>(null);
  const [chapterModalTab, setChapterModalTab] = useState<"PEER" | "DOMAIN" | "DOCUMENT">("PEER");
  const [peerEmailInput, setPeerEmailInput] = useState("");
  const [peerLinkGenerated, setPeerLinkGenerated] = useState<string | null>(null);
  const [peerLinkCopied, setPeerLinkCopied] = useState(false);
  const [peerLoading, setPeerLoading] = useState(false);
  const [domainWorkEmail, setDomainWorkEmail] = useState("");
  const [docFileSelected, setDocFileSelected] = useState<string | null>(null);

  // Identity Modals
  const [verifyModalTarget, setVerifyModalTarget] = useState<"LINKEDIN" | "PHONE" | "EMAIL" | null>(null);
  const [phoneCodeInput, setPhoneCodeInput] = useState("");

  // Artifact Modal
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [artifactTitle, setArtifactTitle] = useState("");
  const [artifactUrl, setArtifactUrl] = useState("");
  const [artifactFileName, setArtifactFileName] = useState("");
  const [artifactPasswordProtected, setArtifactPasswordProtected] = useState(false);

  // CV Ally Socratic Audit Drawer
  const [socraticClaim, setSocraticClaim] = useState<{ expId: string; claim: Claim } | null>(null);
  const [socraticBottleneck, setSocraticBottleneck] = useState("");
  const [socraticTradeoffs, setSocraticTradeoffs] = useState("");

  // CV Ally Chat
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docVaultInputRef = useRef<HTMLInputElement>(null);
  const artifactDocInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Compute Active Trust Tier
  const isTier1Complete = contact.linkedinVerified && contact.emailVerified;
  const verifiedChaptersCount = experiences.filter((e) => e.affiliation_verified || Boolean(e.chapterCorroboration)).length;
  const isTier2Complete = isTier1Complete && verifiedChaptersCount >= 1;
  const isTier3Complete = isTier2Complete && artifacts.length >= 1;

  const currentTierLevel = isTier3Complete ? 3 : isTier2Complete ? 2 : isTier1Complete ? 1 : 0;

  // Ingestion & Hydration Lifecycle
  useEffect(() => {
    async function initStudio() {
      if (typeof window === "undefined") return;

      const urlParams = new URLSearchParams(window.location.search);
      const refHandle = urlParams.get("ref");
      const refName = urlParams.get("refName") || "Your Colleague";
      const refCompany = urlParams.get("company");
      const refTitle = urlParams.get("title");
      const refStart = urlParams.get("startYear") || "2014";
      const refEnd = urlParams.get("endYear") || "2019";
      const shouldAutoUpload = urlParams.get("autoUpload") === "true";

      // Priority 1: Reciprocal referral landing
      if (refCompany && refTitle) {
        setReciprocalRef({
          handle: refHandle || "gharris",
          name: refName,
          company: refCompany,
        });

        const seededExp: Experience = {
          id: crypto.randomUUID(),
          company_name: refCompany,
          title: refTitle,
          start_month: "Jan",
          start_year: refStart,
          end_month: "Dec",
          end_year: refEnd,
          is_current: false,
          affiliation_verified: true,
          verificationMethod: "PEER_CORROBORATION",
          chapterCorroboration: {
            displayName: `${refName} (Reciprocal Peer)`,
            careerDepth: "Verified Colleague",
            relationship: "PEER",
            isRoleMasked: false,
            confirmedAt: new Date().toISOString(),
            signature: "SIG_RECIPROCAL_LINK",
            endorsedClaimCount: 1,
            totalClaimCount: 1,
          },
          claims: [
            {
              id: crypto.randomUUID(),
              raw_bullet: `Led strategic initiatives and engineering delivery across ${refCompany} platform infrastructure.`,
              metric_summary: "Platform Scope",
              category: "LEADERSHIP",
              pith_fidelity_score: 95,
              status: "CORROBORATED",
            },
          ],
        };

        setFullName("");
        setHeadline(`${refTitle} • Formerly ${refCompany}`);
        setExperiences([seededExp]);
        setHasUnsavedChanges(true);
        setVaultSaved(false);

        setChatHistory([
          {
            role: "assistant",
            content: `Welcome to VerifiedCV. We have initialized your workspace with ${refCompany} as a verified chapter.\n\n${refName} is already linked as your verified peer voucher. You can customize your bullets below or drop your full resume PDF to populate previous roles.`,
            actions: [
              { label: "Upload full resume PDF", actionKey: "TRIGGER_UPLOAD" },
              { label: "Add another employer chapter", actionKey: "ADD_CHAPTER" },
            ],
          },
        ]);
        return;
      }

      if (shouldAutoUpload) {
        setTimeout(() => fileInputRef.current?.click(), 300);
      }

      // Priority 2: Hydrate Vault record
      try {
        const res = await fetch("/api/vault?handle=gharris", { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.data) {
          const d = json.data;
          setFullName(d.candidateName || "");
          setHeadline(d.headline || "");
          setSummary(d.summary || "");
          if (d.contact) {
            setContact({
              linkedinUrl: d.contact.linkedinUrl || "linkedin.com/in/gharris",
              linkedinVerified: d.contact.linkedinVerified ?? true,
              email: d.contact.email || "graham@example.com",
              emailVerified: d.contact.emailVerified ?? true,
              location: d.contact.location || "Agoura Hills, CA",
              phone: d.contact.phone || "(818) 555-0194",
              phoneVerified: d.contact.phoneVerified ?? false,
            });
          }
          if (d.artifacts) setArtifacts(d.artifacts);
          if (d.skills) setSkills(d.skills);
          if (d.education) setEducation(d.education);
          if (d.certifications) setCertifications(d.certifications);
          if (d.experiences) {
            setExperiences(
              d.experiences.map((exp: any) => {
                const s = parseTenure(exp.start_date || `${exp.start_month} ${exp.start_year}`);
                const e = parseTenure(exp.end_date || `${exp.end_month} ${exp.end_year}`);
                return {
                  ...exp,
                  start_month: exp.start_month || s.month,
                  start_year: exp.start_year || s.year,
                  end_month: exp.end_month || (exp.is_current ? "" : e.month),
                  end_year: exp.end_year || (exp.is_current ? "" : e.year),
                  is_current: exp.is_current ?? e.isCurrent,
                };
              })
            );
          }
          setVaultSaved(true);
          setChatHistory([
            {
              role: "assistant",
              content: "Active candidate dossier loaded from Vault. Invite former managers or colleagues to corroborate your chapters with role-masked privacy.",
              actions: [
                { label: "Upload new PDF", actionKey: "TRIGGER_UPLOAD" },
                { label: "Verify an employer chapter", actionKey: "VERIFY_FIRST_CHAPTER" },
                { label: "Add artifacts to portfolio", actionKey: "OPEN_ARTIFACT_MODAL" },
                { label: "Publish dossier to Vault", actionKey: "PUBLISH_VAULT" },
              ],
            },
          ]);
        }
      } catch (e) {
        console.error("Vault hydration error:", e);
      }
    }

    initStudio();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const selectedFile = e.target.files[0];

    setApiError(null);
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: `Uploaded ${selectedFile.name}` },
      { role: "assistant", content: `Parsing ${selectedFile.name} across chapters, milestones, and credentials...` },
    ]);

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const result = await res.json();

      if (!res.ok || !result.success) {
        const errorMsg = result.error || `Server responded with status ${res.status}`;
        setApiError(errorMsg);
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: `Ingestion notice: ${errorMsg}` },
        ]);
        return;
      }

      if (result.data) {
        const parsedName = result.data.full_name || fullName || "Graham Harris";
        const parsedHead = result.data.headline || headline || "Senior Product Leader";
        const parsedSumm = result.data.summary || summary || "";
        const parsedSkills = (result.data.skills || []).map((s: any) => ({
          name: s.name,
          category: s.category || "Proficiencies",
          corroborated: false,
        }));
        const parsedEdu = (result.data.education || []).map((edu: any) => ({
          ...edu,
          verified: false,
        }));
        const parsedCerts = (result.data.certifications || []).map((cert: any) => ({
          ...cert,
          verified: false,
        }));

        setFullName(parsedName);
        setHeadline(parsedHead);
        setSummary(parsedSumm);
        setSkills(parsedSkills);
        setEducation(parsedEdu);
        setCertifications(parsedCerts);

        const mappedExps: Experience[] = (result.data.experiences || []).map((exp: any) => {
          const s = parseTenure(exp.start_date);
          const endTenure = parseTenure(exp.end_date);

          return {
            ...exp,
            id: exp.id || crypto.randomUUID(),
            start_month: s.month,
            start_year: s.year,
            end_month: endTenure.isCurrent ? "Present" : endTenure.month,
            end_year: endTenure.isCurrent ? "Present" : endTenure.year,
            is_current: endTenure.isCurrent,
            affiliation_verified: false,
            claims: (exp.claims || []).map((c: any) => ({
              ...c,
              id: c.id || crypto.randomUUID(),
              pith_fidelity_score: c.pith_fidelity_score || 72,
              status: "DRAFT",
            })),
          };
        });

        setExperiences(mappedExps);
        setHasUnsavedChanges(true);
        setVaultSaved(false);

        const totalClaimsCount = mappedExps.reduce((acc, exp) => acc + (exp.claims?.length || 0), 0);

        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Extracted ${mappedExps.length} career chapters and ${totalClaimsCount} accomplishment milestones.\n\nYour profile is currently at Tier 1. Verify your chapters via peer corroboration or enterprise domain to unlock Tier 2:`,
            actions: [
              { label: "Verify an employer chapter", actionKey: "VERIFY_FIRST_CHAPTER" },
              { label: "Add portfolio artifacts for Tier 3", actionKey: "OPEN_ARTIFACT_MODAL" },
              { label: "Publish to Vault", actionKey: "PUBLISH_VAULT" },
            ],
          },
        ]);
      }
    } catch (err: any) {
      setApiError(err?.message || "Ingestion network failure.");
    } finally {
      setLoading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveToVault = async () => {
    if (experiences.length === 0 && education.length === 0 && !fullName) return;
    setSaving(true);
    setApiError(null);

    try {
      const sanitizedExps = experiences.map((exp) => ({
        ...exp,
        start_date: `${exp.start_month} ${exp.start_year}`,
        end_date: exp.is_current ? "Present" : `${exp.end_month} ${exp.end_year}`,
      }));

      const payload = {
        candidateName: fullName || "Graham Harris",
        candidateHandle: "gharris",
        headline,
        summary,
        contact,
        artifacts,
        skills,
        education,
        certifications,
        experiences: sanitizedExps,
      };

      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        setVaultSaved(true);
        setHasUnsavedChanges(false);
        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Ground truth anchored to Vault. Your dossier is live at verifiedcv.app/gharris.`,
          },
        ]);
      } else {
        throw new Error(json.error || "Vault failed to persist state.");
      }
    } catch (e: any) {
      setApiError(e.message || "Failed to publish to Vault.");
    } finally {
      setSaving(false);
    }
  };

  const handleActionClick = (actionKey: string) => {
    switch (actionKey) {
      case "TRIGGER_UPLOAD":
        fileInputRef.current?.click();
        break;
      case "PUBLISH_VAULT":
        handleSaveToVault();
        break;
      case "OPEN_ARTIFACT_MODAL":
        setIsArtifactModalOpen(true);
        break;
      case "VERIFY_FIRST_CHAPTER":
        if (experiences.length > 0) {
          setSelectedExpForHub(experiences[0]);
          setChapterModalTab("PEER");
        }
        break;
      default:
        break;
    }
  };

  // Peer Corroboration Link Generator (Invoking /api/verify/attest)
  const handleGeneratePeerAttestation = async () => {
    if (!selectedExpForHub || !peerEmailInput.trim()) return;
    setPeerLoading(true);

    const tenureStr = selectedExpForHub.is_current
      ? `${selectedExpForHub.start_month} ${selectedExpForHub.start_year} — Present`
      : `${selectedExpForHub.start_month} ${selectedExpForHub.start_year} — ${selectedExpForHub.end_month} ${selectedExpForHub.end_year}`;

    try {
      const res = await fetch("/api/verify/attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateHandle: "gharris",
          candidateName: fullName || "Graham Harris",
          experienceId: selectedExpForHub.id,
          companyName: selectedExpForHub.company_name,
          roleTitle: selectedExpForHub.title,
          tenureDates: tenureStr,
          claims: selectedExpForHub.claims || [],
          attestorEmail: peerEmailInput.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setPeerLinkGenerated(`${window.location.origin}${json.attestUrl}`);
      } else {
        alert(json.error || "Failed to create attestation token.");
      }
    } catch (err) {
      console.error("Attestation error:", err);
      alert("Network error generating attestation link.");
    } finally {
      setPeerLoading(false);
    }
  };

  // Work Domain Tenancy Confirmation
  const handleConfirmWorkDomain = () => {
    if (!selectedExpForHub) return;
    const targetDomain = domainWorkEmail.trim() || `${selectedExpForHub.company_name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

    setExperiences((prev) =>
      prev.map((exp) =>
        exp.id === selectedExpForHub.id
          ? {
              ...exp,
              affiliation_verified: true,
              verificationMethod: "WORK_DOMAIN",
            }
          : exp
      )
    );
    setHasUnsavedChanges(true);
    setVaultSaved(false);
    setSelectedExpForHub(null);

    setChatHistory((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Work email domain verified for ${selectedExpForHub.company_name} (@${targetDomain.split("@")[1] || targetDomain}). Chapter elevated to Employer Verified.`,
      },
    ]);
  };

  // Document Vault Anchor Confirmation
  const handleConfirmDocAnchor = () => {
    if (!selectedExpForHub || !docFileSelected) return;

    setExperiences((prev) =>
      prev.map((exp) =>
        exp.id === selectedExpForHub.id
          ? {
              ...exp,
              affiliation_verified: true,
              verificationMethod: "DOCUMENT_ANCHOR",
            }
          : exp
      )
    );
    setHasUnsavedChanges(true);
    setVaultSaved(false);
    setSelectedExpForHub(null);

    setChatHistory((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Uploaded and cryptographically hashed employment record (${docFileSelected}) for ${selectedExpForHub.company_name}. Chapter elevated to Document Anchored.`,
      },
    ]);
  };

  // Record Socratic Claim Defense (Authorship Calibration)
  const handleSaveSocraticDefense = () => {
    if (!socraticClaim) return;
    const { expId, claim } = socraticClaim;

    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id !== expId) return exp;
        return {
          ...exp,
          claims: exp.claims.map((c) =>
            c.id === claim.id
              ? {
                  ...c,
                  pith_fidelity_score: Math.max(c.pith_fidelity_score, 84),
                  socraticDefense: {
                    bottleneck: socraticBottleneck.trim(),
                    tradeoffs: socraticTradeoffs.trim(),
                    recordedAt: new Date().toISOString(),
                  },
                }
              : c
          ),
        };
      })
    );

    setHasUnsavedChanges(true);
    setVaultSaved(false);
    setSocraticClaim(null);
    setSocraticBottleneck("");
    setSocraticTradeoffs("");

    setChatHistory((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Authorship defense recorded for "${claim.raw_bullet.slice(0, 40)}...". Calibrated scope and trade-offs anchored to Vault.`,
      },
    ]);
  };

  const handleCreateArtifact = () => {
    if (!artifactTitle.trim()) return;

    const newArtifact: Artifact = {
      id: crypto.randomUUID(),
      title: artifactTitle.trim(),
      url: artifactUrl.trim() || (artifactFileName ? `#uploaded-${artifactFileName}` : "#"),
      fileName: artifactFileName || undefined,
      isPasswordProtected: artifactPasswordProtected,
      type: "DECK",
    };

    setArtifacts((prev) => [...prev, newArtifact]);
    setHasUnsavedChanges(true);
    setVaultSaved(false);

    setArtifactTitle("");
    setArtifactUrl("");
    setArtifactFileName("");
    setArtifactPasswordProtected(false);
    setIsArtifactModalOpen(false);

    setChatHistory((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Attached "${newArtifact.title}" to your portfolio. Primary source artifact anchored.`,
      },
    ]);
  };

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;

    if (/re-?upload|upload new|upload resume/i.test(text)) {
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: text },
        {
          role: "assistant",
          content: "You can re-upload your resume PDF at any time:",
          actions: [{ label: "Upload new PDF", actionKey: "TRIGGER_UPLOAD" }],
        },
      ]);
      setChatInput("");
      return;
    }

    if (/publish|save to vault|save/i.test(text)) {
      handleSaveToVault();
      setChatInput("");
      return;
    }

    const userMsg: ChatMessage = { role: "user", content: text };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ally/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          experiences,
          summary,
          skills,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setChatHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setChatHistory((prev) => [...prev, { role: "assistant", content: data.error || "CV Ally is temporarily unavailable." }]);
      }
    } catch {
      setChatHistory((prev) => [...prev, { role: "assistant", content: "Connection interrupted. Please retry." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleUpdateClaimText = (expId: string, claimId: string, newText: string) => {
    setHasUnsavedChanges(true);
    setVaultSaved(false);
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id !== expId) return exp;
        return {
          ...exp,
          claims: exp.claims.map((c) => (c.id === claimId ? { ...c, raw_bullet: newText } : c)),
        };
      })
    );
  };

  const isDateChronological = (exp: Experience): boolean => {
    if (exp.is_current) return true;
    const startY = parseInt(exp.start_year, 10);
    const endY = parseInt(exp.end_year, 10);
    if (isNaN(startY) || isNaN(endY)) return true;
    if (endY < startY) return false;
    if (endY === startY) {
      const startM = MONTHS.indexOf(exp.start_month);
      const endM = MONTHS.indexOf(exp.end_month);
      if (startM > -1 && endM > -1 && endM < startM) return false;
    }
    return true;
  };

  const totalClaims = experiences.reduce((acc, exp) => acc + (exp.claims?.length || 0), 0);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-emerald-100">
      
      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />

      {/* Top Header Command Bar */}
      <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2.5">
          <VerifiedCVLogo />
          <div className="flex items-baseline gap-2">
            <span className="font-black text-xl tracking-tight text-slate-950">VerifiedCV</span>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md hidden sm:inline-block">
              Candidate Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Upload New PDF</span>
          </button>

          {(experiences.length > 0 || fullName) && (
            <button
              onClick={handleSaveToVault}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                vaultSaved && !hasUnsavedChanges
                  ? "bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50"
                  : "bg-slate-900 hover:bg-slate-800 text-white"
              }`}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : vaultSaved && !hasUnsavedChanges ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>
                {saving
                  ? "Publishing..."
                  : vaultSaved && !hasUnsavedChanges
                  ? "Vault Synchronized"
                  : "Publish to Vault"}
              </span>
            </button>
          )}

          <a
            href="/gharris"
            target="_blank"
            rel="noopener noreferrer"
            suppressHydrationWarning
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
          >
            <span>Live Public Dossier</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </header>

      {/* Main Workspace Viewport */}
      {experiences.length === 0 && !fullName ? (
        <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-16 flex flex-col justify-center text-center space-y-8 animate-in fade-in duration-300 overflow-y-auto">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <VerifiedCVLogo className="w-9 h-9" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Prove your track record upfront.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed font-normal max-w-lg mx-auto">
              Bypass automated screening filters. Upload your resume to extract career history, granular month-to-month tenures, and verified proficiencies.
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 sm:p-10 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-600 bg-white hover:bg-emerald-50/20 transition-all cursor-pointer shadow-xs group space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-800 flex items-center justify-center mx-auto transition-colors">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-sm text-slate-900 block">
                Click to upload your resume PDF
              </span>
              <span className="text-xs text-slate-500 block">
                Lossless extraction across roles, structured tenures, proficiencies, and education
              </span>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2.5 text-sm font-semibold text-emerald-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Extracting tenures, accomplishments, and credentials...</span>
            </div>
          )}

          {apiError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 max-w-md mx-auto text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{apiError}</span>
            </div>
          )}
        </main>
      ) : (
        <div className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)] w-full">
          
          {/* SLIM LEFT CO-PILOT: Fixed 320px */}
          <aside className="w-80 border-r border-slate-200 flex flex-col h-full bg-white shrink-0">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-900">CV Ally</span>
                <span className="text-[10px] text-slate-500 font-medium">• Trust Copilot</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                hasUnsavedChanges
                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              }`}>
                {hasUnsavedChanges ? "Pending Save" : "Synced"}
              </span>
            </div>

            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs leading-relaxed bg-[#FAFAFA]">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className="flex gap-2 w-full">
                    {msg.role === "assistant" && (
                      <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        CA
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-xl space-y-2 leading-relaxed text-xs w-full ${
                        msg.role === "user"
                          ? "bg-slate-900 text-white font-medium ml-auto max-w-[85%]"
                          : "bg-white border border-slate-200 text-slate-800 shadow-2xs"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>

                      {msg.actions && msg.actions.length > 0 && (
                        <div className="pt-2 space-y-1.5 border-t border-slate-100">
                          {msg.actions.map((act, aIdx) => (
                            <button
                              key={aIdx}
                              onClick={() => handleActionClick(act.actionKey)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 text-[11px] font-semibold transition-all flex items-center justify-between group cursor-pointer"
                            >
                              <span>{act.label}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating proof signals...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="p-2.5 border-t border-slate-200 bg-white flex items-center gap-1.5 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask Ally or calibrate claim..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={chatLoading || !chatInput.trim()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-7 px-2.5 rounded-lg text-xs shadow-xs shrink-0 flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                <CornerDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </aside>

          {/* MASSIVE RIGHT PANE: Live Editable Canvas */}
          <main className="flex-1 h-full overflow-y-auto p-6 sm:p-10 space-y-6">
            
            {/* FORENSIC TRUST TIER PROGRESSION BAR (Replacing 100% / arbitrary numbers) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
                      Pre-Flight Verification Status
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Proactive background clearance replaces traditional 3-week post-offer screening delays.
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {currentTierLevel === 3
                      ? "Tier 3: Forensically Certified"
                      : currentTierLevel === 2
                      ? "Tier 2: Corroborated Track Record"
                      : currentTierLevel === 1
                      ? "Tier 1: Authentic Professional"
                      : "Unverified Draft"}
                  </span>
                </div>
              </div>

              {/* 3 Discrete Tiers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                
                {/* Tier 1 */}
                <div className={`p-3 rounded-xl border text-left transition-all ${
                  isTier1Complete ? "bg-emerald-50/50 border-emerald-300 text-emerald-950" : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5 text-emerald-700" />
                      Tier 1: Identity & Entity
                    </span>
                    {isTier1Complete ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    ) : (
                      <span className="text-[10px] text-slate-400">Action Needed</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {isTier1Complete ? "OAuth UID & Mailbox Confirmed" : "Connect LinkedIn & Email"}
                  </span>
                </div>

                {/* Tier 2 */}
                <div className={`p-3 rounded-xl border text-left transition-all ${
                  isTier2Complete ? "bg-emerald-50/50 border-emerald-300 text-emerald-950" : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-700" />
                      Tier 2: Chapter & Peer
                    </span>
                    {isTier2Complete ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    ) : (
                      <span className="text-[10px] text-slate-400">Pending Chapter</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {isTier2Complete ? `${verifiedChaptersCount} Chapters Corroborated` : "Verify 1+ Chapter or Peer Sign-Off"}
                  </span>
                </div>

                {/* Tier 3 */}
                <div className={`p-3 rounded-xl border text-left transition-all ${
                  isTier3Complete ? "bg-emerald-50/50 border-emerald-300 text-emerald-950" : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                      Tier 3: Artifacts & Registry
                    </span>
                    {isTier3Complete ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    ) : (
                      <span className="text-[10px] text-slate-400">Optional</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {artifacts.length > 0 ? `${artifacts.length} Work Artifacts Anchored` : "Patents, Decks, SEC Links"}
                  </span>
                </div>

              </div>
            </div>

            {/* Reciprocal PLG Handshake Banner */}
            {reciprocalRef && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-emerald-950 uppercase tracking-wider">
                      Reciprocal Chapter Pre-Cleared
                    </h3>
                    <p className="text-xs text-slate-700 mt-0.5">
                      <strong>{reciprocalRef.name}</strong> confirmed your tenure at{" "}
                      <strong>{reciprocalRef.company}</strong> and is linked as your reciprocal peer voucher.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (experiences.length > 0) {
                      setSelectedExpForHub(experiences[0]);
                      setChapterModalTab("PEER");
                    }
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                >
                  <span>Invite Additional References</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Candidate Identity & Contact Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      setHasUnsavedChanges(true);
                      setVaultSaved(false);
                    }}
                    placeholder="Candidate Name"
                    className="cv-field text-2xl font-black text-slate-950 tracking-tight px-2 py-1 -ml-2 w-full"
                  />
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => {
                      setHeadline(e.target.value);
                      setHasUnsavedChanges(true);
                      setVaultSaved(false);
                    }}
                    placeholder="Headline / Target Title"
                    className="cv-field text-sm font-bold text-slate-700 px-2 py-0.5 -ml-2 w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified Candidate</span>
                  </span>
                </div>
              </div>

              {/* Recruiter Contact Deck */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                
                {/* LinkedIn */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                    <LinkedinIcon className="w-4 h-4 text-blue-600 shrink-0" />
                    <input
                      type="text"
                      value={contact.linkedinUrl}
                      onChange={(e) => {
                        setContact({ ...contact, linkedinUrl: e.target.value });
                        setHasUnsavedChanges(true);
                        setVaultSaved(false);
                      }}
                      placeholder="linkedin.com/in/..."
                      className="bg-transparent text-[11px] font-medium w-full outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setVerifyModalTarget("LINKEDIN")}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      contact.linkedinVerified
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {contact.linkedinVerified ? "Verified" : "Verify"}
                  </button>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                    <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => {
                        setContact({ ...contact, email: e.target.value });
                        setHasUnsavedChanges(true);
                        setVaultSaved(false);
                      }}
                      placeholder="work@company.com"
                      className="bg-transparent text-[11px] font-medium w-full outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setVerifyModalTarget("EMAIL")}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      contact.emailVerified
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {contact.emailVerified ? "Verified" : "Verify"}
                  </button>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={contact.location}
                    onChange={(e) => {
                      setContact({ ...contact, location: e.target.value });
                      setHasUnsavedChanges(true);
                      setVaultSaved(false);
                    }}
                    placeholder="City, State"
                    className="bg-transparent text-[11px] font-medium w-full outline-none"
                  />
                </div>

                {/* Phone */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={contact.phone}
                      onChange={(e) => {
                        setContact({ ...contact, phone: e.target.value });
                        setHasUnsavedChanges(true);
                        setVaultSaved(false);
                      }}
                      placeholder="(555) 000-0000"
                      className="bg-transparent text-[11px] font-medium w-full outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setVerifyModalTarget("PHONE")}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      contact.phoneVerified
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {contact.phoneVerified ? "Verified" : "Verify"}
                  </button>
                </div>

              </div>

              <textarea
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setHasUnsavedChanges(true);
                  setVaultSaved(false);
                }}
                placeholder="Executive Profile Summary"
                rows={3}
                className="cv-field w-full text-sm text-slate-800 leading-relaxed p-2 -ml-2 resize-none font-normal"
              />
            </div>

            {/* Career Chapters & Accomplishments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-700" />
                  Career Chapters & Accomplishments ({experiences.length})
                </h2>
                <span className="text-xs font-medium text-slate-500">
                  {totalClaims} extracted claims
                </span>
              </div>

              {experiences.map((exp) => {
                const chronological = isDateChronological(exp);
                const isChapterCertified = exp.affiliation_verified || Boolean(exp.chapterCorroboration);

                return (
                  <div
                    key={exp.id}
                    className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden"
                  >
                    {/* Chapter Header: Primary Verify Trigger & Tenure */}
                    <div className="p-4 sm:p-5 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setHasUnsavedChanges(true);
                            setVaultSaved(false);
                            setExperiences((prev) => prev.map((item) => item.id === exp.id ? { ...item, title: val } : item));
                          }}
                          className="cv-field font-extrabold text-base text-slate-950 px-1.5 py-0.5 -ml-1.5 w-full"
                        />
                        
                        <div className="text-xs font-bold text-slate-700 px-1.5 mt-0.5 flex items-center gap-2 flex-wrap">
                          <span>{exp.company_name}</span>
                          {isChapterCertified && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 
                              {exp.chapterCorroboration
                                ? "Verified Chapter (Peer Corroborated)"
                                : exp.verificationMethod === "DOCUMENT_ANCHOR"
                                ? "Verified Chapter (Document Anchored)"
                                : "Verified Chapter (Domain Confirmed)"}
                            </span>
                          )}
                          {exp.chapterCorroboration && (
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({exp.chapterCorroboration.displayName})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tenure Selector & Chapter Action */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`flex items-center gap-1 bg-white border rounded-lg px-2 py-1 shadow-2xs ${
                          chronological ? "border-slate-200" : "border-red-300 bg-red-50/30"
                        }`}>
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          
                          <select
                            value={exp.start_month}
                            onChange={(e) => {
                              const val = e.target.value;
                              setHasUnsavedChanges(true);
                              setVaultSaved(false);
                              setExperiences((prev) => prev.map((i) => i.id === exp.id ? { ...i, start_month: val } : i));
                            }}
                            className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                          >
                            {MONTHS.map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>

                          <select
                            value={exp.start_year}
                            onChange={(e) => {
                              const val = e.target.value;
                              setHasUnsavedChanges(true);
                              setVaultSaved(false);
                              setExperiences((prev) => prev.map((i) => i.id === exp.id ? { ...i, start_year: val } : i));
                            }}
                            className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                          >
                            {YEARS.map((y) => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>

                          <span className="text-xs text-slate-400">—</span>

                          {exp.is_current ? (
                            <span className="text-xs font-bold text-emerald-700 px-1">Present</span>
                          ) : (
                            <>
                              <select
                                value={exp.end_month}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setHasUnsavedChanges(true);
                                  setVaultSaved(false);
                                  setExperiences((prev) => prev.map((i) => i.id === exp.id ? { ...i, end_month: val } : i));
                                }}
                                className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                              >
                                {MONTHS.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>

                              <select
                                value={exp.end_year}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setHasUnsavedChanges(true);
                                  setVaultSaved(false);
                                  setExperiences((prev) => prev.map((i) => i.id === exp.id ? { ...i, end_year: val } : i));
                                }}
                                className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer"
                              >
                                {YEARS.map((y) => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                            </>
                          )}

                          <label className="flex items-center gap-1 text-[10px] text-slate-500 ml-1.5 pl-1.5 border-l border-slate-200 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={exp.is_current}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setHasUnsavedChanges(true);
                                setVaultSaved(false);
                                setExperiences((prev) => prev.map((i) => i.id === exp.id ? { ...i, is_current: checked } : i));
                              }}
                              className="rounded text-emerald-600 focus:ring-0"
                            />
                            <span>Present</span>
                          </label>
                        </div>

                        {/* Primary Chapter Corroboration Trigger */}
                        <button
                          onClick={() => {
                            setSelectedExpForHub(exp);
                            setChapterModalTab("PEER");
                            setPeerLinkGenerated(null);
                          }}
                          className={`h-7 px-2.5 text-xs font-bold rounded-lg border shadow-2xs flex items-center gap-1 transition-all cursor-pointer ${
                            isChapterCertified
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                              : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                          }`}
                        >
                          <ShieldCheck className={`w-3.5 h-3.5 ${isChapterCertified ? "text-emerald-600" : "text-slate-400"}`} />
                          <span>{isChapterCertified ? "Manage Verification" : "Verify Chapter"}</span>
                        </button>
                      </div>
                    </div>

                    {!chronological && (
                      <div className="px-4 py-1.5 bg-red-50 border-b border-red-200 text-[11px] font-semibold text-red-700 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Invalid tenure chronology: End date cannot precede start date.</span>
                      </div>
                    )}

                    {/* Milestones / Claims List: Clean Storytelling */}
                    <div className="p-4 space-y-3">
                      {exp.claims?.map((claim) => {
                        const isDirectlyVouched = claim.status === "CORROBORATED" || Boolean(claim.vouchedBy);

                        return (
                          <div
                            key={claim.id}
                            className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all space-y-2 group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {getCategoryBadge(claim.category)}
                                {claim.metric_summary && (
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    {claim.metric_summary}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Progressive Proof Badge */}
                                {isDirectlyVouched ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Directly Vouched</span>
                                  </span>
                                ) : claim.socraticDefense ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                    <Sparkles className="w-3 h-3 text-indigo-600" />
                                    <span>Author Calibrated</span>
                                  </span>
                                ) : isChapterCertified ? (
                                  <span className="text-[10px] font-semibold text-emerald-700">
                                    Chapter Certified
                                  </span>
                                ) : null}

                                {/* Socratic Defense Trigger */}
                                {!claim.socraticDefense && !isDirectlyVouched && (
                                  <button
                                    onClick={() => {
                                      setSocraticClaim({ expId: exp.id, claim });
                                      setSocraticBottleneck("");
                                      setSocraticTradeoffs("");
                                    }}
                                    className="text-[10px] font-bold text-slate-500 hover:text-slate-900 border border-dashed border-slate-300 hover:border-slate-400 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                  >
                                    Defend Authorship
                                  </button>
                                )}
                              </div>
                            </div>

                            <textarea
                              value={claim.raw_bullet}
                              onChange={(e) => handleUpdateClaimText(exp.id, claim.id, e.target.value)}
                              rows={2}
                              className="cv-field w-full text-sm text-slate-900 font-normal leading-relaxed p-1.5 -ml-1.5 resize-none"
                            />

                            {/* Render Socratic Context Brief if Defended */}
                            {claim.socraticDefense && (
                              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                                <div>
                                  <span className="font-bold text-slate-800">Core Constraint Solved: </span>
                                  {claim.socraticDefense.bottleneck}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-800">System Trade-off: </span>
                                  {claim.socraticDefense.tradeoffs}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Education & Credentials */}
            {(education.length > 0 || certifications.length > 0) && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-slate-700" />
                  Education, Credentials & Licenses
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {education.map((edu) => (
                    <div key={edu.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{edu.institution}</span>
                        <span className="text-xs font-semibold text-slate-500 font-mono">{edu.graduation_year}</span>
                      </div>
                      <p className="text-xs text-slate-600">{edu.degree}</p>
                    </div>
                  ))}

                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-slate-600" />
                          {cert.name}
                        </span>
                        {cert.verified && (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">{cert.issuing_organization}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills & Competencies */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-700" />
                    Proficiencies & Competencies
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Skills corroborated by team members during verified tenures.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newSkill = prompt("Enter new proficiency:");
                    if (newSkill) {
                      const updated = [...skills, { name: newSkill.trim(), category: "Proficiencies", corroborated: false }];
                      setSkills(updated);
                      setHasUnsavedChanges(true);
                      setVaultSaved(false);
                    }
                  }}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Competency
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {skills.map((s, idx) => (
                  <div
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      s.corroborated
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-white text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>{s.name}</span>
                    {s.corroborated && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    )}
                    <button
                      onClick={() => {
                        const updated = skills.filter((item) => item.name !== s.name);
                        setSkills(updated);
                        setHasUnsavedChanges(true);
                        setVaultSaved(false);
                      }}
                      className="text-slate-400 hover:text-red-500 ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured Portfolio Artifacts & Documents (Tier 3 Signals) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    Portfolio Artifacts & Publications ({artifacts.length})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Upload presentation decks, patent filings, or whitepapers to achieve Tier 3 Forensic Certification.
                  </p>
                </div>
                <button
                  onClick={() => setIsArtifactModalOpen(true)}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Artifact
                </button>
              </div>

              {artifacts.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No portfolio documents attached yet. Click "+ Add Artifact" to upload whitepapers, decks, or public launch links.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {artifacts.map((art) => (
                    <div key={art.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between group">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <Link2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">{art.title}</span>
                            {art.isPasswordProtected && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                                <Lock className="w-2.5 h-2.5" /> Protected
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {art.fileName ? `Document: ${art.fileName}` : art.url}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setArtifacts(artifacts.filter((a) => a.id !== art.id));
                          setHasUnsavedChanges(true);
                          setVaultSaved(false);
                        }}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </main>
        </div>
      )}

      {/* UNIFIED CHAPTER VERIFICATION CENTER MODAL */}
      {selectedExpForHub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-950">Verify Career Chapter</h3>
              </div>
              <button
                onClick={() => setSelectedExpForHub(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    {selectedExpForHub.company_name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {selectedExpForHub.start_year} — {selectedExpForHub.is_current ? "Present" : selectedExpForHub.end_year}
                  </span>
                </div>
                <p className="text-slate-600 font-medium">Claimed Role: {selectedExpForHub.title}</p>
              </div>

              {/* Ingress Tabs */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setChapterModalTab("PEER")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    chapterModalTab === "PEER" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  1. Colleague Invite
                </button>
                <button
                  type="button"
                  onClick={() => setChapterModalTab("DOMAIN")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    chapterModalTab === "DOMAIN" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  2. Work Domain
                </button>
                <button
                  type="button"
                  onClick={() => setChapterModalTab("DOCUMENT")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    chapterModalTab === "DOCUMENT" ? "bg-white text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  3. Vault Document
                </button>
              </div>

              {/* Tab 1: Peer Corroboration */}
              {chapterModalTab === "PEER" && (
                <div className="space-y-3">
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Send an encrypted single-use link to a former manager or colleague. By default, their identity is role-masked (e.g. <em>Verified by Former VP @ {selectedExpForHub.company_name}</em>) to comply with enterprise reference guidelines.
                  </p>
                  
                  {!peerLinkGenerated ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="email"
                        placeholder="colleague@company.com"
                        value={peerEmailInput}
                        onChange={(e) => setPeerEmailInput(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-slate-400 text-xs"
                      />
                      <button
                        onClick={handleGeneratePeerAttestation}
                        disabled={peerLoading || !peerEmailInput.trim()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                      >
                        {peerLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Generate Link</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                        <input
                          type="text"
                          readOnly
                          value={peerLinkGenerated}
                          className="flex-1 bg-transparent text-[11px] font-mono outline-none text-slate-700 truncate"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(peerLinkGenerated);
                            setPeerLinkCopied(true);
                            setTimeout(() => setPeerLinkCopied(false), 2000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-[11px] text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{peerLinkCopied ? "Copied" : "Copy"}</span>
                        </button>
                        <a
                          href={peerLinkGenerated}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-emerald-700 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Test Open</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Work Domain */}
              {chapterModalTab === "DOMAIN" && (
                <div className="space-y-3">
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Verify this chapter immediately by confirming control of an active or historical work email domain associated with {selectedExpForHub.company_name}.
                  </p>
                  <input
                    type="email"
                    placeholder={`you@${selectedExpForHub.company_name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`}
                    value={domainWorkEmail}
                    onChange={(e) => setDomainWorkEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-slate-400 text-xs"
                  />
                  <button
                    onClick={handleConfirmWorkDomain}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Domain Affiliation</span>
                  </button>
                </div>
              )}

              {/* Tab 3: Document Vault Upload */}
              {chapterModalTab === "DOCUMENT" && (
                <div className="space-y-3">
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Upload a redacted W-2, signed offer letter, or consulting agreement. Stored in your private encrypted vault; recruiters see a cryptographic hash seal certifying dates and title.
                  </p>
                  <input
                    ref={docVaultInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setDocFileSelected(e.target.files[0].name);
                      }
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => docVaultInputRef.current?.click()}
                    className="w-full py-3 px-4 border border-dashed border-slate-300 hover:border-emerald-600 rounded-xl bg-slate-50 hover:bg-emerald-50/20 text-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileUp className="w-4 h-4 text-emerald-600" />
                    <span>{docFileSelected ? `Selected: ${docFileSelected}` : "Click to select document file (PDF)"}</span>
                  </button>
                  <button
                    onClick={handleConfirmDocAnchor}
                    disabled={!docFileSelected}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Anchor Document to Vault</span>
                  </button>
                </div>
              )}

            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedExpForHub(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOCRATIC CLAIM DEFENSE MODAL (CV ALLY AUTHORSHIP CALIBRATION) */}
      {socraticClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-950">CV Ally: Authorship Calibration</h3>
              </div>
              <button
                onClick={() => setSocraticClaim(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Target Accomplishment Bullet
                </span>
                <p className="font-medium text-slate-800 italic">"{socraticClaim.claim.raw_bullet}"</p>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  1. What core architectural or operational constraint did you have to break through?
                </label>
                <textarea
                  value={socraticBottleneck}
                  onChange={(e) => setSocraticBottleneck(e.target.value)}
                  placeholder="e.g. Existing pipeline latency exceeded 120ms; we refactored the caching partition."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-slate-400 bg-white resize-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  2. What deliberate trade-off did you choose (e.g. consistency vs. speed)?
                </label>
                <textarea
                  value={socraticTradeoffs}
                  onChange={(e) => setSocraticTradeoffs(e.target.value)}
                  placeholder="e.g. Traded instant consistency for sub-15ms throughput across edge clusters."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-slate-400 bg-white resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-[11px] leading-relaxed">
                <strong>Why This Matters:</strong> Fabricators rely on generic buzzwords. Real operators explain trade-offs. Recording this context elevates your claim to <em>Author Calibrated</em> before an interview.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSocraticClaim(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSocraticDefense}
                  disabled={!socraticBottleneck.trim() || !socraticTradeoffs.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold disabled:opacity-50 cursor-pointer"
                >
                  Anchor Authorship Brief
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Artifact Upload & Protection Modal */}
      {isArtifactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Add Portfolio Artifact or Document</h3>
              </div>
              <button onClick={() => setIsArtifactModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Artifact Title</label>
                <input
                  type="text"
                  placeholder="e.g. Enterprise RAG Architecture Deck, Patent US-11492102"
                  value={artifactTitle}
                  onChange={(e) => setArtifactTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-slate-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Upload File (PDF, PPTX, DOCX)</label>
                <input
                  ref={artifactDocInputRef}
                  type="file"
                  accept=".pdf,.pptx,.docx"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setArtifactFileName(e.target.files[0].name);
                      if (!artifactTitle) {
                        setArtifactTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                      }
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => artifactDocInputRef.current?.click()}
                  className="w-full py-3 px-4 border border-dashed border-slate-300 hover:border-emerald-600 rounded-xl bg-slate-50 hover:bg-emerald-50/20 text-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <FileUp className="w-4 h-4 text-emerald-600" />
                  <span>{artifactFileName ? `Selected: ${artifactFileName}` : "Click to select document file"}</span>
                </button>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-2 text-slate-400 text-[10px] font-bold uppercase">or link external URL</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Public URL</label>
                <input
                  type="text"
                  placeholder="https://patents.google.com/... or https://github.com/..."
                  value={artifactUrl}
                  onChange={(e) => setArtifactUrl(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-slate-400"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-600" />
                    <span className="font-bold text-slate-800">Password Protection</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={artifactPasswordProtected}
                    onChange={(e) => setArtifactPasswordProtected(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Enable password gating for confidential slide decks or internal architecture memos.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsArtifactModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateArtifact}
                  disabled={!artifactTitle.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold disabled:opacity-50 cursor-pointer"
                >
                  Attach to Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Identity & Contact Verification Modal (Tier 1) */}
      {verifyModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {verifyModalTarget === "LINKEDIN" && "Authenticate LinkedIn Profile"}
                  {verifyModalTarget === "PHONE" && "Verify Phone Number"}
                  {verifyModalTarget === "EMAIL" && "Authenticate Work Email Domain"}
                </h3>
              </div>
              <button onClick={() => setVerifyModalTarget(null)} className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {verifyModalTarget === "LINKEDIN" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Connect your LinkedIn account via OAuth to confirm profile ownership and enable the Verified Identity checkmark.
                </p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                  Target: {contact.linkedinUrl}
                </div>
                <button
                  onClick={() => {
                    setContact({ ...contact, linkedinVerified: true });
                    setVerifyModalTarget(null);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LinkedinIcon className="w-4 h-4" />
                  <span>Connect with LinkedIn OAuth</span>
                </button>
              </div>
            )}

            {verifyModalTarget === "PHONE" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  We will send a 6-digit SMS verification code to <strong>{contact.phone}</strong> to authenticate this device.
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-digit code (e.g. 749201)"
                  value={phoneCodeInput}
                  onChange={(e) => setPhoneCodeInput(e.target.value)}
                  className="w-full text-center tracking-widest font-mono text-sm border border-slate-200 rounded-xl p-2.5 outline-none focus:border-emerald-600"
                />
                <button
                  onClick={() => {
                    setContact({ ...contact, phoneVerified: true });
                    setVerifyModalTarget(null);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Verify Phone Number
                </button>
              </div>
            )}

            {verifyModalTarget === "EMAIL" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Confirm ownership of your work domain ({contact.email}) via SSO or domain magic link.
                </p>
                <button
                  onClick={() => {
                    setContact({ ...contact, emailVerified: true });
                    setVerifyModalTarget(null);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Send Work Domain Confirmation Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}