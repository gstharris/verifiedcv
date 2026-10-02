"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Bot,
  Send,
  Users,
  Check,
  Plus,
  ExternalLink,
  Sparkles,
  Award,
  ChevronRight,
  Clock,
  Layers,
  FileCheck,
  Trash2,
  UploadCloud,
  ClipboardPaste,
  UserCheck,
  X,
  RotateCcw,
  GraduationCap,
  FileText,
  Calendar,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
  Share2,
  Zap,
  Paperclip,
  FileBadge
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";
import {
  STUDIO_DRAFT_KEY,
  STUDIO_SAVED_KEY,
  clearStudioPortfolioStorage,
  hasPortfolioContent,
  readStudioRecord,
  stripProofFromMilestones,
  unverifiedContact,
  writeStudioRecord
} from "@/lib/studioPortfolio";
import { getVerificationStatus, previewVerificationStatus } from "@/lib/verificationLevel";
import { corroborationHeadline } from "@/lib/corroborationDisplay";
import { captureEvent, identifyHandle } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

function LinkedInIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

interface Milestone {
  id: string;
  company: string;
  role: string;
  period: string;
  location?: string;
  claims: string[];
  calibratedClaim?: string;
  artifacts?: { id: string; name: string; type: string }[];
  registryLinks?: { id: string; type: "github" | "credly" | "uspto"; url: string; label: string }[];
  verifications?: { id: string; name: string; role: string; email: string; verifiedAt: string; linkedInUrl?: string }[];
}

interface EducationRecord {
  id: string;
  institution: string;
  degree: string;
  year?: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  linkedinVerified: boolean;
}

const GRAHAM_HARRIS_CANONICAL: {
  fullName: string;
  headline: string;
  summary: string;
  contact: ContactInfo;
  skills: string[];
  education: EducationRecord[];
  milestones: Milestone[];
} = {
  fullName: "Graham Harris",
  headline: "Head of Product Management • AI Platforms",
  summary:
    "Built enterprise technology and ad personalization platforms from $0 to $400M with full P&L ownership, 3 patents, and an 18-person global team across 8 countries at Yahoo. Founded an operational workflow and recommendation platform at PairedRight, engineering RAG architectures evaluated against an operational golden dataset to scale client revenue by over $1M. Restructured complex multi-product SaaS portfolios into modular tiers at Bazaarvoice, reducing sales cycles by 25% and decreasing customer churn by 15%.",
  contact: {
    email: "gstharris@gmail.com",
    phone: "(818) 661-0117",
    location: "Thousand Oaks, CA / Remote",
    linkedin: "linkedin.com/in/gstharris",
    emailVerified: true,
    phoneVerified: true,
    linkedinVerified: true
  },
  skills: [
    "AI Workspace Platforms",
    "Agentic Workflows",
    "Context-Grounded RAG",
    "Ad Personalization Systems",
    "High-Throughput Distributed Microservices",
    "Product Strategy & P&L",
    "Operational Golden Datasets",
    "Interactive Prototyping (React/Cursor)"
  ],
  education: [
    {
      id: "edu-gh-1",
      institution: "University of California",
      degree: "Bachelor of Science",
      year: "Graduated"
    }
  ],
  milestones: [
    {
      id: "m-gh-geon-01",
      company: "Ge-on",
      role: "Head of Product Management",
      period: "May 2025 — Present",
      location: "Remote",
      claims: [
        "Direct end-to-end product strategy, feature prioritization, and delivery roadmaps for an AI workspace platform, driving a 25% lift in weekly active users during initial rollout.",
        "Designed and deployed autonomous agent workflows and proactive push notifications that feed a persistent memory layer, allowing the platform to learn creator preferences and maintain context across interactions.",
        "Build functional interactive prototypes in React, Cursor, and modern UI tools to test user workflows, edge cases, and interface ergonomics directly with users prior to engineering sprints.",
        "Designed and deployed self-serve onboarding journeys and workspace configuration flows, lifting new user activation and account setup completion by 20%.",
        "Partner daily with engineering, data science, and design in Agile cadences to manage backlogs, set acceptance criteria, and ensure system stability."
      ]
    },
    {
      id: "m-gh-scd-02",
      company: "SCD Enterprises / PairedRight",
      role: "Founder and Head of Product",
      period: "2018 — Mar 2026",
      location: "Remote",
      claims: [
        "Founded an operational workflow and recommendation platform for hospitality operators, scaling client revenue by over $1M through automated upselling and real-time guidance.",
        "Rebuilt the core recommendation engine using a context-grounded RAG framework, ensuring automated pairing suggestions remained strictly constrained to curated merchant parameters.",
        "Established an operational golden dataset to benchmark, verify, and regression-test algorithmic changes, ensuring recommendation accuracy before deploying updates to frontline staff devices.",
        "Designed operator dashboards and administrative consoles, providing business owners visibility and control over recommendation rules, inventory availability, and pricing thresholds.",
        "Engineered API integration layers connecting customer-facing mobile interfaces directly with legacy point-of-sale and back-office systems of record to maintain data synchronization.",
        "Designed and deployed automated quote-to-cash workflows, multi-party fee reconciliation, and transactional audit trails, eliminating manual reporting and reducing operational overhead by 10%.",
        "Conducted hundreds of hours of on-site customer discovery shadowing managers and frontline operators during live shifts, converting ground-level friction into structured product specifications."
      ]
    },
    {
      id: "m-gh-yahoo-03",
      company: "Yahoo",
      role: "Head of Product Management",
      period: "2010 — 2024",
      location: "Sunnyvale, CA",
      claims: [
        "Built enterprise technology and ad personalization platforms from $0 to $400M with full P&L ownership, 3 patents, and an 18-person global team across 8 countries.",
        "Maintained sub-50ms query latency budgets across global edge infrastructure."
      ],
      verifications: [
        {
          id: "ver-123",
          name: "Senior Director of Core Engineering",
          role: "Overlapped 2012 — 2018 · 84 months (stated)",
          email: "colleague@yahoo.com",
          verifiedAt: new Date().toISOString()
        }
      ]
    }
  ]
};

function linkedInReturnMessage(auth: string | null, reason: string | null, hasSession: boolean) {
  if (hasSession) return "";
  if (auth === "success") {
    return "LinkedIn signed you in, but this browser did not keep the session. Use www.verifiedcv.app and try again.";
  }
  if (auth !== "error") return "";
  if (reason === "state") {
    return "LinkedIn sign-in lost its session cookie. Open this page on www.verifiedcv.app and try again.";
  }
  if (reason === "denied") return "LinkedIn sign-in was cancelled.";
  if (reason === "profile") return "LinkedIn did not return a usable profile. Try again.";
  return "LinkedIn sign-in did not complete. Try again.";
}

