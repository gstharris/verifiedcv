"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ChevronDown,
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
import { getVerificationStatus, publicChapterLabel } from "@/lib/verificationLevel";
import { corroborationHeadline } from "@/lib/corroborationDisplay";
import { companyVerificationTooltip, endorsedClaimIndexes, firstChapterWithoutColleague, postSavePrompt } from "@/lib/verificationSignals";
import { corporateEmailMatchesCompany } from "@/lib/corporateEmail";
import { nextPortfolioVerificationStep, verificationStatusLine } from "@/lib/verificationQueue";
import { dossierSectionRank, encodeDossierLayout, parseDossierLayout, publicRegistryLabel, type PortfolioAsset } from "@/lib/portfolioAssets";
import { LOOP_EVENTS, consumeCorroboratorRef } from "@/lib/corroborationLoop";
import { linkedInHandle, linkedInProfileUrl, preferLinkedInProfile } from "@/lib/linkedin";
import { flagEmoji, parseLocation } from "@/lib/locations";
import { resolvePlace, suggestPlaces } from "@/lib/places";
import { hydrateChapter, packChapter } from "@/lib/chapterMeta";
import { faviconUrl, publicHttpsUrl, siteLabel } from "@/lib/companySite";
import { sortChaptersByTenure } from "@/lib/tenureOverlap";
import { reviewResume } from "@/lib/resumeReview";
import PortfolioStudioPanel from "@/components/PortfolioStudioPanel";
import { captureEvent, identifyHandle } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

function linkedInFields(
  profile: { name?: string; vanityName?: string; profileUrl?: string },
  existing?: string
) {
  const fromProfile = profile.profileUrl || (profile.vanityName ? linkedInProfileUrl(profile.vanityName) : "") || "";
  return {
    linkedin: preferLinkedInProfile(existing || "", fromProfile),
    linkedinVerified: true as const
  };
}

function incomingChapters(milestones: unknown) {
  if (!Array.isArray(milestones)) return [];
  return sortChaptersByTenure(milestones.map((milestone) => hydrateChapter(milestone)));
}

function AutoText({
  value,
  readOnly,
  onChange,
  className
}: {
  value: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
  className?: string;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
      spellCheck
      autoCorrect="on"
      lang="en"
      className={`resize-none overflow-hidden ${className || ""}`}
    />
  );
}

