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
  Sparkle,
  FileText,
  Calendar,
  Wand2,
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
  isCorroborated: boolean;
  corroboratedBy?: string;
  artifacts?: { id: string; name: string; type: string }[];
  registryLinks?: { id: string; type: "github" | "credly" | "uspto"; url: string; label: string }[];
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
      ],
      isCorroborated: false
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
      ],
      isCorroborated: false
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
      isCorroborated: true,
      corroboratedBy: "Senior Director of Core Engineering"
    }
  ]
};

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
  const [isVaultSaved, setIsVaultSaved] = useState(false);

  // Peer Corroboration Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [isRegistryModalOpen, setIsRegistryModalOpen] = useState(false);
  const [targetMilestone, setTargetMilestone] = useState<Milestone | null>(null);
  const [colleagueEmail, setColleagueEmail] = useState("");
  const [colleagueRole, setColleagueRole] = useState("Engineering Peer / Manager");
  const [inviteSent, setInviteSent] = useState(false);

  // Registry Modal State
  const [registryType, setRegistryType] = useState<"github" | "credly" | "uspto">("github");
  const [registryUrl, setRegistryUrl] = useState("");

  // Handle Availability State
  const [handleStatus, setHandleStatus] = useState<"checking" | "available" | "taken" | "idle">("available");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");

  const getVerificationLevel = (m: Milestone) => {
    // Level 3: Cryptographic / Registry
    if (m.registryLinks && m.registryLinks.length > 0) {
      return { level: 3, label: "Cryptographically Anchored", color: "text-emerald-800 bg-emerald-50 border-emerald-200", icon: <ShieldCheck className="w-3 h-3 text-[#059669]" /> };
    }
    // Level 2: Peer Corroborated
    if (m.isCorroborated) {
      return { level: 2, label: "Peer Corroborated", color: "text-indigo-800 bg-indigo-50 border-indigo-200", icon: <Users className="w-3 h-3 text-indigo-600" /> };
    }
    // Level 1: Document Verified
    if (m.artifacts && m.artifacts.length > 0) {
      return { level: 1, label: "Document Verified", color: "text-blue-800 bg-blue-50 border-blue-200", icon: <FileCheck className="w-3 h-3 text-blue-600" /> };
    }
    // Level 0: Self-Reported
    return { level: 0, label: "Self-Reported", color: "text-slate-600 bg-slate-100 border-slate-200", icon: <AlertCircle className="w-3 h-3 text-slate-500" /> };
  };

  const actionPrompts = [
    { label: "⚡ Validate Achievements", action: "validate_recent" },
    { label: "✉️ Request Peer Corroboration", action: "request_peer" },
    { label: "📎 Attach Proof Artifact", action: "attach_artifact" },
    { label: "🔗 Link Registry (GitHub/Credly)", action: "link_registry" },
    { label: "🛡️ Lock Vault Record", action: "open_claim" }
  ];

  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ally" | "user"; text: string }>>([
    {
      sender: "ally",
      text: "Candidate Studio ready. All credentials, contact channels, and achievements are loaded for audit. Save your Vault to enable peer corroboration."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for LinkedIn OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("linkedin_import") === "success") {
      loadCanonicalRecord();
      // Clean up the URL
      window.history.replaceState({}, document.title, "/studio");
      return;
    }

    const stored = sessionStorage.getItem("vcv_pending_payload");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      sessionStorage.removeItem("vcv_pending_payload");

      if (parsed.action === "load_canonical") {
        loadCanonicalRecord();
        return;
      }

      if (parsed.milestones && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
        setMilestones(
          parsed.milestones.map((m: any) => ({
            ...m,
            claims: (Array.isArray(m.claims) ? m.claims : (m.calibratedClaim ? [m.calibratedClaim] : [])).filter(
              (c: string) => c.replace(/[^a-zA-Z]/g, "").length >= 12
            )
          }))
        );
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.headline) setHeadline(parsed.headline);
        if (parsed.summaryStatement) setSummaryStatement(parsed.summaryStatement);
        if (parsed.skills) setSkills(parsed.skills);
        if (parsed.education) setEducation(parsed.education);
        if (parsed.contact) {
          setContact((prev) => ({ ...prev, ...parsed.contact }));
        }

        setActiveTab("canvas");
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Ingested ${parsed.milestones.length} career chapters with full contact records. Ready to corroborate key achievements.`
          }
        ]);
        return;
      }

      if (parsed.rawText && parsed.rawText.trim().length > 0) {
        executeIngest(parsed.rawText);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!handle || handle.length < 2) {
      setHandleStatus("idle");
      return;
    }

    setHandleStatus("checking");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vault/check?handle=${encodeURIComponent(handle)}`);
        if (res.ok) {
          const data = await res.json();
          setHandleStatus(data.available ? "available" : "taken");
        } else {
          setHandleStatus("available");
        }
      } catch {
        setHandleStatus("available");
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [handle]);

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
        text: "Loaded Graham Harris canonical record. Contact identity, 3 verified milestones, and academic background are active."
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
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Extracted ${data.milestones.length} milestones with contact signals. Contact block & dates confirmed.`
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
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Parsed ${data.milestones.length} career chapters from ${file.name}.`
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
    if (actionType === "validate_recent") {
      if (milestones.length > 0) {
        const topM = milestones[0];
        setHighlightedMilestoneId(topM.id);
        setChatMessages((prev) => [
          ...prev,
          { sender: "user", text: `Validate recent achievements at ${topM.company}` },
          {
            sender: "ally",
            text: `Focusing on ${topM.company} (${topM.role}). Each line item represents an atomic deliverable. Click 'Corroborate' to send an attestation link to your manager.`
          }
        ]);
        const el = document.getElementById(topM.id);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else if (actionType === "request_peer") {
      if (milestones.length > 0) {
        setTargetMilestone(milestones[0]);
        setIsInviteModalOpen(true);
      }
    } else if (actionType === "attach_artifact") {
      if (milestones.length > 0) {
        setTargetMilestone(milestones[0]);
        setIsArtifactModalOpen(true);
      }
    } else if (actionType === "link_registry") {
      if (milestones.length > 0) {
        setTargetMilestone(milestones[0]);
        setIsRegistryModalOpen(true);
      }
    } else if (actionType === "open_claim") {
      setIsClaimModalOpen(true);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const query = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: query }]);
    setChatInput("");

    if (query.toLowerCase().includes("validate") || query.toLowerCase().includes("achievement")) {
      handleActionPrompt("validate_recent");
    } else if (query.toLowerCase().includes("peer") || query.toLowerCase().includes("corroborat")) {
      handleActionPrompt("request_peer");
    } else {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: "Metric bounds calibrated. Choose an action suggestion below to verify this chapter."
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

    if (handleStatus === "taken") {
      alert("This handle is already taken. Please choose another one.");
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
        body: JSON.stringify(dossierPayload)
      });

      if (res.ok) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("vcv_saved_vault", JSON.stringify(dossierPayload));
        }
        setIsVaultSaved(true);
        setIsClaimModalOpen(false);
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Vault saved! Live candidate dossier active at verifiedcv.app/${handle.toLowerCase().trim()}`
          }
        ]);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to commit record.");
      }
    } catch {
      alert("Network error committing to Vault API.");
    } finally {
      setIsCommitting(false);
    }
  };

  const handleArtifactUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !targetMilestone) return;
    const file = e.target.files[0];
    
    // Mock upload delay
    setIsProcessing(true);
    setTimeout(() => {
      setMilestones((prev) =>
        prev.map((m) => {
          if (m.id !== targetMilestone.id) return m;
          const newArtifact = {
            id: `art-${Date.now()}`,
            name: file.name,
            type: file.name.endsWith('.pdf') ? 'Document' : 'Work Product'
          };
          return {
            ...m,
            artifacts: [...(m.artifacts || []), newArtifact]
          };
        })
      );
      
      setIsProcessing(false);
      setIsArtifactModalOpen(false);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ally",
          text: `Artifact "${file.name}" attached to ${targetMilestone.company}. AI scan confirms employer match. Milestone upgraded to Document Verified (Level 1).`
        }
      ]);
    }, 1200);
  };

  const handleRegistryLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registryUrl || !targetMilestone) return;

    setIsProcessing(true);
    setTimeout(() => {
      setMilestones((prev) =>
        prev.map((m) => {
          if (m.id !== targetMilestone.id) return m;
          const newLink = {
            id: `reg-${Date.now()}`,
            type: registryType,
            url: registryUrl,
            label: registryType === "github" ? "GitHub Commits" : registryType === "credly" ? "Credly Badge" : "USPTO Patent"
          };
          return {
            ...m,
            registryLinks: [...(m.registryLinks || []), newLink]
          };
        })
      );
      
      setIsProcessing(false);
      setIsRegistryModalOpen(false);
      setRegistryUrl("");
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ally",
          text: `Registry link verified via ${registryType.toUpperCase()} API. Milestone upgraded to Cryptographically Anchored (Level 3).`
        }
      ]);
    }, 1000);
  };

  const dispatchPeerInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colleagueEmail) return;

    setInviteSent(true);
    setTimeout(() => {
      if (targetMilestone) {
        setMilestones((prev) =>
          prev.map((m) =>
            m.id === targetMilestone.id
              ? { ...m, isCorroborated: true, corroboratedBy: `${colleagueRole} (${colleagueEmail})` }
              : m
          )
        );
      }
      setIsInviteModalOpen(false);
      setInviteSent(false);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ally",
          text: `Corroboration invitation dispatched to ${colleagueEmail}. Marked milestone as peer-certified.`
        }
      ]);
    }, 600);
  };

  const addEmptyMilestone = () => {
    const newM: Milestone = {
      id: `m-custom-${Date.now()}`,
      company: "Company or Initiative",
      role: "Product & Technical Leader",
      period: "Jan 2026 — Present",
      location: "Remote",
      claims: ["Direct product strategy, platform execution, and quantifiable business outcomes..."],
      isCorroborated: false
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

  const formatCleanClaim = (milestoneId: string, claimIndex: number) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== milestoneId) return m;
        const target = m.claims[claimIndex] || "";
        const formatted = target
          .replace(/\s{2,}/g, " ")
          .trim()
          .replace(/^[a-z]/, (char) => char.toUpperCase());
        const updatedClaims = [...m.claims];
        updatedClaims[claimIndex] = formatted.endsWith(".") ? formatted : formatted + ".";
        return { ...m, claims: updatedClaims };
      })
    );
  };

  const corroboratedCount = milestones.filter((m) => m.isCorroborated).length;
  const verifiedSignalsCount =
    (contact.emailVerified ? 1 : 0) +
    (contact.linkedinVerified ? 1 : 0) +
    (contact.phoneVerified ? 1 : 0) +
    corroboratedCount;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col antialiased selection:bg-emerald-100">
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] h-14 px-6 flex items-center justify-between">
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
          <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer" title="Unlock multiple profile views and portfolio asset storage">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upgrade to Pro</span>
          </button>
          
          {(milestones.length > 0 || summaryStatement) && !isVaultSaved && (
            <button
              type="button"
              onClick={() => {
                setMilestones([]);
                setSummaryStatement("");
                setSkills([]);
                setEducation([]);
                setActiveTab("canvas");
              }}
              className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Canvas</span>
            </button>
          )}

          {isVaultSaved ? (
            <Link
              href={`/${handle.toLowerCase().trim()}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <span>View Live Dossier</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          ) : (
            (milestones.length > 0 || summaryStatement) && (
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Save Vault & Claim Handle</span>
              </button>
            )
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* CV ALLY COPILOT */}
        <aside className="w-[320px] shrink-0 border-r border-[#E2E8F0] bg-white flex flex-col justify-between h-[calc(100vh-3.5rem)]">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-2.5 bg-[#F8FAFC]">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669]">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-[#0F172A]">CV Ally Copilot</h3>
              <span className="text-[10px] text-slate-500 font-medium">Socratic Verification Pilot</span>
            </div>
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
                placeholder="Ask Ally to corroborate or audit..."
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
        <main className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto space-y-8 antialiased">
          {milestones.length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-[#0F172A] tracking-tight">Trust Spectrum:</span>
                <span className="text-xs font-bold text-[#059669] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {verifiedSignalsCount} Signals Confirmed
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                <span
                  onClick={() => setContact((c) => ({ ...c, emailVerified: !c.emailVerified }))}
                  className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                    contact.emailVerified
                      ? "bg-emerald-50 border-emerald-200 text-[#059669]"
                      : "bg-slate-50 border-[#E2E8F0] text-slate-500 hover:border-slate-300"
                  }`}
                  title="Click to toggle email domain verification"
                >
                  <Mail className="w-3 h-3" />
                  <span>{contact.emailVerified ? "Domain Verified" : "Verify Email"}</span>
                </span>

                <span
                  onClick={() => setContact((c) => ({ ...c, linkedinVerified: !c.linkedinVerified }))}
                  className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                    contact.linkedinVerified
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-slate-50 border-[#E2E8F0] text-slate-500 hover:border-slate-300"
                  }`}
                  title="Click to toggle LinkedIn profile certification"
                >
                  <LinkedInIcon className="w-3 h-3" />
                  <span>{contact.linkedinVerified ? "LinkedIn Certified" : "Link Profile"}</span>
                </span>

                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[#059669] flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{corroboratedCount} Peer Vouchers</span>
                </span>
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
                  Upload your resume or paste below. Dates, starting months, company titles, and credentials are parsed losslessly with active spell-checking.
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
            <div className="space-y-8">
              {/* Candidate Identity & Contact Verification Strip */}
              <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Candidate Legal Name"
                      spellCheck={true}
                      className="text-xl sm:text-2xl font-black text-[#0F172A] focus:outline-none border-b border-transparent focus:border-[#059669]"
                    />
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Professional Headline"
                      spellCheck={true}
                      className="w-full text-xs sm:text-sm font-semibold text-slate-600 focus:outline-none border-b border-transparent focus:border-[#059669]"
                    />
                  </div>

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] text-xs font-bold self-start sm:self-auto">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Vault Ground Truth</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="email"
                      value={contact.email}
                      onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      placeholder="Work Email"
                      className="w-full text-xs bg-transparent focus:outline-none font-medium"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={contact.phone}
                      onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      placeholder="Phone"
                      className="w-full text-xs bg-transparent focus:outline-none font-medium"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2">
                    <LinkedInIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <input
                      type="text"
                      value={contact.linkedin}
                      onChange={(e) => setContact({ ...contact, linkedin: e.target.value })}
                      placeholder="LinkedIn URL"
                      className="w-full text-xs bg-transparent focus:outline-none font-medium text-blue-700"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={contact.location}
                      onChange={(e) => setContact({ ...contact, location: e.target.value })}
                      placeholder="Location / Remote"
                      className="w-full text-xs bg-transparent focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              {summaryStatement && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#059669]" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F172A]">
                        Professional Executive Summary
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Audited Summary
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={summaryStatement}
                    onChange={(e) => setSummaryStatement(e.target.value)}
                    spellCheck={true}
                    autoCorrect="on"
                    lang="en"
                    className="w-full text-xs text-slate-700 leading-relaxed p-3.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-sans resize-y bg-[#F8FAFC]"
                  />
                </div>
              )}

              {/* Milestones Card Stream */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                    Audited Career Milestones ({milestones.length})
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
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 border ${trustStatus.color}`}>
                              {trustStatus.icon} {trustStatus.label}
                            </span>
                          </div>
                          <input
                            type="text"
                            value={milestone.company}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMilestones((prev) =>
                                prev.map((m) => (m.id === milestone.id ? { ...m, company: val } : m))
                              );
                            }}
                            placeholder="Company Name (e.g. SCD Enterprises / PairedRight)"
                            spellCheck={true}
                            className="w-full font-black text-base text-[#0F172A] focus:outline-none border-b border-transparent focus:border-[#059669]"
                          />
                          <input
                            type="text"
                            value={milestone.role}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMilestones((prev) =>
                                prev.map((m) => (m.id === milestone.id ? { ...m, role: val } : m))
                              );
                            }}
                            placeholder="Role Title (e.g. Founder and Head of Product)"
                            spellCheck={true}
                            className="w-full text-xs font-semibold text-slate-600 focus:outline-none border-b border-transparent focus:border-[#059669]"
                          />
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <input
                              type="text"
                              value={milestone.period}
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

                          {milestone.isCorroborated ? (
                            <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="w-3 h-3 text-indigo-600" /> Corroborated
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={!isVaultSaved}
                              onClick={() => {
                                setTargetMilestone(milestone);
                                setIsInviteModalOpen(true);
                              }}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                                isVaultSaved
                                  ? "text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 cursor-pointer"
                                  : "text-slate-400 bg-slate-50 border border-slate-200 cursor-not-allowed"
                              }`}
                              title={!isVaultSaved ? "Save your Vault to request corroboration" : "Request Peer Corroboration"}
                            >
                              <Users className="w-3 h-3" />
                              <span>Corroborate</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setTargetMilestone(milestone);
                              setIsArtifactModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Attach W-2, Offer Letter, or Work Product"
                          >
                            <Paperclip className="w-3 h-3" />
                            <span>Attach Proof</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setTargetMilestone(milestone);
                              setIsRegistryModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Link GitHub, USPTO, or Credly"
                          >
                            <Link2 className="w-3 h-3" />
                            <span>Link Registry</span>
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
                                  onClick={() => formatCleanClaim(milestone.id, claimIdx)}
                                  className="text-slate-400 hover:text-[#059669] p-1 cursor-pointer"
                                  title="Format Sentence"
                                >
                                  <Wand2 className="w-3.5 h-3.5" />
                                </button>
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
                  ))}
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
        </main>
      </div>

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
                onClick={() => setIsArtifactModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-xs">
              <span className="font-bold text-[#0F172A] block">Attaching to: {targetMilestone.company}</span>
              <span className="text-slate-500 block">Upload a W-2, Offer Letter, or Work Product.</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 text-indigo-800 leading-relaxed">
                <strong>Privacy Note:</strong> Tax documents and offer letters are scanned by our AI to verify employer and dates, then <strong>instantly deleted</strong>. They are never shown to recruiters.
              </div>

              <div className="pt-2">
                <input
                  type="file"
                  id="artifact-upload"
                  className="hidden"
                  onChange={handleArtifactUpload}
                  accept=".pdf,.png,.jpg,.jpeg"
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
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-xs">
              <span className="font-bold text-[#0F172A] block">{targetMilestone.company}</span>
              <span className="text-slate-500 block">{targetMilestone.role} ({targetMilestone.period})</span>
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

      {/* REGISTRY LINK MODAL */}
      {isRegistryModalOpen && targetMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#059669]" />
                <h3 className="font-black text-sm text-[#0F172A]">Link Public Registry</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegistryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-xs">
              <span className="font-bold text-[#0F172A] block">Anchoring to: {targetMilestone.company}</span>
              <span className="text-slate-500 block">Provide a public URL to cryptographically anchor this chapter.</span>
            </div>

            <form onSubmit={handleRegistryLink} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Registry Type</label>
                <select
                  value={registryType}
                  onChange={(e) => setRegistryType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] bg-white"
                >
                  <option value="github">GitHub Repository / Commits</option>
                  <option value="credly">Credly / Certification Badge</option>
                  <option value="uspto">USPTO Patent Database</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Public URL</label>
                <input
                  type="url"
                  required
                  value={registryUrl}
                  onChange={(e) => setRegistryUrl(e.target.value)}
                  placeholder="https://"
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Verify & Anchor Link</span>
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
                <h3 className="font-black text-sm text-[#0F172A]">Claim Your Dossier Handle</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleClaimVaultCommit} className="space-y-4 text-xs antialiased">
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
                <label className="font-bold text-slate-700 block mb-1">Corporate / Work Email</label>
                <input
                  type="email"
                  required
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  placeholder="name@company.com"
                  className={`w-full p-2.5 rounded-xl border ${emailError ? "border-red-500" : "border-[#E2E8F0]"} focus:outline-none focus:border-[#059669]`}
                />
                {emailError && <span className="text-[10px] text-red-500 mt-1 block">{emailError}</span>}
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
                  {handleStatus === "taken" && (
                    <span className="text-red-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> verifiedcv.app/{handle} is already claimed.
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCommitting || handleStatus === "taken"}
                  className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 antialiased"
                >
                  {isCommitting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Commit to Vault & Launch Dossier</span>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}