export default function StudioPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [summaryStatement, setSummaryStatement] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [education, setEducation] = useState<EducationRecord[]>([]);

  const [contact, setContact] = useState<ContactInfo>({
    email: "gstharris@gmail.com",
    phone: "(818) 661-0117",
    location: "Thousand Oaks, CA / Remote",
    linkedin: "linkedin.com/in/gstharris",
    emailVerified: false,
    phoneVerified: false,
    linkedinVerified: false
  });

  const [activeTab, setActiveTab] = useState<"canvas" | "paste">("canvas");
  const [pasteBuffer, setPasteBuffer] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [highlightedMilestoneId, setHighlightedMilestoneId] = useState<string | null>(null);

  // Claim Modal State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [fullName, setFullName] = useState("Graham Harris");
  const [handle, setHandle] = useState("gharris");
  const [headline, setHeadline] = useState("Head of Product Management • AI Platforms");
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPortfolioSaved, setIsPortfolioSaved] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isReplayingProof, setIsReplayingProof] = useState(false);
  const skipNextAutosaveRef = useRef(true);

  // Peer Corroboration Modal State
  const [isVerifyHubOpen, setIsVerifyHubOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [artifactScanError, setArtifactScanError] = useState<string | null>(null);
  const returnToVerifyHubRef = useRef(false);
  const [targetMilestone, setTargetMilestone] = useState<Milestone | null>(null);
  const [colleagueEmail, setColleagueEmail] = useState("");
  const [colleagueRole, setColleagueRole] = useState("Engineering Peer / Manager");
  const [inviteSent, setInviteSent] = useState(false);
  const [waitingForPeer, setWaitingForPeer] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerifyError, setEmailVerifyError] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneVerifyError, setPhoneVerifyError] = useState("");
  const [linkedinVerifyError, setLinkedinVerifyError] = useState("");

  // Handle Availability State
  const [handleStatus, setHandleStatus] = useState<"checking" | "available" | "owned" | "taken" | "idle">("available");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [restoreCode, setRestoreCode] = useState("");
  const [restoreSending, setRestoreSending] = useState(false);
  const [restoreUnlocking, setRestoreUnlocking] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState("");

  const milestoneCounts = (m: Milestone) => ({
    peers: m.verifications?.length || 0,
    docs: m.artifacts?.length || 0,
    registry: Boolean(m.registryLinks && m.registryLinks.length > 0)
  });

  const getVerificationLevel = (m: Milestone) => {
    const status = getVerificationStatus(milestoneCounts(m));
    if (status.level === 3) {
      return { ...status, color: "text-emerald-800 bg-emerald-50 border-emerald-200", icon: <ShieldCheck className="w-3 h-3 text-[#059669]" /> };
    }
    if (status.level === 2) {
      const isHighlyVerified = status.label === "Highly Verified";
      return {
        ...status,
        label: isHighlyVerified ? "Highly Verified ⭐" : status.label,
        color: isHighlyVerified ? "text-amber-800 bg-amber-50 border-amber-200" : "text-indigo-800 bg-indigo-50 border-indigo-200",
        icon: isHighlyVerified ? <Award className="w-3 h-3 text-amber-600" /> : <Users className="w-3 h-3 text-indigo-600" />
      };
    }
    if (status.level === 1) {
      return { ...status, color: "text-blue-800 bg-blue-50 border-blue-200", icon: <FileCheck className="w-3 h-3 text-blue-600" /> };
    }
    return { ...status, color: "text-slate-600 bg-slate-100 border-slate-200", icon: <AlertCircle className="w-3 h-3 text-slate-500" /> };
  };

  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setContact(prev => ({ ...prev, email: user.email || prev.email }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user?.email) {
        setContact(prev => ({ ...prev, email: session.user.email || prev.email }));
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ally" | "user"; text: string }>>([
    {
      sender: "ally",
      text: "Welcome to VerifiedCV. Upload your resume or paste your career history to get started."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const actionPrompts = React.useMemo(() => {
    if (!isPortfolioSaved) {
      return [
        { label: "Review & Edit Resume", action: "review_resume" },
        { label: "Save Portfolio", action: "save_portfolio" }
      ];
    }
    if (!contact.linkedinVerified || !contact.emailVerified) {
      return [
        { label: "Verify Identity (Email, Phone, LinkedIn)", action: "verify_identity" }
      ];
    }
    return [
      { label: "Invite Peers & Managers", action: "invite_peers" },
      { label: "Attach Documents", action: "attach_docs" }
    ];
  }, [isPortfolioSaved, contact.linkedinVerified, contact.emailVerified]);

  const buildPortfolioPayload = () => ({
    handle: handle.toLowerCase().trim(),
    email: contact.email,
    fullName,
    headline,
    summaryStatement,
    contact,
    skills,
    education,
    milestones
  });

  const persistPortfolioLocally = (saved: boolean, payload = buildPortfolioPayload()) => {
    writeStudioRecord(STUDIO_DRAFT_KEY, payload);
    if (saved) {
      writeStudioRecord(STUDIO_SAVED_KEY, payload);
    }
  };


  const applyPortfolioRecord = (parsed: any) => {
    if (!parsed) return;
    if (Array.isArray(parsed.milestones)) {
      setMilestones(
        parsed.milestones.map((m: any) => ({
          ...m,
          claims: (Array.isArray(m.claims) ? m.claims : m.calibratedClaim ? [m.calibratedClaim] : []).filter(
            (c: string) => c.replace(/[^a-zA-Z]/g, "").length >= 12
          )
        }))
      );
    }
    if (parsed.fullName) setFullName(parsed.fullName);
    if (parsed.headline) setHeadline(parsed.headline);
    if (parsed.summaryStatement) setSummaryStatement(parsed.summaryStatement);
    if (parsed.skills) setSkills(parsed.skills);
    if (parsed.education) setEducation(parsed.education);
    if (parsed.contact) setContact((prev) => ({ ...prev, ...parsed.contact }));
    if (parsed.handle) setHandle(String(parsed.handle).toLowerCase().trim());
    setActiveTab("canvas");
  };

  const requirePortfolioSaved = (onReady: () => void) => {
    if (!isPortfolioSaved) {
      setIsClaimModalOpen(true);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ally",
          text: "Save your portfolio first. Editing, verification, and corroboration start after this profile is saved."
        }
      ]);
      return;
    }
    persistPortfolioLocally(true);
    onReady();
  };

  const lockIfUnsaved = (e: React.SyntheticEvent) => {
    if (isPortfolioSaved) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.target instanceof HTMLElement) e.target.blur();
    setIsClaimModalOpen(true);
  };

  const openVerifyHub = (milestone: Milestone) => {
    requirePortfolioSaved(() => {
      setTargetMilestone(milestone);
      setIsVerifyHubOpen(true);
    });
  };

  const openVerifyStep = (step: "peer" | "doc") => {
    returnToVerifyHubRef.current = true;
    setIsVerifyHubOpen(false);
    if (step === "peer") setIsInviteModalOpen(true);
    if (step === "doc") {
      setArtifactScanError(null);
      setIsArtifactModalOpen(true);
    }
  };

  const closeVerifyStep = (close: () => void) => {
    close();
    if (returnToVerifyHubRef.current) {
      returnToVerifyHubRef.current = false;
      setIsVerifyHubOpen(true);
    }
  };

  const loadCanonicalRecord = () => {
    setFullName(GRAHAM_HARRIS_CANONICAL.fullName);
    setHeadline(GRAHAM_HARRIS_CANONICAL.headline);
    setSummaryStatement(GRAHAM_HARRIS_CANONICAL.summary);
    setContact(GRAHAM_HARRIS_CANONICAL.contact);
    setSkills(GRAHAM_HARRIS_CANONICAL.skills);
    setEducation(GRAHAM_HARRIS_CANONICAL.education);
    setMilestones(GRAHAM_HARRIS_CANONICAL.milestones);
    setHandle("gharris");
    setActiveTab("canvas");
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "ally",
        text: "Loaded Graham Harris canonical record. Save this portfolio before verifying identity or requesting corroboration."
      }
    ]);
  };

  const executeIngest = async (text: string) => {
    setIsProcessing(true);
    setChatMessages((prev) => [
      ...prev,
      { sender: "ally", text: "Analyzing career history, contact details, and dates..." }
    ]);

    try {
      const formData = new FormData();
      formData.append("text", text);

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.milestones && data.milestones.length > 0) {
        const formattedMilestones = data.milestones.map((m: any) => ({
          ...m,
          claims: (Array.isArray(m.claims) ? m.claims : (m.calibratedClaim ? [m.calibratedClaim] : [])).filter(
            (c: string) => c.replace(/[^a-zA-Z]/g, "").length >= 12
          )
        }));

        setMilestones(formattedMilestones);
        if (data.fullName) setFullName(data.fullName);
        if (data.headline) setHeadline(data.headline);
        if (data.summaryStatement) setSummaryStatement(data.summaryStatement);
        if (data.skills) setSkills(data.skills);
        if (data.education) setEducation(data.education);
        if (data.contact) setContact((prev) => ({ ...prev, ...data.contact }));

        setActiveTab("canvas");
        captureEvent("resume_parsed", { source: "studio_paste", chapters: data.milestones.length });
        setChatMessages([
          {
            sender: "ally",
            text: "Upload successful. Please review your resume below and edit as necessary. Once it looks good, save your portfolio to begin verification."
          }
        ]);
      } else {
        alert(data.error || "Failed to parse text input.");
      }
    } catch {
      alert("Network communication error with /api/parse.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const linkedInAuth = urlParams.get("linkedin_auth");
    const linkedInReason = urlParams.get("linkedin_reason");
    const saved = readStudioRecord<any>(STUDIO_SAVED_KEY);
    const draft = readStudioRecord<any>(STUDIO_DRAFT_KEY);
    const pendingRaw = sessionStorage.getItem("vcv_pending_payload");

    if (saved && hasPortfolioContent(saved)) {
      skipNextAutosaveRef.current = true;
      applyPortfolioRecord(saved);
      setIsPortfolioSaved(true);
      setSaveStatus("saved");
      setChatMessages([
        {
          sender: "ally",
          text: "Welcome back. Your portfolio is saved and ready."
        }
      ]);
    } else if (draft && hasPortfolioContent(draft)) {
      applyPortfolioRecord(draft);
      setChatMessages([
        {
          sender: "ally",
          text: "Loaded your draft portfolio. Review your chapters and save when ready."
        }
      ]);
    } else if (pendingRaw) {
      try {
        const parsed = JSON.parse(pendingRaw);
        sessionStorage.removeItem("vcv_pending_payload");

        if (parsed.action === "load_canonical") {
          loadCanonicalRecord();
        } else if (parsed.milestones && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
          applyPortfolioRecord(parsed);
          setChatMessages([
            {
              sender: "ally",
              text: "Upload successful. Please review your resume below and edit as necessary. Once it looks good, save your portfolio to begin verification."
            }
          ]);
        } else if (parsed.rawText && parsed.rawText.trim().length > 0) {
          executeIngest(parsed.rawText);
        }
      } catch {
        // ignore
      }
    }

    async function applyLinkedInSession() {
      try {
        const res = await fetch("/api/auth/linkedin/session");
        const data = await res.json();
        if (data?.authenticated && data.profile) {
          if (data.usableForConfirm === false) {
            setLinkedinVerifyError(data.confirmError || "This LinkedIn account is too incomplete to verify.");
            if (linkedInAuth) {
              window.history.replaceState({}, document.title, "/studio");
            }
            return;
          }
          setContact((prev) => {
            const nextContact = {
              ...prev,
              email: prev.email || data.profile.email || prev.email,
              linkedinVerified: true
            };
            const base = saved && hasPortfolioContent(saved) ? saved : draft;
            if (base && hasPortfolioContent(base)) {
              const synced = {
                ...base,
                contact: { ...base.contact, ...nextContact },
                email: nextContact.email,
                linkedinSub: data.profile.sub
              };
              writeStudioRecord(STUDIO_DRAFT_KEY, synced);
              if (saved) {
                skipNextAutosaveRef.current = true;
                writeStudioRecord(STUDIO_SAVED_KEY, synced);
                fetch("/api/vault", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify(synced)
                }).catch(() => {});
              }
            }
            return nextContact;
          });
          if (linkedInAuth === "success") {
            setLinkedinVerifyError("");
            setChatMessages((prev) => [
              ...prev,
              {
                sender: "ally",
                text: `LinkedIn identity confirmed${data.profile.name ? ` for ${data.profile.name}` : ""}. We will not post to your profile.`
              }
            ]);
            captureEvent("linkedin_verified");
            window.history.replaceState({}, document.title, "/studio");
          }
          return;
        }
      } catch {
        // Session lookup is optional; the Verify button still works.
      }

      const returnError = linkedInReturnMessage(linkedInAuth, linkedInReason, false);
      if (returnError) {
        setLinkedinVerifyError(returnError);
        setChatMessages((prev) => [...prev, { sender: "ally", text: returnError }]);
        window.history.replaceState({}, document.title, "/studio");
      }
    }

    applyLinkedInSession();
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    const payload = {
      handle: handle.toLowerCase().trim(),
      email: contact.email,
      fullName,
      headline,
      summaryStatement,
      contact,
      skills,
      education,
      milestones
    };
    if (!hasPortfolioContent(payload)) return;
    persistPortfolioLocally(isPortfolioSaved, payload);

    if (!isPortfolioSaved) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("saving");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/vault", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });
        setSaveStatus(res.ok ? "saved" : "error");
      } catch {
        setSaveStatus("error");
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [contact, education, fullName, handle, headline, isPortfolioSaved, milestones, skills, summaryStatement]);

  useEffect(() => {
    if (!handle || handle.length < 2) {
      setTimeout(() => setHandleStatus("idle"), 0);
      return;
    }

    if (isPortfolioSaved) {
      setHandleStatus("available");
      return;
    }

    setHandleStatus("checking");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vault/check?handle=${encodeURIComponent(handle)}`);
        if (res.ok) {
          const data = await res.json();
          setHandleStatus(data.reason === "owned" ? "owned" : data.available ? "available" : "taken");
        } else {
          setHandleStatus("available");
        }
      } catch {
        setHandleStatus("available");
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [handle, isPortfolioSaved]);

  useEffect(() => {
    if (!isPortfolioSaved || !waitingForPeer || !handle) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/vault?handle=${encodeURIComponent(handle)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data.milestones)) return;
        const nextCount = data.milestones.reduce(
          (acc: number, m: Milestone) => acc + (m.verifications?.length || 0),
          0
        );
        const currentCount = milestones.reduce((acc, m) => acc + (m.verifications?.length || 0), 0);
        if (nextCount > currentCount) {
          setMilestones(data.milestones);
          setWaitingForPeer(false);
          setChatMessages((prev) => [
            ...prev,
            { sender: "ally", text: "A peer confirmed a company chapter. The dossier is updated." }
          ]);
        }
      } catch {
        // keep polling
      }
    };

    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [handle, isPortfolioSaved, milestones, waitingForPeer]);


  const handleManualPasteSubmit = async () => {
    if (!pasteBuffer.trim() || isProcessing) return;
    await executeIngest(pasteBuffer.trim());
    setPasteBuffer("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || isProcessing) return;
    const file = e.target.files[0];
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.milestones && data.milestones.length > 0) {
        const formattedMilestones = data.milestones.map((m: any) => ({
          ...m,
          claims: (Array.isArray(m.claims) ? m.claims : (m.calibratedClaim ? [m.calibratedClaim] : [])).filter(
            (c: string) => c.replace(/[^a-zA-Z]/g, "").length >= 12
          )
        }));

        setMilestones(formattedMilestones);
        if (data.fullName) setFullName(data.fullName);
        if (data.headline) setHeadline(data.headline);
        if (data.summaryStatement) setSummaryStatement(data.summaryStatement);
        if (data.skills) setSkills(data.skills);
        if (data.education) setEducation(data.education);
        if (data.contact) setContact((prev) => ({ ...prev, ...data.contact }));

        setActiveTab("canvas");
        captureEvent("resume_parsed", { source: "studio_upload", chapters: data.milestones.length });
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Parsed ${data.milestones.length} career chapters from ${file.name}. Save your portfolio to unlock verification.`
          }
        ]);
      } else {
        alert(data.error || "File parsing failed.");
      }
    } catch {
      alert("Error uploading document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionPrompt = (actionType: string) => {
    if (actionType === "review_resume") {
      setChatMessages((prev) => [
        ...prev,
        { sender: "user", text: "Review & Edit Resume" },
        { sender: "ally", text: "Scroll through your career chapters on the right. You can edit titles, dates, and claims. We recommend keeping only the most impactful, factual deliverables." }
      ]);
      return;
    }
    if (actionType === "save_portfolio") {
      setIsClaimModalOpen(true);
      return;
    }

    requirePortfolioSaved(() => {
      if (actionType === "verify_identity") {
        setChatMessages((prev) => [
          ...prev,
          { sender: "user", text: "Verify Identity" },
          { sender: "ally", text: "Use the 'Verify Identity' button at the top to confirm your email, phone, and LinkedIn profile." }
        ]);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (actionType === "invite_peers" || actionType === "attach_docs") {
        if (milestones.length > 0) {
          setTargetMilestone(milestones[0]);
          setIsVerifyHubOpen(true);
        }
      }
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const query = chatInput.trim();
    const normalized = query.toLowerCase();
    setChatMessages((prev) => [...prev, { sender: "user", text: query }]);
    setChatInput("");

    if (
      normalized.includes("save") ||
      normalized.includes("portfolio") ||
      normalized.includes("handle") ||
      normalized.includes("claim")
    ) {
      if (isPortfolioSaved) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: "Your portfolio is already saved. Edits update automatically."
          }
        ]);
        return;
      }
      if (!hasPortfolioContent({ milestones, summaryStatement })) {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: "Upload or paste a resume first, then I can save your portfolio."
          }
        ]);
        return;
      }
      setIsClaimModalOpen(true);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ally",
          text: "Opening save now. After this, you can edit fields and start verification."
        }
      ]);
      return;
    }

    if (normalized.includes("validate") || normalized.includes("achievement")) {
      handleActionPrompt("validate_recent");
    } else if (
      normalized.includes("peer") ||
      normalized.includes("corroborat") ||
      normalized.includes("verify") ||
      normalized.includes("artifact") ||
      normalized.includes("proof") ||
      normalized.includes("attach")
    ) {
      handleActionPrompt("verify_company");
    } else {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: isPortfolioSaved
              ? "I can help verify a chapter, request a peer, or attach proof. What should we do next?"
              : "Save your portfolio first, then we can verify chapters and request corroboration."
          }
        ]);
      }, 400);
    }
  };

  const handleClaimVaultCommit = async (e: React.FormEvent) => {
    e.preventDefault();

    let isValid = true;
    if (!fullName.trim() || fullName.trim().length < 2) {
      setNameError("Please enter a valid full name.");
      isValid = false;
    } else {
      setNameError("");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contact.email || !emailRegex.test(contact.email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (handleStatus === "taken" && !isPortfolioSaved) {
      setRestoreNotice("This handle is already claimed. If it is yours, send a restore code to the email on the account.");
      isValid = false;
    }

    if (!isValid) return;

    setIsCommitting(true);
    const dossierPayload = {
      handle: handle.toLowerCase().trim(),
      email: contact.email,
      fullName,
      headline,
      summaryStatement,
      contact,
      skills,
      education,
      milestones
    };

    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dossierPayload)
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        skipNextAutosaveRef.current = true;
        persistPortfolioLocally(true, dossierPayload);
        setIsPortfolioSaved(true);
        setSaveStatus("saved");
        setIsClaimModalOpen(false);
        identifyHandle(handle.toLowerCase().trim());
        captureEvent("portfolio_saved", { handle: handle.toLowerCase().trim(), restoreEmailed: Boolean(data.restoreEmailed) });
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Portfolio saved. Live dossier is active at verifiedcv.app/${handle.toLowerCase().trim()}. You can now verify identity and request corroboration.`
          }
        ]);
      } else {
        setRestoreNotice(data.error || "Failed to save portfolio.");
        if (data.code === "HANDLE_OWNED") setHandleStatus("taken");
        if (data.code === "EMAIL_TAKEN" && data.handle) {
          setHandle(String(data.handle).toLowerCase().trim());
          setHandleStatus("taken");
        }
      }
    } catch {
      alert("Network error saving portfolio.");
    } finally {
      setIsCommitting(false);
    }
  };

  const updateVaultStore = async (updatedMilestones: Milestone[]) => {
    if (!isPortfolioSaved || !handle) return;
    const dossierPayload = {
      handle: handle.toLowerCase().trim(),
      email: contact.email,
      fullName,
      headline,
      summaryStatement,
      contact,
      skills,
      education,
      milestones: updatedMilestones
    };
    try {
      persistPortfolioLocally(true, dossierPayload);
      await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(dossierPayload)
      });
    } catch (err) {
      console.warn("Failed to background sync vault:", err);
    }
  };

  const sendRestoreCode = async () => {
    setRestoreSending(true);
    setRestoreNotice("");
    try {
      const res = await fetch("/api/vault/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ handle: handle.toLowerCase().trim(), email: contact.email })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRestoreNotice(data.error || "Could not send a restore code.");
        return;
      }
      setRestoreNotice("Check your email for a 6-digit restore code.");
    } catch {
      setRestoreNotice("Network error sending the restore code.");
    } finally {
      setRestoreSending(false);
    }
  };

  const unlockWithRestoreCode = async () => {
    setRestoreUnlocking(true);
    setRestoreNotice("");
    try {
      const claimed = handle.toLowerCase().trim();
      const res = await fetch("/api/vault/restore", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ handle: claimed, email: contact.email, code: restoreCode })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRestoreNotice(data.error || "That code did not work.");
        return;
      }

      const vaultRes = await fetch(`/api/vault?handle=${encodeURIComponent(claimed)}`, { credentials: "include" });
      if (!vaultRes.ok) {
        setRestoreNotice("Unlocked, but could not load the saved portfolio.");
        return;
      }
      const record = await vaultRes.json();
      skipNextAutosaveRef.current = true;
      applyPortfolioRecord(record);
      persistPortfolioLocally(true, {
        handle: record.handle || claimed,
        email: record.contact?.email || contact.email,
        fullName: record.fullName,
        headline: record.headline,
        summaryStatement: record.summaryStatement,
        contact: record.contact,
        skills: record.skills,
        education: record.education,
        milestones: record.milestones
      });
      setIsPortfolioSaved(true);
      setSaveStatus("saved");
      setHandleStatus("owned");
      setIsClaimModalOpen(false);
      setRestoreCode("");
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ally",
          text: `Restored verifiedcv.app/${claimed} in this browser. You can edit and continue verification.`
        }
      ]);
    } catch {
      setRestoreNotice("Network error restoring this handle.");
    } finally {
      setRestoreUnlocking(false);
    }
  };

  const handleArtifactUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !targetMilestone) return;
    const file = e.target.files[0];
    e.target.value = "";

    setIsProcessing(true);
    setArtifactScanError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("company", targetMilestone.company);
    formData.append("period", targetMilestone.period);
    formData.append("candidateName", fullName);
    formData.append("handle", handle.toLowerCase().trim());
    formData.append("milestoneId", targetMilestone.id);

    try {
      const res = await fetch("/api/verify/document/scan", {
        method: "POST",
        credentials: "include",
        body: formData
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.matched || !data.artifact) {
        captureEvent("document_scan_failed", { handle: handle.toLowerCase().trim(), company: targetMilestone.company });
        setArtifactScanError(data.error || "This file did not match the employer and dates on this chapter.");
        return;
      }

      const newArtifact = {
        id: data.artifact.id,
        name: data.artifact.name,
        type: data.artifact.type
      };
      const updatedMilestones = milestones.map((m) => {
        if (m.id !== targetMilestone.id) return m;
        return {
          ...m,
          artifacts: [...(m.artifacts || []), newArtifact]
        };
      });

      setMilestones(updatedMilestones);
      await updateVaultStore(updatedMilestones);
      setIsArtifactModalOpen(false);
      captureEvent("document_scan_succeeded", { handle: handle.toLowerCase().trim(), company: targetMilestone.company });
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ally",
          text: `Document matched ${targetMilestone.company}. The file was deleted after the scan. This chapter now has employment-document proof.`
        }
      ]);
    } catch {
      setArtifactScanError("Network error scanning that document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const dispatchPeerInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!colleagueEmail || !targetMilestone) return;

    setInviteSent(true);
    try {
      const res = await fetch("/api/verify/attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateHandle: handle,
          candidateName: fullName,
          experienceId: targetMilestone.id,
          companyName: targetMilestone.company,
          roleTitle: targetMilestone.role,
          tenureDates: targetMilestone.period,
          claims: targetMilestone.claims.map((c, i) => ({ id: `c${i}`, raw_bullet: c })),
          attestorEmail: colleagueEmail
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || "Could not send the verification request.");
        return;
      }

      setIsInviteModalOpen(false);
      setWaitingForPeer(true);
      captureEvent("peer_invite_sent", { handle: handle.toLowerCase().trim(), company: targetMilestone.company });
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ally",
          text: `Invitation sent to ${colleagueEmail}. This chapter updates when they confirm with LinkedIn.`
        }
      ]);
    } catch {
      alert("Network error sending the verification request.");
    } finally {
      setInviteSent(false);
    }
  };

  const addEmptyMilestone = () => {
    const newM: Milestone = {
      id: `m-custom-${Date.now()}`,
      company: "Company or Initiative",
      role: "Product & Technical Leader",
      period: "Jan 2026 — Present",
      location: "Remote",
      claims: ["Direct product strategy, platform execution, and quantifiable business outcomes..."],
    };
    setMilestones((prev) => [newM, ...prev]);
  };

  const updateMilestoneClaim = (milestoneId: string, claimIndex: number, newText: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== milestoneId) return m;
        const updatedClaims = [...m.claims];
        updatedClaims[claimIndex] = newText;
        return { ...m, claims: updatedClaims };
      })
    );
  };

  const addClaimToMilestone = (milestoneId: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          claims: [...m.claims, "Describe quantified business execution and operational trade-offs..."]
        };
      })
    );
  };

  const deleteClaimFromMilestone = (milestoneId: string, claimIndex: number) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          claims: m.claims.filter((_, idx) => idx !== claimIndex)
        };
      })
    );
  };

  const corroboratedCount = milestones.reduce((acc, m) => acc + (m.verifications?.length || 0), 0);
  const verifiedSignalsCount =
    (contact.emailVerified ? 1 : 0) +
    (contact.linkedinVerified ? 1 : 0) +
    (contact.phoneVerified ? 1 : 0) +
    corroboratedCount;

  // Portfolio Verification Stats
  const level0Count = milestones.filter(m => getVerificationLevel(m).level === 0).length;
  const level1Count = milestones.filter(m => getVerificationLevel(m).level === 1).length;
  const level2Count = milestones.filter(m => getVerificationLevel(m).level === 2).length;
  const level3Count = milestones.filter(m => getVerificationLevel(m).level === 3).length;
  const totalVerified = level1Count + level2Count + level3Count;
  const portfolioScore = milestones.length > 0 ? Math.round((totalVerified / milestones.length) * 100) : 0;

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col antialiased selection:bg-emerald-100">
      <header className="shrink-0 sticky top-0 z-50 bg-white border-b border-[#E2E8F0] h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <VerifiedCVLogo className="w-6 h-6 group-hover:scale-105 transition-transform" />
            <span className="font-black text-base text-[#0F172A] tracking-tight">VerifiedCV</span>
          </Link>
          <span className="text-[#E2E8F0]">/</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Candidate Studio
          </span>
        </div>

        <div className="flex items-center gap-3">
          {(milestones.length > 0 || summaryStatement) && !isPortfolioSaved && (
            <button
              type="button"
              onClick={() => {
                setMilestones([]);
                setSummaryStatement("");
                setSkills([]);
                setEducation([]);
                setIsPortfolioSaved(false);
                setSaveStatus("idle");
                clearStudioPortfolioStorage();
                setActiveTab("canvas");
              }}
              className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Canvas</span>
            </button>
          )}

          {isPortfolioSaved ? (
            <>
              <span className="text-[11px] font-semibold text-slate-400">
                {saveStatus === "saving" ? "Saving..." : saveStatus === "error" ? "Save failed" : "All changes saved"}
              </span>
              <Link
                href={`/${handle.toLowerCase().trim()}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <span>View Live Dossier</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </>
          ) : (
            (milestones.length > 0 || summaryStatement) && (
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Save Portfolio</span>
              </button>
            )
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* CV ALLY */}
        <aside className="w-[320px] shrink-0 border-r border-[#E2E8F0] bg-white flex flex-col justify-between h-full">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-2.5 bg-[#F8FAFC]">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669]">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-[#0F172A]">Ally</h3>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`text-xs leading-relaxed p-3 rounded-xl ${
                  msg.sender === "ally"
                    ? "bg-[#F8FAFC] border border-[#E2E8F0] text-slate-700"
                    : "bg-[#0F172A] text-white ml-4 shadow-2xs"
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isProcessing && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] text-slate-500 text-xs p-3 rounded-xl flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 animate-spin text-[#059669]" />
                <span>Auditing claims & contact channels...</span>
              </div>
            )}
          </div>

          <div className="p-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-1.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-1">
              Recommended Next Actions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {actionPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleActionPrompt(p.action)}
                  className="text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-[#E2E8F0] px-2.5 py-1 rounded-lg transition-all shadow-2xs cursor-pointer text-left"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#E2E8F0] bg-white">
            <div className="relative flex items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Ally to save or invite a colleague..."
                className="w-full text-xs pl-3 pr-8 py-2 rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-sans bg-slate-50/50"
              />
              <button
                type="submit"
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </aside>

        {/* LIVE CANVAS */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="p-8 max-w-5xl mx-auto space-y-8 antialiased">
            {milestones.length > 0 && isPortfolioSaved && level0Count > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-sm font-black text-[#0F172A] tracking-tight">You have {level0Count} unverified {level0Count === 1 ? 'claim' : 'claims'}</h2>
                </div>
                <button onClick={() => {
                  const firstUnverified = milestones.find(m => getVerificationLevel(m).level === 0);
                  if (firstUnverified) {
                    document.getElementById(firstUnverified.id)?.scrollIntoView({ behavior: 'smooth' });
                  }
                }} className="font-bold text-[#059669] hover:text-emerald-700 transition-colors cursor-pointer text-xs flex items-center gap-1">
                  Level Up Now <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {milestones.length === 0 && !summaryStatement ? (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xs max-w-2xl mx-auto mt-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669] mx-auto">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-[#0F172A]">Ingest Your Career Track Record</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Upload your resume or paste below. We keep dates, titles, and company names intact.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  <span>{isProcessing ? "Analyzing..." : "Upload Document"}</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setActiveTab("paste")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                  <span>Paste Resume Text</span>
                </button>

                <button
                  type="button"
                  onClick={loadCanonicalRecord}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Load Graham Harris Profile</span>
                </button>
              </div>

              {activeTab === "paste" && (
                <div className="text-left space-y-3 pt-4 border-t border-[#E2E8F0]">
                  <textarea
                    rows={12}
                    value={pasteBuffer}
                    onChange={(e) => setPasteBuffer(e.target.value)}
                    spellCheck={true}
                    autoCorrect="on"
                    lang="en"
                    placeholder="Paste resume text with contact headers and pipe-delimited experience chapters..."
                    className="w-full text-xs p-4 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-mono bg-[#F8FAFC] leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Full company titles, contact channels, and achievements map into distinct cards.
                    </span>

                    <button
                      type="button"
                      disabled={isProcessing || !pasteBuffer.trim()}
                      onClick={handleManualPasteSubmit}
                      className="px-5 py-2.5 bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span>{isProcessing ? "Extracting..." : "Parse Milestones"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="space-y-8"
              onFocusCapture={lockIfUnsaved}
              onClickCapture={(e) => {
                const target = e.target as HTMLElement;
                if (!isPortfolioSaved && target.closest("button, input, textarea, select")) {
                  lockIfUnsaved(e);
                }
              }}
            >
              {/* Candidate Identity & Contact Verification Strip */}
              <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={fullName}
                      readOnly={!isPortfolioSaved}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Candidate Legal Name"
                      spellCheck={true}
                      className={`text-xl sm:text-2xl font-black text-[#0F172A] focus:outline-none border-b border-transparent ${isPortfolioSaved ? "focus:border-[#059669]" : "cursor-pointer"}`}
                    />
                    <input
                      type="text"
                      value={headline}
                      readOnly={!isPortfolioSaved}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Professional Headline"
                      spellCheck={true}
                      className={`w-full text-xs sm:text-sm font-semibold text-slate-600 focus:outline-none border-b border-transparent ${isPortfolioSaved ? "focus:border-[#059669]" : "cursor-pointer"}`}
                    />
                  </div>

                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto border ${
                    isPortfolioSaved
                      ? "bg-emerald-50 border-emerald-200 text-[#059669]"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isPortfolioSaved ? "Portfolio Saved" : "Save to edit"}</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="email"
                        value={contact.email}
                        readOnly={!isPortfolioSaved}
                        onChange={(e) => setContact({ ...contact, email: e.target.value })}
                        placeholder="Work Email"
                        className={`w-full text-xs bg-transparent focus:outline-none font-medium ${isPortfolioSaved ? "" : "cursor-pointer"}`}
                      />
                    </div>
                    {contact.emailVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          requirePortfolioSaved(async () => {
                            setEmailVerifyError("");
                            if (!contact.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
                              setEmailVerifyError("Enter a valid email first.");
                              return;
                            }
                            const res = await fetch("/api/verify/email", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: contact.email })
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              setEmailCodeSent(true);
                              setChatMessages((prev) => [
                                ...prev,
                                { sender: "ally", text: `Check ${contact.email} for a 6-digit code.` }
                              ]);
                            } else {
                              setEmailVerifyError(data.error || "Could not send the email code.");
                            }
                          });
                        }}
                        className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
                      >
                        {emailCodeSent ? "Resend" : "Verify"}
                      </button>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={contact.phone}
                        readOnly={!isPortfolioSaved}
                        onChange={(e) => setContact({ ...contact, phone: e.target.value, phoneVerified: false })}
                        placeholder="Phone"
                        className={`w-full text-xs bg-transparent focus:outline-none font-medium ${isPortfolioSaved ? "" : "cursor-pointer"}`}
                      />
                    </div>
                    {contact.phoneVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          requirePortfolioSaved(async () => {
                            setPhoneVerifyError("");
                            const res = await fetch("/api/verify/phone", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ phone: contact.phone, handle })
                            });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              setPhoneCodeSent(true);
                              setChatMessages((prev) => [
                                ...prev,
                                { sender: "ally", text: `Check ${contact.phone} for a 6-digit SMS code.` }
                              ]);
                            } else {
                              setPhoneVerifyError(data.error || "Could not send the SMS code.");
                            }
                          });
                        }}
                        className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
                      >
                        {phoneCodeSent ? "Resend" : "Verify"}
                      </button>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <LinkedInIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <input
                        type="text"
                        value={contact.linkedin}
                        readOnly={!isPortfolioSaved}
                        onChange={(e) => setContact({ ...contact, linkedin: e.target.value })}
                        placeholder="LinkedIn URL"
                        className={`w-full text-xs bg-transparent focus:outline-none font-medium text-blue-700 ${isPortfolioSaved ? "" : "cursor-pointer"}`}
                      />
                    </div>
                    {contact.linkedinVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : (
                      <button onClick={() => {
                        requirePortfolioSaved(() => {
                          setLinkedinVerifyError("");
                          persistPortfolioLocally(true);
                          window.location.href = "/api/auth/linkedin?next=/studio";
                          captureEvent("linkedin_verify_clicked", { handle: handle.toLowerCase().trim() });
                        });
                      }} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer shrink-0">Verify</button>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={contact.location}
                      readOnly={!isPortfolioSaved}
                      onChange={(e) => setContact({ ...contact, location: e.target.value })}
                      placeholder="Location / Remote"
                      className={`w-full text-xs bg-transparent focus:outline-none font-medium ${isPortfolioSaved ? "" : "cursor-pointer"}`}
                    />
                  </div>
                </div>
                {emailCodeSent && !contact.emailVerified && (
                  <div className="mt-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center gap-2">
                    <p className="text-xs text-slate-600 flex-1">
                      Enter the 6-digit code sent to {contact.email}.
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-28 text-sm tracking-[0.3em] font-mono px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#059669]"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setEmailVerifyError("");
                        const res = await fetch("/api/verify/email", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email: contact.email, code: emailCode })
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          const nextContact = { ...contact, emailVerified: true };
                          setContact(nextContact);
                          setEmailCodeSent(false);
                          setEmailCode("");
                          const dossierPayload = { ...buildPortfolioPayload(), contact: nextContact };
                          persistPortfolioLocally(true, dossierPayload);
                          if (isPortfolioSaved) {
                            fetch("/api/vault", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify(dossierPayload)
                            }).catch(() => undefined);
                          }
                          setChatMessages((prev) => [...prev, { sender: "ally", text: "Email confirmed." }]);
                          captureEvent("email_verified", { handle: handle.toLowerCase().trim() });
                        } else {
                          setEmailVerifyError(data.error || "That code did not match.");
                        }
                      }}
                      className="text-xs font-bold text-white bg-[#059669] hover:bg-emerald-700 px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                )}
                {phoneCodeSent && !contact.phoneVerified && (
                  <div className="mt-3 p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center gap-2">
                    <p className="text-xs text-slate-600 flex-1">
                      Enter the 6-digit code sent to {contact.phone}.
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-28 text-sm tracking-[0.3em] font-mono px-3 py-2 rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#059669]"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setPhoneVerifyError("");
                        const res = await fetch("/api/verify/phone", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ phone: contact.phone, code: phoneCode, handle })
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          const nextContact = { ...contact, phone: data.phone || contact.phone, phoneVerified: true };
                          setContact(nextContact);
                          setPhoneCodeSent(false);
                          setPhoneCode("");
                          const dossierPayload = { ...buildPortfolioPayload(), contact: nextContact };
                          persistPortfolioLocally(true, dossierPayload);
                          if (isPortfolioSaved) {
                            fetch("/api/vault", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify(dossierPayload)
                            }).catch(() => undefined);
                          }
                          setChatMessages((prev) => [...prev, { sender: "ally", text: "Phone confirmed." }]);
                          captureEvent("phone_verified", { handle: handle.toLowerCase().trim() });
                        } else {
                          setPhoneVerifyError(data.error || "That code did not match.");
                        }
                      }}
                      className="text-xs font-bold text-white bg-[#059669] hover:bg-emerald-700 px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Confirm
                    </button>
                  </div>
                )}
                {emailVerifyError && (
                  <p className="mt-2 text-xs font-bold text-red-600">{emailVerifyError}</p>
                )}
                {phoneVerifyError && (
                  <p className="mt-2 text-xs font-bold text-red-600">{phoneVerifyError}</p>
                )}
                {linkedinVerifyError && (
                  <p className="mt-2 text-xs font-bold text-red-600">{linkedinVerifyError}</p>
                )}
              </div>

              {/* Summary */}
              {summaryStatement && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#059669]" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F172A]">
                        Summary
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-[#E2E8F0] px-2 py-0.5 rounded">
                      Public
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={summaryStatement}
                    readOnly={!isPortfolioSaved}
                    onChange={(e) => setSummaryStatement(e.target.value)}
                    spellCheck={true}
                    autoCorrect="on"
                    lang="en"
                    className={`w-full text-xs text-slate-700 leading-relaxed p-3.5 rounded-xl border border-[#E2E8F0] focus:outline-none font-sans resize-y bg-[#F8FAFC] ${isPortfolioSaved ? "focus:border-[#059669]" : "cursor-pointer"}`}
                  />
                </div>
              )}

              {/* Milestones Card Stream */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                    Experience ({milestones.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addEmptyMilestone}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-[#E2E8F0] hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Add Chapter</span>
                  </button>
                </div>

                <div className="space-y-6">
                  {milestones.map((milestone) => {
                    const trustStatus = getVerificationLevel(milestone);
                    return (
                    <div
                      key={milestone.id}
                      id={milestone.id}
                      className={`bg-white border rounded-2xl p-6 shadow-xs space-y-4 transition-all antialiased ${
                        highlightedMilestoneId === milestone.id
                          ? "border-[#059669] ring-2 ring-emerald-100"
                          : "border-[#E2E8F0] hover:border-slate-300"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-[#E2E8F0]/70">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            {trustStatus.level > 0 && (
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border ${trustStatus.color}`}>
                                {trustStatus.icon} {trustStatus.label}
                              </span>
                            )}
                          </div>
                          <input
                            type="text"
                            value={milestone.company}
                            readOnly={!isPortfolioSaved}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMilestones((prev) =>
                                prev.map((m) => (m.id === milestone.id ? { ...m, company: val } : m))
                              );
                            }}
                            placeholder="Company Name (e.g. SCD Enterprises / PairedRight)"
                            spellCheck={true}
                            className={`w-full font-black text-base text-[#0F172A] focus:outline-none border-b border-transparent ${isPortfolioSaved ? "focus:border-[#059669]" : "cursor-pointer"}`}
                          />
                          <input
                            type="text"
                            value={milestone.role}
                            readOnly={!isPortfolioSaved}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMilestones((prev) =>
                                prev.map((m) => (m.id === milestone.id ? { ...m, role: val } : m))
                              );
                            }}
                            placeholder="Role Title (e.g. Founder and Head of Product)"
                            spellCheck={true}
                            className={`w-full text-xs font-semibold text-slate-600 focus:outline-none border-b border-transparent ${isPortfolioSaved ? "focus:border-[#059669]" : "cursor-pointer"}`}
                          />
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <input
                              type="text"
                              value={milestone.period}
                              readOnly={!isPortfolioSaved}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMilestones((prev) =>
                                  prev.map((m) => (m.id === milestone.id ? { ...m, period: val } : m))
                                );
                              }}
                              placeholder="e.g. May 2025 — Present"
                              className="text-[11px] font-mono font-medium text-slate-600 focus:outline-none text-right w-44 bg-transparent"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => openVerifyHub(milestone)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                              isPortfolioSaved
                                ? "text-[#059669] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                                : "text-slate-400 bg-slate-50 border border-slate-200"
                            }`}
                            title={!isPortfolioSaved ? "Save your portfolio to verify this company" : "Verify this company"}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>{trustStatus.level > 0 ? "Add proof" : "Verify company"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setMilestones((prev) => prev.filter((m) => m.id !== milestone.id))
                            }
                            className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                            title="Delete Milestone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {milestone.artifacts && milestone.artifacts.length > 0 && (
                          <div className="flex flex-wrap gap-2 pb-2">
                            {milestone.artifacts.map((art) => (
                              <div key={art.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-[10px] font-medium text-slate-600">
                                <FileBadge className="w-3 h-3 text-indigo-500" />
                                <span className="truncate max-w-[150px]">{art.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {milestone.registryLinks && milestone.registryLinks.length > 0 && (
                          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
                            {milestone.registryLinks.map((link) => (
                              <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{link.label}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {milestone.verifications && milestone.verifications.length > 0 && (
                          <div className="pt-2 pb-2 border-b border-slate-100">
                            <div className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                              <span>{corroborationHeadline(milestone.company, milestone.verifications)}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Atomic Achievement Claims ({milestone.claims.length})
                          </label>
                          <button
                            type="button"
                            onClick={() => addClaimToMilestone(milestone.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669] hover:text-emerald-700 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Line Item</span>
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {milestone.claims.map((claimText, claimIdx) => (
                            <div
                              key={claimIdx}
                              className="group flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus-within:border-[#059669] focus-within:bg-white transition-all"
                            >
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0" />
                              <textarea
                                rows={2}
                                value={claimText}
                                readOnly={!isPortfolioSaved}
                                onChange={(e) =>
                                  updateMilestoneClaim(milestone.id, claimIdx, e.target.value)
                                }
                                spellCheck={true}
                                autoCorrect="on"
                                lang="en"
                                className="flex-1 text-xs text-slate-700 leading-relaxed focus:outline-none font-sans resize-y bg-transparent"
                              />
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                <button
                                  type="button"
                                  onClick={() => deleteClaimFromMilestone(milestone.id, claimIdx)}
                                  className="text-slate-300 hover:text-red-500 p-1 cursor-pointer"
                                  title="Delete Line Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {/* Skills */}
              {skills.length > 0 && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F172A]">
                      Core Proficiencies & Technologies ({skills.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-slate-700 hover:border-slate-300 transition-colors"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => setSkills((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {education.length > 0 && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#059669]" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F172A]">
                        Education & Academic Degrees ({education.length})
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-3 pt-1">
                    {education.map((edu) => (
                      <div
                        key={edu.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
                      >
                        <div>
                          <div className="font-bold text-xs text-[#0F172A]">{edu.institution}</div>
                          <div className="text-[11px] text-slate-500">{edu.degree}</div>
                        </div>
                        {edu.year && (
                          <span className="text-xs font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                            {edu.year}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </main>
      </div>

      {isVerifyHubOpen && targetMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div>
                <h3 className="font-black text-sm text-[#0F172A]">Verify {targetMilestone.company}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{targetMilestone.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifyHubOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const live = milestones.find((m) => m.id === targetMilestone.id) || targetMilestone;
              const current = milestoneCounts(live);
              const currentStatus = getVerificationStatus(current);
              const peerNext = previewVerificationStatus(current, { peers: 1 });
              const docNext = previewVerificationStatus(current, { docs: 1 });

              return (
                <div className="space-y-3">
                  <div className="px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                    <span className="text-slate-500">Current status: </span>
                    <span className="font-bold text-[#0F172A]">{currentStatus.label}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openVerifyStep("peer")}
                    className="w-full text-left p-4 rounded-2xl border border-[#E2E8F0] hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-black text-[#0F172A]">Ask a colleague</span>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {current.peers >= 1 ? "Adds another peer" : "Becomes " + peerNext.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      They sign in with LinkedIn, add their title, and the years they overlapped you there. Their name stays private. One person shows as a title at this company; several people roll up to a count.
                      {current.peers === 0 && current.docs === 0
                        ? " One confirmation gets you to Partially Verified. A second person, or a document plus this person, reaches Company Verified."
                        : current.peers === 0
                          ? " Combined with your document, this reaches Company Verified."
                          : " Two or more confirmations reach Company Verified."}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => openVerifyStep("doc")}
                    className="w-full text-left p-4 rounded-2xl border border-[#E2E8F0] hover:border-blue-200 hover:bg-blue-50/40 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-black text-[#0F172A]">Attach a document</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                        {current.docs >= 1 ? "Adds more proof" : "Becomes " + docNext.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Offer letter, contract, or W-2. Scanned for employer and dates, then deleted.
                      {current.peers >= 1 && current.docs === 0
                        ? " With your existing peer, this reaches Company Verified."
                        : " Alone this is Partial. Pair it with one peer for Company Verified."}
                    </p>
                  </button>

                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ARTIFACT UPLOAD MODAL */}
      {isArtifactModalOpen && targetMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-sm text-[#0F172A]">Attach Proof Artifact</h3>
              </div>
              <button
                type="button"
                onClick={() => closeVerifyStep(() => setIsArtifactModalOpen(false))}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-xs">
              <span className="font-bold text-[#0F172A] block">Attaching to: {targetMilestone.company}</span>
              <span className="text-slate-500 block">{targetMilestone.period}. Upload a PDF W-2, offer letter, or contract.</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-indigo-800 leading-relaxed">
                <strong>Privacy:</strong> We read employer and dates from the PDF, then discard the file. It is never shown on your public page.
              </div>

              {artifactScanError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 leading-relaxed">
                  {artifactScanError}
                </div>
              )}

              <div className="pt-2">
                <input
                  type="file"
                  id="artifact-upload"
                  className="hidden"
                  onChange={handleArtifactUpload}
                  accept="application/pdf,.pdf"
                />
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => document.getElementById('artifact-upload')?.click()}
                  className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4 text-indigo-400" />
                      <span>Select File to Scan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PEER CORROBORATION MODAL */}
      {isInviteModalOpen && targetMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#059669]" />
                <h3 className="font-black text-sm text-[#0F172A]">Request Peer Corroboration</h3>
              </div>
              <button
                type="button"
                onClick={() => closeVerifyStep(() => setIsInviteModalOpen(false))}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-xs">
              <span className="font-bold text-[#0F172A] block">{targetMilestone.company}</span>
              <span className="text-slate-500 block">{targetMilestone.role} ({targetMilestone.period})</span>
              <p className="text-slate-500 pt-1">
                They sign in with LinkedIn and add their title plus the years they overlapped you. Their name stays private. Recruiters see a title at this company, or a count if several people confirm.
              </p>
            </div>

            <form onSubmit={dispatchPeerInvite} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Colleague or Manager Work Email</label>
                <input
                  type="email"
                  required
                  value={colleagueEmail}
                  onChange={(e) => setColleagueEmail(e.target.value)}
                  placeholder="manager@company.com"
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Relationship Context</label>
                <select
                  value={colleagueRole}
                  onChange={(e) => setColleagueRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] bg-white"
                >
                  <option>Direct Manager / Executive Sponsor</option>
                  <option>Cross-Functional Peer (Engineering / Product)</option>
                  <option>Direct Report / Senior Lead</option>
                  <option>Investor / Advisory Board</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={inviteSent}
                  className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {inviteSent ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Token</span>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIGNUP & HANDLE CLAIM MODAL */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <VerifiedCVLogo className="w-6 h-6" />
                <h3 className="font-black text-sm text-[#0F172A]">Save Portfolio to Start Editing</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!user ? (
              <div className="space-y-4 text-xs antialiased">
                <p className="text-slate-500 leading-relaxed">
                  Sign in with Google to claim your handle and save your portfolio.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: `${window.location.origin}/auth/callback?next=/studio`,
                      },
                    });
                  }}
                  className="w-full py-3 rounded-xl border border-[#E2E8F0] hover:bg-slate-50 text-[#0F172A] font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            ) : (
            <form onSubmit={handleClaimVaultCommit} className="space-y-4 text-xs antialiased">
              <p className="text-slate-500 leading-relaxed">
                After you save, you can edit any field. Later changes are saved automatically.
              </p>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  spellCheck={true}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Graham Harris"
                  className={`w-full p-2.5 rounded-xl border ${nameError ? "border-red-500" : "border-[#E2E8F0]"} focus:outline-none focus:border-[#059669]`}
                />
                {nameError && <span className="text-[10px] text-red-500 mt-1 block">{nameError}</span>}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Desired Public Handle</label>
                <div className="flex items-center">
                  <span className="bg-slate-100 border border-r-0 border-[#E2E8F0] px-2.5 py-2.5 rounded-l-xl text-slate-500 font-mono text-xs">
                    verifiedcv.app/
                  </span>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) =>
                      setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                    }
                    placeholder="gharris"
                    className="w-full p-2.5 rounded-r-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-mono font-bold text-[#059669]"
                  />
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                  {handleStatus === "checking" && <span className="text-slate-400">Checking handle availability...</span>}
                  {handleStatus === "available" && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> verifiedcv.app/{handle} is available!
                    </span>
                  )}
                  {handleStatus === "owned" && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> This browser already owns verifiedcv.app/{handle}.
                    </span>
                  )}
                  {handleStatus === "taken" && (
                    <span className="text-red-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> verifiedcv.app/{handle} is already claimed.
                    </span>
                  )}
                </div>
              </div>

              {handleStatus === "taken" && !isPortfolioSaved && (
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
                  <p className="text-slate-500 leading-relaxed">
                    If this is your page, we will email a restore code to the address already on the account. That unlocks this browser without overwriting someone else.
                  </p>
                  <button
                    type="button"
                    onClick={sendRestoreCode}
                    disabled={restoreSending || !contact.email}
                    className="w-full py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-black cursor-pointer disabled:opacity-50"
                  >
                    {restoreSending ? "Sending code..." : "Email restore code"}
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={restoreCode}
                    onChange={(e) => setRestoreCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit code"
                    className="w-full p-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-mono tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={unlockWithRestoreCode}
                    disabled={restoreUnlocking || restoreCode.length !== 6}
                    className="w-full py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-black cursor-pointer disabled:opacity-50"
                  >
                    {restoreUnlocking ? "Unlocking..." : "Unlock this page"}
                  </button>
                </div>
              )}

              {restoreNotice && (
                <p className="text-[11px] text-slate-600 leading-relaxed">{restoreNotice}</p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCommitting || (handleStatus === "taken" && !isPortfolioSaved)}
                  className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 antialiased"
                >
                  {isCommitting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Save Portfolio</span>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </>
                  )}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}