function LocationField({
  value,
  saved,
  onChange
}: {
  value: string;
  saved: boolean;
  onChange: (location: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [remote, setRemote] = useState<ReturnType<typeof suggestPlaces>>([]);
  const suggestionsRef = React.useRef<ReturnType<typeof suggestPlaces>>([]);
  useEffect(() => {
    setDraft(parseLocation(value)?.label || value);
  }, [value]);
  useEffect(() => {
    const query = draft.trim();
    if (!open || query.length < 2) {
      setRemote([]);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json();
        if (Array.isArray(data.places)) setRemote(data.places);
      } catch {
        // Local matches still show while the city search is unavailable.
      }
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [draft, open]);
  const resolved = resolvePlace(draft);
  const local = open ? suggestPlaces(draft) : [];
  const seen = new Set<string>();
  const suggestions = [...local, ...remote].filter((place) => {
    const key = place.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
  suggestionsRef.current = suggestions;
  const notice = touched && draft.trim() && !resolved && suggestions.length === 0 ? "Choose a city from the list." : "";
  return (
    <div className="relative p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
      <div className="flex items-center gap-2">
        <span className="text-sm leading-none shrink-0">
          {resolved?.countryCode ? flagEmoji(resolved.countryCode) : <MapPin className="w-3.5 h-3.5 text-slate-400" />}
        </span>
        <input
          type="text"
          value={draft}
          readOnly={!saved}
          onChange={(e) => {
            setDraft(e.target.value);
            setOpen(true);
            setTouched(false);
          }}
          onFocus={() => saved && setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setOpen(false);
              const listed = suggestionsRef.current;
              const place = resolvePlace(draft) || (listed.length === 1 ? listed[0] : null);
              if (place) {
                onChange(place.label);
                setDraft(place.label);
                setTouched(false);
              } else {
                setTouched(true);
              }
            }, 150);
          }}
          placeholder="City"
          className="w-full text-xs bg-transparent focus:outline-none font-medium"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-[#E2E8F0] bg-white shadow-lg">
          {suggestions.map((place) => (
            <button
              key={`${place.label}-${place.detail}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(place.label);
                setDraft(place.label);
                setOpen(false);
                setTouched(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[#F8FAFC] cursor-pointer"
            >
              <span className="text-sm leading-none">{place.countryCode ? flagEmoji(place.countryCode) : "🌐"}</span>
              <span className="min-w-0">
                <span className="block font-semibold text-[#0F172A]">{place.label}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {notice && <p className="text-[11px] font-semibold text-amber-700 mt-1">{notice}</p>}
    </div>
  );
}

function CompanySitePrompt({
  company,
  companyUrl,
  saved,
  onChange
}: {
  company: string;
  companyUrl?: string;
  saved: boolean;
  onChange: (url: string) => void;
}) {
  const [suggestion, setSuggestion] = useState("");
  const [custom, setCustom] = useState("");
  const [looking, setLooking] = useState(false);
  const [dismissed, setDismissed] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    const name = company.trim();
    if (!saved || companyUrl || name.length < 2 || /^company or initiative$/i.test(name)) {
      setSuggestion("");
      setLooking(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLooking(true);
      try {
        const res = await fetch(`/api/company/lookup?name=${encodeURIComponent(name)}`);
        const data = await res.json();
        setSuggestion(String(data.sites?.[0] || ""));
      } catch {
        setSuggestion("");
      } finally {
        setLooking(false);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [company, companyUrl, saved]);

  if (companyUrl) {
    return (
      <div className="flex items-center gap-2 text-[11px]">
        <img src={faviconUrl(companyUrl)} alt="" className="w-3.5 h-3.5 rounded-sm" />
        <a href={companyUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#059669]">
          {siteLabel(companyUrl)}
        </a>
        <button type="button" onClick={() => onChange("")} className="font-bold text-slate-400 hover:text-[#0F172A] cursor-pointer">
          Remove
        </button>
      </div>
    );
  }

  const pending = suggestion && suggestion !== dismissed ? suggestion : "";
  return (
    <div className="space-y-1.5">
      {looking && <p className="text-[11px] text-slate-400">Looking up a site for {company.trim()}…</p>}
      {pending && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <img src={faviconUrl(pending)} alt="" className="w-3.5 h-3.5 rounded-sm" />
          <span className="text-slate-600">Is {siteLabel(pending)} the right site?</span>
          <button type="button" onClick={() => onChange(pending)} className="font-bold text-[#059669] cursor-pointer">
            Yes
          </button>
          <button
            type="button"
            onClick={() => {
              setDismissed(pending);
              setShowCustom(true);
            }}
            className="font-bold text-slate-400 cursor-pointer"
          >
            No
          </button>
        </div>
      )}
      {!pending && !looking && saved && (
        <button type="button" onClick={() => setShowCustom(true)} className="text-[11px] font-bold text-slate-500 cursor-pointer">
          Add company site
        </button>
      )}
      {showCustom && (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const url = publicHttpsUrl(custom);
            if (url) onChange(url);
          }}
        >
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="pairedright.com"
            className="flex-1 text-[11px] px-2 py-1 rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#059669]"
          />
          <button type="submit" className="text-[11px] font-bold text-[#059669] cursor-pointer">
            Use
          </button>
        </form>
      )}
    </div>
  );
}

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
  companyUrl?: string;
  highlightIndexes?: number[];
  artifacts?: { id: string; name: string; type: string }[];
  registryLinks?: { id: string; type: "github" | "credly" | "uspto"; url: string; label: string }[];
  verifications?: { id: string; name: string; role: string; email: string; verifiedAt: string; linkedInUrl?: string }[];
  endorsedClaimIds?: string[];
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
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [summaryStatement, setSummaryStatement] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [education, setEducation] = useState<EducationRecord[]>([]);
  const [portfolioAssets, setPortfolioAssets] = useState<PortfolioAsset[]>([]);
  const [preferredLayout, setPreferredLayout] = useState("summary:bottom");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [summaryEditor, setSummaryEditor] = useState(false);
  const [sampleWorkOpen, setSampleWorkOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!addMenuOpen) return;
    const close = (event: MouseEvent) => {
      if (!addMenuRef.current?.contains(event.target as Node)) setAddMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [addMenuOpen]);
  const [skillDraft, setSkillDraft] = useState("");

  const [contact, setContact] = useState<ContactInfo>({
    email: "",
    phone: "",
    location: "",
    linkedin: "",
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
  const [fullName, setFullName] = useState("");
  const [handle, setHandle] = useState("");
  const [headline, setHeadline] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPortfolioSaved, setIsPortfolioSaved] = useState(false);
  const [portfolioStarted, setPortfolioStarted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [vaultChecked, setVaultChecked] = useState(false);
  const [signInOnly, setSignInOnly] = useState(false);
  const [allyOpen, setAllyOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceBusy, setReplaceBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isReplayingProof, setIsReplayingProof] = useState(false);
  const skipNextAutosaveRef = useRef(true);
  const loggingOutRef = useRef(false);

  // Peer Corroboration Modal State
  const [isVerifyHubOpen, setIsVerifyHubOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [isCorpEmailModalOpen, setIsCorpEmailModalOpen] = useState(false);
  const [artifactScanError, setArtifactScanError] = useState<string | null>(null);
  const returnToVerifyHubRef = useRef(false);
  const [targetMilestone, setTargetMilestone] = useState<Milestone | null>(null);
  
  // Corp Email State
  const [corpEmail, setCorpEmail] = useState("");
  const [corpEmailCode, setCorpEmailCode] = useState("");
  const [corpEmailSent, setCorpEmailSent] = useState(false);
  const [corpEmailError, setCorpEmailError] = useState("");
  const [corpEmailSending, setCorpEmailSending] = useState(false);
  const [corpEmailDirectory, setCorpEmailDirectory] = useState("");
  const [colleagueEmail, setColleagueEmail] = useState("");
  const [colleagueRole, setColleagueRole] = useState("Engineering Peer / Manager");
  const [askForAchievements, setAskForAchievements] = useState(true);
  const [inviteSent, setInviteSent] = useState(false);
  const [waitingForPeer, setWaitingForPeer] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerifyError, setEmailVerifyError] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [phoneVerifyError, setPhoneVerifyError] = useState("");
  const [linkedinVerifyError, setLinkedinVerifyError] = useState("");
  const [editingVerifiedField, setEditingVerifiedField] = useState<null | "email" | "phone" | "linkedin">(null);

  // Handle Availability State
  const [handleStatus, setHandleStatus] = useState<"checking" | "available" | "owned" | "taken" | "idle">("available");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [restoreCode, setRestoreCode] = useState("");
  const [restoreSending, setRestoreSending] = useState(false);
  const [restoreUnlocking, setRestoreUnlocking] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState("");

  // Magic Link State
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkError, setMagicLinkError] = useState("");
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicLinkEmail.trim()) return;
    setMagicLinkLoading(true);
    setMagicLinkError("");
    
    const { error } = await supabase.auth.signInWithOtp({
      email: magicLinkEmail.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/studio`,
      },
    });

    if (error) {
      setMagicLinkError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setMagicLinkLoading(false);
  };

  const milestoneCounts = (m: Milestone) => ({
    peers: m.verifications?.length || 0,
    docs: m.artifacts?.length || 0,
    registry: Boolean(m.registryLinks && m.registryLinks.length > 0)
  });

  const getVerificationLevel = (m: Milestone) => {
    const status = getVerificationStatus(milestoneCounts(m));
    if (status.level >= 2) {
      return { ...status, color: "text-emerald-800 bg-emerald-50 border-emerald-200", icon: <ShieldCheck className="w-3 h-3 text-[#059669]" /> };
    }
    if (status.level === 1) {
      return { ...status, color: "text-emerald-800 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="w-3 h-3 text-[#059669]" /> };
    }
    return { ...status, color: "text-slate-600 bg-slate-100 border-slate-200", icon: <AlertCircle className="w-3 h-3 text-slate-500" /> };
  };

  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const authTimer = window.setTimeout(() => setAuthChecked(true), 4000);
    supabase.auth.getUser().then(({ data: { user } }) => {
      setHasSession(Boolean(user));
      setAuthChecked(true);
      if (user) {
        setUser(user);
        setContact(prev => {
          const nextContact = { 
            ...prev, 
            email: user.email || prev.email 
          };
          
          if (user.app_metadata?.providers?.includes("linkedin_oidc")) {
            Object.assign(nextContact, linkedInFields({
              name: user.user_metadata?.full_name || user.user_metadata?.name,
              vanityName: user.user_metadata?.preferred_username,
              profileUrl: user.user_metadata?.url
            }, prev.linkedin));
            
            if (!prev.linkedinVerified && isPortfolioSaved) {
              const savedRec = readStudioRecord<any>(STUDIO_SAVED_KEY);
              const draftRec = readStudioRecord<any>(STUDIO_DRAFT_KEY);
              const base = savedRec && hasPortfolioContent(savedRec) ? savedRec : draftRec;
              if (base && hasPortfolioContent(base)) {
                const synced = {
                  ...base,
                  contact: { ...base.contact, ...nextContact },
                  linkedinSub: user.user_metadata?.sub || user.id,
                  linkedin: base.linkedin || base.contact?.linkedin || user.user_metadata?.email || ""
                };
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
          }
          return nextContact;
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setUser(user || null);
      setHasSession(Boolean(user));
      setAuthChecked(true);
      if (user) {
        setContact(prev => {
          const nextContact = { 
            ...prev, 
            email: user.email || prev.email 
          };
          if (user.app_metadata?.providers?.includes("linkedin_oidc")) {
            Object.assign(nextContact, linkedInFields({
              name: user.user_metadata?.full_name || user.user_metadata?.name,
              vanityName: user.user_metadata?.preferred_username,
              profileUrl: user.user_metadata?.url
            }, prev.linkedin));
          }
          return nextContact;
        });
      }
    });

    return () => {
      window.clearTimeout(authTimer);
      subscription.unsubscribe();
    };
  }, [supabase.auth, isPortfolioSaved]);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ally" | "user"; text: string }>>([
    {
      sender: "ally",
      text: "Your portfolio is open. I'll point you at the next step."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nextVerifyStep = nextPortfolioVerificationStep({
    emailVerified: contact.emailVerified,
    linkedinVerified: contact.linkedinVerified,
    phoneVerified: contact.phoneVerified,
    chapters: milestones.map((milestone) => ({
      id: milestone.id,
      company: milestone.company,
      level: getVerificationLevel(milestone).level
    }))
  });
  const verificationStarted =
    contact.emailVerified ||
    contact.linkedinVerified ||
    contact.phoneVerified ||
    milestones.some((milestone) => getVerificationLevel(milestone).level > 0);

  const actionPrompts = React.useMemo(() => {
    if (!isPortfolioSaved) {
      if (!hasPortfolioContent({ milestones, summaryStatement, highlights, portfolioAssets })) {
        return [{ label: "Upload a resume", action: "upload_resume" }];
      }
      return [{ label: "Save and publish", action: "save_portfolio" }];
    }
    const label = nextVerifyStep.id === "done" ? "Ask a colleague" : nextVerifyStep.title;
    return [{ label, action: "continue_verification" }];
  }, [isPortfolioSaved, milestones, nextVerifyStep, summaryStatement]);

  const buildPortfolioPayload = () => ({
    handle: handle.toLowerCase().trim(),
    email: contact.email,
    fullName,
    headline,
    summaryStatement,
    contact,
    skills,
    education,
    preferredLayout,
    highlights,
    portfolioAssets,
    milestones: sortChaptersByTenure(milestones).map((milestone) => packChapter(milestone))
  });

  const persistPortfolioLocally = (saved: boolean, payload = buildPortfolioPayload()) => {
    if (loggingOutRef.current) return;
    writeStudioRecord(STUDIO_DRAFT_KEY, payload);
    if (saved) {
      writeStudioRecord(STUDIO_SAVED_KEY, payload);
    }
  };


  const applyPortfolioRecord = (parsed: any) => {
    if (!parsed) return;
    if (Array.isArray(parsed.milestones)) setMilestones(incomingChapters(parsed.milestones));
    if (parsed.fullName) setFullName(parsed.fullName);
    if (parsed.headline) setHeadline(parsed.headline);
    if (Object.prototype.hasOwnProperty.call(parsed, "summaryStatement")) {
      setSummaryStatement(String(parsed.summaryStatement || ""));
    }
    if (parsed.skills) setSkills(parsed.skills);
    if (parsed.education) setEducation(parsed.education);
    if (Array.isArray(parsed.portfolioAssets)) setPortfolioAssets(parsed.portfolioAssets);
    if (parsed.preferredLayout) setPreferredLayout(parseDossierLayout(parsed.preferredLayout).id);
    if (Array.isArray(parsed.highlights)) setHighlights(parsed.highlights.map((line: unknown) => String(line || "")));
    if (parsed.contact) {
      setContact((prev) => ({
        ...prev,
        ...parsed.contact,
        linkedin: preferLinkedInProfile(prev.linkedin, parsed.contact.linkedin || "") || parsed.contact.linkedin || prev.linkedin,
        emailVerified: parsed.contact.emailVerified ?? prev.emailVerified,
        phoneVerified: parsed.contact.phoneVerified ?? prev.phoneVerified,
        linkedinVerified: parsed.contact.linkedinVerified ?? prev.linkedinVerified
      }));
    }
    if (parsed.handle) setHandle(String(parsed.handle).toLowerCase().trim());
    setActiveTab("canvas");
    setPortfolioStarted(true);
  };

  useEffect(() => {
    if (!user) return;
    const vaultTimer = window.setTimeout(() => setVaultChecked(true), 8000);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/vault?mine=1", { credentials: "include" });
        if (!res.ok || cancelled) {
          if (!cancelled) setVaultChecked(true);
          return;
        }
        const data = await res.json();
        if (!data?.handle || cancelled) {
          if (!cancelled) setVaultChecked(true);
          return;
        }
        skipNextAutosaveRef.current = true;
        applyPortfolioRecord(data);
        setIsPortfolioSaved(true);
        writeStudioRecord(STUDIO_SAVED_KEY, data);
        writeStudioRecord(STUDIO_DRAFT_KEY, data);
        if (!cancelled) setVaultChecked(true);
      } catch {
        if (!cancelled) setVaultChecked(true);
      }
    })();
    return () => {
      cancelled = true;
      window.clearTimeout(vaultTimer);
    };
  }, [user]);

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

  const openVerifyStep = (step: "peer" | "doc" | "corp") => {
    returnToVerifyHubRef.current = true;
    setIsVerifyHubOpen(false);
    if (step === "peer") setIsInviteModalOpen(true);
    if (step === "doc") {
      setArtifactScanError(null);
      setIsArtifactModalOpen(true);
    }
    if (step === "corp") {
      setCorpEmail("");
      setCorpEmailCode("");
      setCorpEmailSent(false);
      setCorpEmailError("");
      setCorpEmailDirectory("");
      setIsCorpEmailModalOpen(true);
    }
  };

  const closeVerifyStep = (close: () => void) => {
    close();
    if (returnToVerifyHubRef.current) {
      returnToVerifyHubRef.current = false;
      setIsVerifyHubOpen(true);
    }
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
        setMilestones(incomingChapters(data.milestones));
        if (data.fullName) setFullName(data.fullName);
        if (data.headline) setHeadline(data.headline);
        if (data.summaryStatement) setSummaryStatement(data.summaryStatement);
        if (Array.isArray(data.highlights)) setHighlights(data.highlights);
        if (data.skills) setSkills(data.skills);
        if (data.education) setEducation(data.education);
        if (data.contact) {
          setContact((prev) => ({
            ...prev,
            ...data.contact,
            email: data.contact.email || prev.email,
            phone: data.contact.phone || prev.phone,
            location: prev.location || data.contact.location,
            linkedin: preferLinkedInProfile(prev.linkedin, data.contact.linkedin || ""),
            emailVerified: prev.emailVerified || Boolean(data.contact.emailVerified),
            phoneVerified: prev.phoneVerified || Boolean(data.contact.phoneVerified),
            linkedinVerified: prev.linkedinVerified || Boolean(data.contact.linkedinVerified)
          }));
        }

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
    if (urlParams.get("signin") === "1") {
      setSignInOnly(true);
      setIsClaimModalOpen(true);
    }
    if (urlParams.get("fresh") === "1") {
      clearStudioPortfolioStorage();
      localStorage.removeItem("vcv_pending_payload");
      window.history.replaceState({}, document.title, "/studio");
    }
    const linkedInAuth = urlParams.get("linkedin_auth");
    const linkedInReason = urlParams.get("linkedin_reason");
    const authError = urlParams.get("error");
    
    // Check if we just returned from an auth callback
    const justAuthenticated = urlParams.get("auth_success") === "true";
    
    // Check if Supabase returned an error in the hash (e.g. from LinkedIn login)
    const hash = window.location.hash;
    const hasHashError = hash.includes("error=");
    const hasHashToken = hash.includes("access_token=");
    
    if (authError || hasHashError) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ally",
          text: "Authentication failed. Please try again or use a different login method."
        }
      ]);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (hasHashToken) {
      // Supabase Implicit Grant Flow
      
      // 1. First, extract the token from the hash manually just in case the client misses it
      const hashParams = new URLSearchParams(hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      
      setTimeout(async () => {
        // 2. Force the session if we have the tokens using the component's supabase client
        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        
        if (user && user.app_metadata?.providers?.includes("linkedin_oidc")) {
          setContact((prev) => {
            const nextContact = {
              ...prev,
              ...linkedInFields({
                name: user.user_metadata?.full_name || user.user_metadata?.name,
                vanityName: user.user_metadata?.preferred_username,
                profileUrl: user.user_metadata?.url
              }, prev.linkedin)
            };
            const base = saved && hasPortfolioContent(saved) ? saved : draft;
            if (base && hasPortfolioContent(base)) {
              const synced = {
                ...base,
                contact: { ...base.contact, ...nextContact },
                linkedinSub: user.user_metadata?.sub || user.id
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
          
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "ally",
              text: `LinkedIn identity confirmed${user.user_metadata?.full_name ? ` for ${user.user_metadata.full_name}` : ""}. We will not post to your profile.`
            }
          ]);
          captureEvent("linkedin_verified");
        }
        
        // 3. Only clear the URL after we've completely finished processing
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 100);
    }
    
    const saved = readStudioRecord<any>(STUDIO_SAVED_KEY);
    const draft = readStudioRecord<any>(STUDIO_DRAFT_KEY);
    const pendingRaw = localStorage.getItem("vcv_pending_payload");

    if (saved && hasPortfolioContent(saved)) {
      skipNextAutosaveRef.current = true;
      applyPortfolioRecord(saved);
      setIsPortfolioSaved(true);
      setSaveStatus("saved");
      setChatMessages([
        {
          sender: "ally",
          text: "Your page is saved. I'll point you at the next step."
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
      if (justAuthenticated) {
        // Wait for state to settle before automatically trying to save
        setTimeout(() => {
          setIsClaimModalOpen(true);
          // We could auto-submit here, but it's safer to let the user click save again
          // in case they need to change their handle.
        }, 100);
      }
    } else if (pendingRaw) {
      try {
        const parsed = JSON.parse(pendingRaw);
        localStorage.removeItem("vcv_pending_payload");

        if (parsed.milestones && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
          applyPortfolioRecord(parsed);
          setChatMessages([
            {
              sender: "ally",
              text: "Upload successful. Please review your resume below and edit as necessary. Once it looks good, save your portfolio to begin verification."
            }
          ]);
          if (justAuthenticated) {
            setTimeout(() => setIsClaimModalOpen(true), 100);
          }
        } else if (parsed.rawText && parsed.rawText.trim().length > 0) {
          executeIngest(parsed.rawText);
        }
      } catch {
        // ignore
      }
    }

    if (justAuthenticated) {
      window.history.replaceState({}, document.title, "/studio");
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
              ...linkedInFields(data.profile, prev.linkedin)
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

    if (!hasHashToken) {
      applyLinkedInSession();
    }
  }, []);

  const resumeCueRef = useRef(false);
  useEffect(() => {
    if (!isPortfolioSaved || resumeCueRef.current) return;
    if (!hasPortfolioContent({ milestones, summaryStatement, highlights, portfolioAssets })) return;
    resumeCueRef.current = true;
    setChatMessages([
      {
        sender: "ally",
        text: `${nextVerifyStep.title}. ${nextVerifyStep.detail}`
      }
    ]);
  }, [highlights, isPortfolioSaved, milestones, nextVerifyStep.detail, nextVerifyStep.title, portfolioAssets, summaryStatement]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (loggingOutRef.current) return;
    const payload = {
      handle: handle.toLowerCase().trim(),
      email: contact.email,
      fullName,
      headline,
      summaryStatement,
      contact,
      skills,
      education,
      preferredLayout,
      highlights,
      portfolioAssets,
      milestones: sortChaptersByTenure(milestones).map((milestone) => packChapter(milestone))
    };
    if (!hasPortfolioContent(payload)) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      setSaveStatus("saved");
      return;
    }
    persistPortfolioLocally(isPortfolioSaved, payload);

    if (!isPortfolioSaved) return;

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
  }, [contact, education, fullName, handle, headline, highlights, isPortfolioSaved, milestones, portfolioAssets, preferredLayout, skills, summaryStatement]);

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
          setMilestones(incomingChapters(data.milestones));
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
        setMilestones(incomingChapters(data.milestones));
        if (data.fullName) setFullName(data.fullName);
        if (data.headline) setHeadline(data.headline);
        if (data.summaryStatement) setSummaryStatement(data.summaryStatement);
        if (Array.isArray(data.highlights)) setHighlights(data.highlights);
        if (data.skills) setSkills(data.skills);
        if (data.education) setEducation(data.education);
        if (data.contact) {
          setContact((prev) => ({
            ...prev,
            ...data.contact,
            email: data.contact.email || prev.email,
            phone: data.contact.phone || prev.phone,
            location: prev.location || data.contact.location,
            linkedin: preferLinkedInProfile(prev.linkedin, data.contact.linkedin || ""),
            emailVerified: prev.emailVerified || Boolean(data.contact.emailVerified),
            phoneVerified: prev.phoneVerified || Boolean(data.contact.phoneVerified),
            linkedinVerified: prev.linkedinVerified || Boolean(data.contact.linkedinVerified)
          }));
        }

        setActiveTab("canvas");
        captureEvent("resume_parsed", { source: "studio_upload", chapters: data.milestones.length });
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Parsed ${data.milestones.length} career chapters from ${file.name}. Review them, then save to publish your page.`
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
    if (actionType === "upload_resume") {
      fileInputRef.current?.click();
      return;
    }
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
      if (actionType === "continue_verification") {
        const line = verificationStatusLine({
          emailVerified: contact.emailVerified,
          linkedinVerified: contact.linkedinVerified,
          phoneVerified: contact.phoneVerified,
          chapters: milestones.map((milestone) => ({
            company: milestone.company,
            level: getVerificationLevel(milestone).level
          }))
        });
        setChatMessages((prev) => [...prev, { sender: "ally", text: line }]);
        if (nextVerifyStep.id === "email") {
          document.getElementById("identity-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
          document.getElementById("contact-email")?.focus();
          return;
        }
        if (nextVerifyStep.id === "linkedin") {
          window.location.href = "/api/auth/linkedin?next=/studio";
          return;
        }
        if (nextVerifyStep.id === "phone") {
          document.getElementById("identity-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
          document.getElementById("contact-phone")?.focus();
          return;
        }
        if (nextVerifyStep.id === "chapter" && nextVerifyStep.milestoneId) {
          const chapter = milestones.find((milestone) => milestone.id === nextVerifyStep.milestoneId);
          if (chapter) {
            setTargetMilestone(chapter);
            setHighlightedMilestoneId(chapter.id);
            document.getElementById(chapter.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
            setIsVerifyHubOpen(true);
          }
        }
        return;
      }

      if (actionType === "ask_colleague") {
        const chapter = firstChapterWithoutColleague(milestones) || milestones[0];
        if (!chapter) {
          setChatMessages((prev) => [
            ...prev,
            { sender: "ally", text: "Add a company chapter first, then you can ask someone who worked with you there." }
          ]);
          return;
        }
        setTargetMilestone(chapter);
        document.getElementById(chapter.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
        returnToVerifyHubRef.current = false;
        setIsInviteModalOpen(true);
        setChatMessages((prev) => [
          ...prev,
          { sender: "user", text: "Ask a colleague" },
          { sender: "ally", text: `Ask someone who worked with you at ${chapter.company}. They sign in with LinkedIn. Their name stays off the public page.` }
        ]);
        return;
      }

      if (actionType === "invite_peers" || actionType === "attach_docs") {
        const chapter =
          (nextVerifyStep.id === "chapter" && nextVerifyStep.milestoneId
            ? milestones.find((milestone) => milestone.id === nextVerifyStep.milestoneId)
            : null) || milestones[0];
        if (!chapter) {
          setChatMessages((prev) => [
            ...prev,
            { sender: "ally", text: "Add a company chapter first, then we can verify it." }
          ]);
          return;
        }
        setTargetMilestone(chapter);
        document.getElementById(chapter.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (actionType === "invite_peers") {
          returnToVerifyHubRef.current = false;
          setIsInviteModalOpen(true);
          setChatMessages((prev) => [
            ...prev,
            { sender: "user", text: `Invite a colleague for ${chapter.company}` },
            { sender: "ally", text: `Invite a coworker, manager, or direct report who overlapped with you at ${chapter.company}. They confirm with LinkedIn. Their name stays private.` }
          ]);
          return;
        }
        returnToVerifyHubRef.current = false;
        setArtifactScanError(null);
        setIsArtifactModalOpen(true);
        setChatMessages((prev) => [
          ...prev,
          { sender: "user", text: `Attach a document for ${chapter.company}` },
          { sender: "ally", text: `Scanning a document for ${chapter.company}. We look for your name, this employer, overlapping dates, and W-2 / offer / contract language, then delete the file.` }
        ]);
        return;
      }

      const userLabel = verificationStarted ? "Continue verifying my portfolio" : "Verify my portfolio";
      if (nextVerifyStep.id === "email" || nextVerifyStep.id === "linkedin" || nextVerifyStep.id === "phone") {
        setChatMessages((prev) => [
          ...prev,
          { sender: "user", text: userLabel },
          { sender: "ally", text: `${nextVerifyStep.title}. ${nextVerifyStep.detail} Use the Verify button next to that field.` }
        ]);
        document.getElementById("identity-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      if (nextVerifyStep.id === "chapter" && nextVerifyStep.milestoneId) {
        const chapter = milestones.find((milestone) => milestone.id === nextVerifyStep.milestoneId);
        if (chapter) {
          setTargetMilestone(chapter);
          document.getElementById(chapter.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
          setIsVerifyHubOpen(true);
          setChatMessages((prev) => [
            ...prev,
            { sender: "user", text: userLabel },
            { sender: "ally", text: `${nextVerifyStep.title}. ${nextVerifyStep.detail}` }
          ]);
          return;
        }
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: "user", text: userLabel },
        { sender: "ally", text: nextVerifyStep.detail }
      ]);
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
      if (!hasPortfolioContent({ milestones, summaryStatement, highlights, portfolioAssets })) {
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
            text: "Opening save now. Your page goes live after this."
        }
      ]);
      return;
    }

    if (normalized.includes("review") || normalized.includes("grammar") || normalized.includes("spelling") || normalized.includes("buzzword")) {
      const review = reviewResume({
        summary: summaryStatement,
        chapters: milestones.map((milestone) => ({ id: milestone.id, company: milestone.company, claims: milestone.claims }))
      });
      setChatMessages((prev) => [...prev, { sender: "ally", text: review.notes.join(" ") }]);
      if (review.focusId === "summary") {
        document.getElementById("summary")?.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setHighlightedMilestoneId(review.focusId);
        document.getElementById(review.focusId)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (normalized.includes("attach") || normalized.includes("document") || normalized.includes("w-2") || normalized.includes("w2")) {
      handleActionPrompt("attach_docs");
    } else if (normalized.includes("peer") || normalized.includes("colleague") || normalized.includes("invite") || normalized.includes("corroborat")) {
      handleActionPrompt("invite_peers");
    } else if (
      normalized.includes("verify") ||
      normalized.includes("validate") ||
      normalized.includes("achievement") ||
      normalized.includes("artifact") ||
      normalized.includes("proof")
    ) {
      handleActionPrompt("verify_portfolio");
    } else {
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: isPortfolioSaved
              ? "Ask a colleague about one chapter. That is the most useful next step."
              : "Review the chapters, then save to publish your page."
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
      preferredLayout,
      highlights,
      portfolioAssets,
      milestones: sortChaptersByTenure(milestones).map((milestone) => packChapter(milestone))
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
        const savedHandle = handle.toLowerCase().trim();
        captureEvent("portfolio_saved", { handle: savedHandle, restoreEmailed: Boolean(data.restoreEmailed) });
        const invitedBy = consumeCorroboratorRef();
        if (invitedBy) {
          captureEvent(LOOP_EVENTS.corroboratorProfileCreated, {
            handle: savedHandle,
            invitedBy: invitedBy.handle,
            company: invitedBy.company
          });
        }
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: postSavePrompt(handle, firstChapterWithoutColleague(milestones)?.company)
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
      preferredLayout,
      highlights,
      portfolioAssets,
      milestones: sortChaptersByTenure(updatedMilestones).map((milestone) => packChapter(milestone))
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
        preferredLayout: record.preferredLayout,
        highlights: record.highlights || [],
        portfolioAssets: record.portfolioAssets,
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
    if (contact.email && colleagueEmail.trim().toLowerCase() === contact.email.trim().toLowerCase()) {
      alert("You cannot ask your own email to confirm this chapter.");
      return;
    }

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
          claims: askForAchievements
            ? targetMilestone.claims.map((c, i) => ({ id: `c${i}`, raw_bullet: c }))
            : [],
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
    setMilestones((prev) => sortChaptersByTenure([newM, ...prev]));
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

  const canPublish = hasPortfolioContent({ milestones, summaryStatement, highlights, portfolioAssets });
  const hasWork = portfolioStarted || canPublish || isPortfolioSaved;
  const waitingForStudio = !hasWork && (!authChecked || (hasSession && !vaultChecked));

  useEffect(() => {
    if (waitingForStudio || signInOnly || hasSession || hasWork) return;
    router.replace("/");
  }, [hasSession, hasWork, router, signInOnly, waitingForStudio]);

  const confirmReplaceResume = async () => {
    const currentHandle = handle.toLowerCase().trim();
    if (!currentHandle) return;
    setReplaceBusy(true);
    try {
      const res = await fetch("/api/vault/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ handle: currentHandle, clearContent: true })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Could not clear the public page.");
        return;
      }
      setMilestones([]);
      setSummaryStatement("");
      setHighlights([]);
      setSkills([]);
      setEducation([]);
      setPortfolioAssets([]);
      setHeadline("");
      setContact((prev) => ({
        ...prev,
        location: "",
        emailVerified: false,
        phoneVerified: false,
        linkedinVerified: false
      }));
      setPortfolioStarted(true);
      const kept = {
        handle: currentHandle,
        email: contact.email,
        fullName,
        headline: "",
        summaryStatement: "",
        highlights: [],
        skills: [],
        education: [],
        portfolioAssets: [],
        milestones: [],
        preferredLayout,
        contact: {
          ...contact,
          location: "",
          emailVerified: false,
          phoneVerified: false,
          linkedinVerified: false
        }
      };
      writeStudioRecord(STUDIO_SAVED_KEY, kept);
      writeStudioRecord(STUDIO_DRAFT_KEY, kept);
      setChatMessages([
        {
          sender: "ally",
          text: `verifiedcv.app/${currentHandle} is empty. Upload the resume that should replace it. Proof you add later starts over.`
        }
      ]);
      setReplaceOpen(false);
      setAllyOpen(true);
      fileInputRef.current?.click();
    } finally {
      setReplaceBusy(false);
    }
  };

  const logOut = async () => {
    loggingOutRef.current = true;
    skipNextAutosaveRef.current = true;
    clearStudioPortfolioStorage();
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      await supabase.auth.signOut();
    } finally {
      clearStudioPortfolioStorage();
      window.location.replace("/");
    }
  };

  const corroboratedCount = milestones.reduce((acc, m) => acc + (m.verifications?.length || 0), 0);
  const verifiedSignalsCount =
    (contact.emailVerified ? 1 : 0) +
    (contact.linkedinVerified ? 1 : 0) +
    (contact.phoneVerified ? 1 : 0) +
    corroboratedCount;

  const level1Count = milestones.filter(m => getVerificationLevel(m).level === 1).length;
  const level2Count = milestones.filter(m => getVerificationLevel(m).level === 2).length;
  const level3Count = milestones.filter(m => getVerificationLevel(m).level === 3).length;
  const totalVerified = level1Count + level2Count + level3Count;
  const portfolioScore = milestones.length > 0 ? Math.round((totalVerified / milestones.length) * 100) : 0;

  return (
    <div className="h-screen overflow-hidden bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col antialiased selection:bg-emerald-100">
      <header className="shrink-0 sticky top-0 z-50 bg-white border-b border-[#E2E8F0] h-14 px-4 sm:px-6 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <VerifiedCVLogo className="w-6 h-6 group-hover:scale-105 transition-transform" />
            <span className="font-black text-base text-[#0F172A] tracking-tight">VerifiedCV</span>
          </Link>
          <span className="hidden sm:inline text-[#E2E8F0]">/</span>
          <span className="hidden sm:inline text-xs font-bold text-slate-500 uppercase tracking-wider">
            Candidate Studio
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {(canPublish || portfolioStarted) && !isPortfolioSaved && (
            <button
              type="button"
              onClick={() => {
                setMilestones([]);
                setSummaryStatement("");
                setSkills([]);
                setEducation([]);
                setIsPortfolioSaved(false);
                setPortfolioStarted(false);
                setSaveStatus("idle");
                clearStudioPortfolioStorage();
                setActiveTab("canvas");
              }}
              aria-label="Clear canvas"
              className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors px-2 sm:px-3 py-1.5 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Canvas</span>
            </button>
          )}

          {isPortfolioSaved ? (
            <>
              <span className="hidden sm:inline text-[11px] font-semibold text-slate-400">
                {saveStatus === "saving" ? "Saving..." : saveStatus === "error" ? "Save failed" : "All changes saved"}
              </span>
              <Link
                href={`/${handle.toLowerCase().trim()}`}
                target="_blank"
                aria-label="View live dossier"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <span className="hidden sm:inline">View Live Dossier</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setReplaceOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#0F172A] text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Replace resume</span>
                <span className="sm:hidden">Replace</span>
              </button>
              <button
                type="button"
                onClick={logOut}
                className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
              >
                Log out
              </button>
            </>
          ) : (
            canPublish && (
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="sm:hidden">Save</span>
                <span className="hidden sm:inline">Save Portfolio</span>
              </button>
            )
          )}
          {user && !isPortfolioSaved && (
            <button
              type="button"
              onClick={logOut}
              className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
            >
              Log out
            </button>
          )}
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {hasWork && (
        <aside className="order-2 flex w-full shrink-0 flex-col border-t border-[#E2E8F0] bg-white md:order-1 md:h-full md:w-[320px] md:border-t-0 md:border-r">
          <button
            type="button"
            className="md:hidden flex w-full items-center gap-2.5 px-4 py-3 text-left"
            onClick={() => setAllyOpen((open) => !open)}
            aria-expanded={allyOpen}
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669]">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-xs font-black text-[#0F172A]">Ally</span>
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-600">{actionPrompts[0]?.label}</span>
          </button>
          <div className={`${allyOpen ? "flex" : "hidden"} md:flex min-h-0 max-h-[46vh] md:max-h-none md:h-full md:flex-1 flex-col overflow-hidden`}>
          <div className="hidden md:flex p-4 border-b border-[#E2E8F0] items-center gap-2.5 bg-[#F8FAFC]">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669]">
              <Bot className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black text-[#0F172A]">Ally</h3>
          </div>

          <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
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
                <span>Reading your resume...</span>
              </div>
            )}
          </div>

          <div className="p-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-1.5">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-1">
              Next step
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
                placeholder="Ask Ally what to do next..."
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
          </div>
        </aside>
        )}

        {/* LIVE CANVAS */}
        <main className="order-1 min-h-0 flex-1 overflow-y-auto w-full md:order-2">
          <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 antialiased">
          {waitingForStudio || (!hasWork && !hasSession && !signInOnly) ? (
            <p className="pt-16 text-center text-sm font-semibold text-slate-500">
              {waitingForStudio ? "Opening your studio…" : "Taking you to the start page…"}
            </p>
          ) : !portfolioStarted && !canPublish ? (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xs max-w-2xl mx-auto mt-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669] mx-auto">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-[#0F172A]">{hasSession ? "Upload your resume" : "Start your portfolio"}</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {hasSession
                    ? "You are signed in, and this page does not have a resume yet. Upload a file or paste the text."
                    : "Upload a resume, or start with the work you want to show. A name, an email, and one piece of work is enough to publish. Experience is optional."}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
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
                  onClick={() => setPortfolioStarted(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <span>Start with your work</span>
                </button>

                {!user && (
                  <button
                    type="button"
                    onClick={() => setIsClaimModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#0F172A] text-xs font-bold transition-all cursor-pointer"
                  >
                    <span>Sign in</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setActiveTab("paste")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                  <span>Paste Resume Text</span>
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
              className="flex flex-col gap-8"
              onFocusCapture={lockIfUnsaved}
              onClickCapture={(e) => {
                const target = e.target as HTMLElement;
                if (!isPortfolioSaved && target.closest("button, input, textarea, select")) {
                  lockIfUnsaved(e);
                }
              }}
            >
              <nav
                aria-label="Resume sections"
                className="sticky top-0 z-20 -mx-4 px-4 sm:-mx-8 sm:px-8 py-2.5 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-[#E2E8F0] flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {[
                  { id: "identity-card", label: "You" },
                  ...(summaryStatement || summaryEditor ? [{ id: "summary", label: "Summary" }] : []),
                  ...(highlights.length > 0 ? [{ id: "highlights", label: "Highlights" }] : []),
                  { id: "experience", label: "Experience" },
                  ...(skills.length > 0 ? [{ id: "skills", label: "Skills" }] : []),
                  ...(education.length > 0 ? [{ id: "education", label: "Education" }] : []),
                  ...(sampleWorkOpen || portfolioAssets.length > 0 ? [{ id: "work-samples", label: "Sample work" }] : [])
                ].map((section, index) => (
                  <span key={section.id} className="inline-flex items-center gap-2">
                    {index > 0 && <span className="text-slate-300 text-[11px]">/</span>}
                    <button
                      type="button"
                      onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      className="text-[11px] font-bold text-slate-500 hover:text-[#0F172A] cursor-pointer"
                    >
                      {section.label}
                    </button>
                  </span>
                ))}
                </div>
              </nav>

              {/* Candidate Identity & Contact Verification Strip */}
              <div id="identity-card" className="scroll-mt-14 bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-4">
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

                  <div className="flex items-start self-start sm:self-auto">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                    isPortfolioSaved
                      ? "bg-emerald-50 border-emerald-200 text-[#059669]"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isPortfolioSaved ? "Portfolio Saved" : "Save to edit"}</span>
                  </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        id="contact-email"
                        type="email"
                        value={contact.email}
                        readOnly={!isPortfolioSaved || (contact.emailVerified && editingVerifiedField !== "email")}
                        onChange={(e) => {
                          setContact({ ...contact, email: e.target.value, emailVerified: false });
                          setEmailCodeSent(false);
                          setEditingVerifiedField(null);
                        }}
                        placeholder="Work Email"
                        className={`w-full text-xs bg-transparent focus:outline-none font-medium ${isPortfolioSaved && !(contact.emailVerified && editingVerifiedField !== "email") ? "" : "cursor-default"}`}
                      />
                    </div>
                    {contact.emailVerified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {editingVerifiedField !== "email" && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVerifiedField("email");
                              setTimeout(() => document.getElementById("contact-email")?.focus(), 0);
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:text-[#0F172A] cursor-pointer shrink-0"
                          >
                            Edit
                          </button>
                        )}
                      </>
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
                        id="contact-phone"
                        type="text"
                        value={contact.phone}
                        readOnly={!isPortfolioSaved || (contact.phoneVerified && editingVerifiedField !== "phone")}
                        onChange={(e) => {
                          setContact({ ...contact, phone: e.target.value, phoneVerified: false });
                          setPhoneCodeSent(false);
                          setEditingVerifiedField(null);
                        }}
                        placeholder="Phone"
                        className={`w-full text-xs bg-transparent focus:outline-none font-medium ${isPortfolioSaved && !(contact.phoneVerified && editingVerifiedField !== "phone") ? "" : "cursor-default"}`}
                      />
                    </div>
                    {contact.phoneVerified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {editingVerifiedField !== "phone" && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVerifiedField("phone");
                              setTimeout(() => document.getElementById("contact-phone")?.focus(), 0);
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:text-[#0F172A] cursor-pointer shrink-0"
                          >
                            Edit
                          </button>
                        )}
                      </>
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
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <LinkedInIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      {contact.linkedinVerified && editingVerifiedField !== "linkedin" && linkedInHandle(contact.linkedin) ? (
                        <a
                          href={linkedInProfileUrl(contact.linkedin)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-blue-700 truncate"
                        >
                          {linkedInHandle(contact.linkedin)}
                        </a>
                      ) : (
                        <input
                          id="contact-linkedin"
                          type="text"
                          value={contact.linkedin}
                          readOnly={!isPortfolioSaved}
                          onChange={(e) => {
                            const next = e.target.value;
                            const sameHandle = linkedInHandle(next) !== "" && linkedInHandle(next) === linkedInHandle(contact.linkedin);
                            setContact({
                              ...contact,
                              linkedin: next,
                              linkedinVerified: Boolean(contact.linkedinVerified && sameHandle)
                            });
                          }}
                          onBlur={() => {
                            if (contact.linkedinVerified) setEditingVerifiedField(null);
                          }}
                          placeholder="LinkedIn handle"
                          className="w-full text-xs bg-transparent focus:outline-none font-medium"
                        />
                      )}
                    </div>
                    {contact.linkedinVerified && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                    {contact.linkedinVerified && editingVerifiedField !== "linkedin" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVerifiedField("linkedin");
                          setLinkedinVerifyError("");
                          setTimeout(() => document.getElementById("contact-linkedin")?.focus(), 0);
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-[#0F172A] cursor-pointer shrink-0"
                      >
                        Edit
                      </button>
                    ) : !contact.linkedinVerified ? (
                      <button
                        type="button"
                        onClick={() => {
                          requirePortfolioSaved(() => {
                            setLinkedinVerifyError("");
                            persistPortfolioLocally(true);
                            captureEvent("linkedin_verify_clicked", { handle: handle.toLowerCase().trim() });
                            window.location.href = "/api/auth/linkedin?next=/studio";
                          });
                        }}
                        className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer shrink-0"
                      >
                        Verify
                      </button>
                    ) : null}
                  </div>

                  <LocationField
                    value={contact.location}
                    saved={isPortfolioSaved}
                    onChange={(location) => setContact({ ...contact, location })}
                  />
                </div>
                {editingVerifiedField === "email" && contact.emailVerified && (
                  <p className="text-[11px] font-semibold text-slate-600">
                    This email is verified. Change it and the check comes off until you verify the new address.
                  </p>
                )}
                {editingVerifiedField === "phone" && contact.phoneVerified && (
                  <p className="text-[11px] font-semibold text-slate-600">
                    This phone is verified. Change it and the check comes off until you verify the new number.
                  </p>
                )}
                {editingVerifiedField === "linkedin" && (
                  <p className="text-[11px] font-semibold text-slate-600">
                    LinkedIn is confirmed. If you change this handle, you will need to verify it again.
                  </p>
                )}
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
              {(summaryStatement || summaryEditor) && (
                <div id="summary" style={{ order: dossierSectionRank(preferredLayout).summary }} className="scroll-mt-14 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#059669]" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F172A]">
                        Summary
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSummaryStatement("");
                        setSummaryEditor(false);
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      Remove
                    </button>
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
              {highlights.length > 0 && (
                <div id="highlights" style={{ order: dossierSectionRank(preferredLayout).highlights }} className="scroll-mt-14 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F172A]">Highlights</h3>
                      <p className="text-[11px] text-slate-500 mt-1">Optional. Use lines from the resume, or write your own. A line can stand on its own or combine more than one chapter.</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setHighlights((prev) => [...prev, ""])}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669] cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setHighlights([])}
                        className="text-[10px] font-bold text-slate-400 hover:text-red-500 cursor-pointer"
                      >
                        Remove section
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {highlights.map((line, index) => (
                      <div key={index} className="flex items-start gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                        <AutoText
                          value={line}
                          readOnly={!isPortfolioSaved}
                          onChange={(next) =>
                            setHighlights((prev) => prev.map((item, itemIndex) => (itemIndex === index ? next : item)))
                          }
                          className="flex-1 text-xs text-slate-700 leading-relaxed focus:outline-none font-sans bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setHighlights((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                          className="text-[10px] font-bold text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div id="experience" style={{ order: dossierSectionRank(preferredLayout).experience }} className="scroll-mt-14 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                    Experience ({milestones.length})
                  </h3>
                  <div ref={addMenuRef} className="relative">
                    <button
                      type="button"
                      aria-expanded={addMenuOpen}
                      aria-haspopup="menu"
                      onClick={() => setAddMenuOpen((open) => !open)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-[#E2E8F0] hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#059669]" />
                      <span>Add</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${addMenuOpen ? "rotate-180" : ""}`} />
                    </button>
                    {addMenuOpen && (
                      <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-44 rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-lg">
                        {(
                          [
                            {
                              id: "experience",
                              label: "Experience",
                              show: true,
                              run: () => addEmptyMilestone()
                            },
                            {
                              id: "summary",
                              label: "Summary",
                              show: !summaryStatement.trim() && !summaryEditor,
                              run: () => {
                                setSummaryEditor(true);
                                window.setTimeout(() => document.getElementById("summary")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                              }
                            },
                            {
                              id: "highlights",
                              label: "Highlights",
                              show: highlights.length === 0,
                              run: () => {
                                setHighlights([""]);
                                window.setTimeout(() => document.getElementById("highlights")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                              }
                            },
                            {
                              id: "work",
                              label: "Sample work",
                              show: portfolioAssets.length === 0 && !sampleWorkOpen,
                              run: () => {
                                setSampleWorkOpen(true);
                                window.setTimeout(() => document.getElementById("work-samples")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
                              }
                            }
                          ] as const
                        )
                          .filter((option) => option.show)
                          .map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setAddMenuOpen(false);
                                option.run();
                              }}
                              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-700 hover:bg-[#F8FAFC] hover:text-[#0F172A] cursor-pointer"
                            >
                              {option.label}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
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
                          <div className="flex items-center gap-2">
                            {milestone.companyUrl && (
                              <a href={milestone.companyUrl} target="_blank" rel="noreferrer" className="shrink-0" aria-label={`Open ${siteLabel(milestone.companyUrl)}`}>
                                <img src={faviconUrl(milestone.companyUrl)} alt="" className="w-4 h-4 rounded-sm" />
                              </a>
                            )}
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
                            className={`flex-1 font-black text-base text-[#0F172A] focus:outline-none border-b border-transparent ${isPortfolioSaved ? "focus:border-[#059669]" : "cursor-pointer"}`}
                          />
                            {milestone.companyUrl && (
                              <a href={milestone.companyUrl} target="_blank" rel="noreferrer" className="text-[#059669] shrink-0" aria-label={`Open ${milestone.company}`}>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {trustStatus.level > 0 && (
                              <span
                                className="group/proof relative inline-flex items-center cursor-help shrink-0"
                                title={companyVerificationTooltip(
                                  milestone.company,
                                  milestone.verifications || [],
                                  milestone.artifacts?.length || 0
                                )}
                              >
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  {publicChapterLabel(trustStatus.level)}
                                </span>
                                <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-56 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-semibold leading-relaxed text-white shadow-xl group-hover/proof:block">
                                  {companyVerificationTooltip(
                                    milestone.company,
                                    milestone.verifications || [],
                                    milestone.artifacts?.length || 0
                                  )}
                                </span>
                              </span>
                            )}
                          </div>
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
                          <CompanySitePrompt
                            company={milestone.company}
                            companyUrl={milestone.companyUrl}
                            saved={isPortfolioSaved}
                            onChange={(url) =>
                              setMilestones((prev) =>
                                prev.map((item) => (item.id === milestone.id ? { ...item, companyUrl: url } : item))
                              )
                            }
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
                              onBlur={() => setMilestones((prev) => sortChaptersByTenure(prev))}
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
                            title={!isPortfolioSaved ? "Save your portfolio to add proof for this company" : "Add proof for this company"}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Add proof</span>
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
                                <span className="text-slate-400">Scanned, file not kept</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = milestones.map((item) =>
                                      item.id === milestone.id
                                        ? { ...item, artifacts: (item.artifacts || []).filter((artifact) => artifact.id !== art.id) }
                                        : item
                                    );
                                    setMilestones(updated);
                                    void updateVaultStore(updated);
                                  }}
                                  className="text-slate-400 hover:text-red-500 cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {milestone.registryLinks && milestone.registryLinks.length > 0 && (
                          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
                            {milestone.registryLinks.map((link) => (
                              <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                                <span>{link.label}</span>
                                <span className="text-slate-400">{publicRegistryLabel(link.type)}</span>
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
                            Achievements ({milestone.claims.length})
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
                              {endorsedClaimIndexes(milestone.endorsedClaimIds).includes(claimIdx) ? (
                                <CheckCircle2 className="mt-1 w-3.5 h-3.5 text-[#059669] shrink-0" />
                              ) : (
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0" />
                              )}
                              <AutoText
                                value={claimText}
                                readOnly={!isPortfolioSaved}
                                onChange={(next) => updateMilestoneClaim(milestone.id, claimIdx, next)}
                                className="flex-1 text-xs text-slate-700 leading-relaxed focus:outline-none font-sans bg-transparent"
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
              <div id="skills" style={{ order: dossierSectionRank(preferredLayout).skills }} className="scroll-mt-14 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F172A]">
                        Core Proficiencies & Technologies ({skills.length})
                    </h3>
                  </div>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const next = skillDraft.trim();
                      if (!next || skills.some((skill) => skill.toLowerCase() === next.toLowerCase())) return;
                      setSkills((prev) => [...prev, next]);
                      setSkillDraft("");
                    }}
                  >
                    <input
                      type="text"
                      value={skillDraft}
                      onChange={(e) => setSkillDraft(e.target.value)}
                      placeholder="Add a skill"
                      className="flex-1 text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
                    />
                    <button type="submit" className="text-xs font-bold text-[#059669] px-3 cursor-pointer">Add</button>
                  </form>
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

              {/* Education */}
              {education.length > 0 && (
                <div id="education" style={{ order: dossierSectionRank(preferredLayout).education }} className="scroll-mt-14 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
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

              {(sampleWorkOpen || portfolioAssets.length > 0) && (
              <div id="work-samples" style={{ order: dossierSectionRank(preferredLayout).work }} className="scroll-mt-14 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">On the dossier</span>
                  <div className="inline-flex p-0.5 rounded-lg bg-white border border-[#E2E8F0]">
                    {(["top", "bottom"] as const).map((placement) => {
                      const active = parseDossierLayout(preferredLayout).placement === "top" ? placement === "top" : placement === "bottom";
                      return (
                        <button
                          key={placement}
                          type="button"
                          onClick={() => {
                            const current = parseDossierLayout(preferredLayout);
                            setPreferredLayout(encodeDossierLayout(current.template, placement));
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                            active ? "bg-emerald-50 text-[#059669]" : "text-slate-500 hover:text-[#0F172A]"
                          }`}
                        >
                          {placement === "top" ? "Top of dossier" : "Bottom of dossier"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              <PortfolioStudioPanel
                assets={portfolioAssets}
                handle={handle}
                saved={isPortfolioSaved}
                onAssetsChange={setPortfolioAssets}
              />
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
                <h3 className="font-black text-sm text-[#0F172A]">Add proof for {targetMilestone.company}</h3>
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
              const currentStatus = getVerificationStatus(milestoneCounts(live));

              return (
                <div className="space-y-3">
                  <div className="px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                    <span className="text-slate-500">Current status: </span>
                    <span className="font-bold text-[#0F172A]">{publicChapterLabel(currentStatus.level) || currentStatus.label}</span>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      A work email, an employment document, and a colleague are different kinds of proof. Hover Verification on a chapter to see what was checked.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openVerifyStep("corp")}
                    className="w-full text-left p-4 rounded-2xl border border-[#E2E8F0] hover:border-emerald-200 hover:bg-emerald-50/40 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-black text-[#0F172A]">Work email</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Send a code to the work inbox {live.company} issued you. We reject personal inboxes, require the domain to match this company, check its mail servers, and look the mailbox up in a company directory before a code goes out.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => openVerifyStep("peer")}
                    className="w-full text-left p-4 rounded-2xl border border-[#E2E8F0] hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-black text-[#0F172A]">Invite colleagues</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Invite coworkers, managers, or direct reports who overlapped with you here. They confirm with LinkedIn. Their name stays private.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => openVerifyStep("doc")}
                    className="w-full text-left p-4 rounded-2xl border border-[#E2E8F0] hover:border-blue-200 hover:bg-blue-50/40 transition-colors cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-black text-[#0F172A]">Attach a document</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Upload a W-2, offer letter, contract, or pay stub. We check your name, this employer, overlapping dates, and document language, then delete the file. This is not an IRS lookup — pair it with a colleague when you can.
                    </p>
                  </button>

                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ARTIFACT UPLOAD MODAL */}
      {isCorpEmailModalOpen && targetMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-[#0F172A]">Verify with work email</h3>
              </div>
              <button
                type="button"
                onClick={() => closeVerifyStep(() => setIsCorpEmailModalOpen(false))}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs antialiased">
              <p className="text-slate-500 leading-relaxed">
                Send a 6-digit code to the work email <strong>{targetMilestone.company}</strong> issued you. Personal inboxes are blocked. We match the domain to this company, confirm it has mail servers, look the mailbox up in Hunter, and reject disposable, webmail, or bounced addresses. The code is what proves you can open that inbox.
              </p>

              {!corpEmailSent ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setCorpEmailError("");
                    const domainCheck = corporateEmailMatchesCompany(targetMilestone.company, corpEmail);
                    if (!domainCheck.ok) {
                      setCorpEmailError(domainCheck.reason);
                      return;
                    }
                    setCorpEmailSending(true);
                    try {
                      const res = await fetch("/api/verify/corp-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: corpEmail,
                          milestoneId: targetMilestone.id,
                          companyName: targetMilestone.company
                        })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setCorpEmailSent(true);
                        setCorpEmailDirectory(String(data.directory || ""));
                      } else {
                        setCorpEmailError(data.error || "Failed to send code.");
                      }
                    } catch {
                      setCorpEmailError("Network error.");
                    } finally {
                      setCorpEmailSending(false);
                    }
                  }}
                  className="space-y-3"
                >
                  <input
                    type="email"
                    required
                    value={corpEmail}
                    onChange={(e) => setCorpEmail(e.target.value)}
                    placeholder={`e.g. graham@${targetMilestone.company.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`}
                    className="w-full p-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                  />
                  {corpEmailError && <p className="text-[10px] font-bold text-red-500">{corpEmailError}</p>}
                  <button
                    type="submit"
                    disabled={corpEmailSending || !corpEmail}
                    className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {corpEmailSending ? <Clock className="w-4 h-4 animate-spin" /> : <span>Send Code</span>}
                  </button>
                </form>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setCorpEmailError("");
                    setCorpEmailSending(true);
                    try {
                      const res = await fetch("/api/verify/corp-email", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          email: corpEmail,
                          code: corpEmailCode,
                          milestoneId: targetMilestone.id,
                          companyName: targetMilestone.company
                        })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        // Success! Update the milestone verifications locally
                        setMilestones((prev) =>
                          prev.map((m) => {
                            if (m.id === targetMilestone.id) {
                              return {
                                ...m,
                                verifications: [
                                  ...(m.verifications || []),
                                  {
                                    id: `ver-corp-${Date.now()}`,
                                    name: "Corporate Email Verification",
                                    role: "Mailbox directory + inbox code",
                                    email: corpEmail,
                                    verifiedAt: new Date().toISOString()
                                  }
                                ]
                              };
                            }
                            return m;
                          })
                        );
                        setChatMessages((prev) => [
                          ...prev,
                          {
                            sender: "ally",
                            text: `Corporate email verified for ${targetMilestone.company}.`
                          }
                        ]);
                        setIsCorpEmailModalOpen(false);
                      } else {
                        setCorpEmailError(data.error || "Incorrect code.");
                      }
                    } catch {
                      setCorpEmailError("Network error.");
                    } finally {
                      setCorpEmailSending(false);
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
                    <CheckCircle2 className="w-4 h-4 text-[#059669] mx-auto" />
                    <p className="font-bold text-emerald-800">Code sent to {corpEmail}</p>
                    {corpEmailDirectory && <p className="text-[11px] text-emerald-800/80 leading-relaxed">{corpEmailDirectory}</p>}
                  </div>
                  <input
                    type="text"
                    required
                    value={corpEmailCode}
                    onChange={(e) => setCorpEmailCode(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full p-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-mono tracking-widest text-center"
                  />
                  {corpEmailError && <p className="text-[10px] font-bold text-red-500 text-center">{corpEmailError}</p>}
                  <button
                    type="submit"
                    disabled={corpEmailSending || !corpEmailCode}
                    className="w-full py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {corpEmailSending ? <Clock className="w-4 h-4 animate-spin" /> : <span>Verify</span>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {isArtifactModalOpen && targetMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-sm text-[#0F172A]">Scan employment document</h3>
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
              <span className="font-bold text-[#0F172A] block">Document for {targetMilestone.company}</span>
              <span className="text-slate-500 block">{targetMilestone.period}. PDF only: W-2, offer letter, contract, or pay stub.</span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-4 text-emerald-900 leading-relaxed">
                We check the PDF for your name, this employer, overlapping dates, and employment-document language. Then we delete the file. This is not an IRS or payroll lookup, so a mocked-up document can still slip through. A colleague confirmation is stronger.
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
                <h3 className="font-black text-sm text-[#0F172A]">Invite colleagues</h3>
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
                Invite coworkers, managers, or direct reports who overlapped with you here. They confirm with LinkedIn. Their name stays private on your dossier.
              </p>
            </div>

            <form onSubmit={dispatchPeerInvite} className="space-y-4 text-xs">
              <div className="space-y-2 p-3 rounded-xl border border-[#E2E8F0] bg-white">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked readOnly className="mt-0.5 accent-[#059669]" />
                  <span className="text-slate-700">
                    <strong className="text-[#0F172A]">Confirm they worked here</strong>
                    <span className="block text-[11px] text-slate-500">Always included. Corroborating an achievement also confirms the company.</span>
                  </span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={askForAchievements}
                    onChange={(e) => setAskForAchievements(e.target.checked)}
                    className="mt-0.5 accent-[#059669]"
                  />
                  <span className="text-slate-700">
                    <strong className="text-[#0F172A]">Ask them to corroborate specific achievements</strong>
                    <span className="block text-[11px] text-slate-500">They can check the bullets they personally observed.</span>
                  </span>
                </label>
              </div>
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
                      <span>Send confirmation request</span>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {replaceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Warning</p>
              <h3 className="font-black text-lg text-[#0F172A]">Replace your resume?</h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Replacing your resume deletes every verification on this profile. That cannot be undone.
                Your public page at verifiedcv.app/{handle.toLowerCase().trim() || "your-handle"} will be cleared.
                You keep the handle, and the page stays empty until you publish a new resume.
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplaceOpen(false)}
                disabled={replaceBusy}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#0F172A] cursor-pointer"
              >
                Keep my resume
              </button>
              <button
                type="button"
                onClick={confirmReplaceResume}
                disabled={replaceBusy}
                className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-red-700 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {replaceBusy ? "Clearing…" : "Replace resume"}
              </button>
            </div>
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
                <h3 className="font-black text-sm text-[#0F172A]">{canPublish ? "Save your portfolio" : "Sign in"}</h3>
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
              <div className="space-y-5 text-xs antialiased">
                <p className="text-slate-500 leading-relaxed text-center">
                  {canPublish
                    ? "Sign in with Google, LinkedIn, or email. Your name and email publish the page. Add work, a summary, or one chapter — experience is optional."
                    : "Sign in to open the portfolio you already saved."}
                </p>
                
                <div className="space-y-3">
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

                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signInWithOAuth({
                        provider: "linkedin_oidc",
                        options: {
                          redirectTo: `${window.location.origin}/auth/callback?next=/studio`,
                        },
                      });
                    }}
                    className="w-full py-3 rounded-xl border border-[#E2E8F0] hover:bg-[#0A66C2]/5 text-[#0A66C2] font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                    <span>Continue with LinkedIn</span>
                  </button>
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="shrink-0 px-3 text-slate-400 text-[10px] uppercase font-bold tracking-widest">Or</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {magicLinkSent ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                    <CheckCircle2 className="w-5 h-5 text-[#059669] mx-auto" />
                    <p className="font-bold text-emerald-800">Check your email</p>
                    <p className="text-emerald-700 leading-relaxed">
                      We sent a magic link to <strong>{magicLinkEmail}</strong>. Click it to sign in.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendMagicLink} className="space-y-3">
                    <div>
                      <input
                        type="email"
                        required
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        placeholder="name@work.com"
                        className={`w-full p-3 rounded-xl border ${magicLinkError ? "border-red-500" : "border-[#E2E8F0]"} focus:outline-none focus:border-[#059669] text-center`}
                      />
                      {magicLinkError && <span className="text-[10px] text-red-500 mt-1 block text-center">{magicLinkError}</span>}
                    </div>
                    <button
                      type="submit"
                      disabled={magicLinkLoading || !magicLinkEmail.trim()}
                      className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {magicLinkLoading ? <Clock className="w-4 h-4 animate-spin" /> : "Email me a login link"}
                    </button>
                  </form>
                )}
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