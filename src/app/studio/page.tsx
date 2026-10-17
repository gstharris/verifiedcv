"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
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
  UserCheck,
  X,
  RotateCcw,
  GraduationCap,
  FileText,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  ShieldAlert,
  Share2,
  Zap,
  Paperclip
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";
import {
  STUDIO_DRAFT_KEY,
  STUDIO_SAVED_KEY,
  bindStudioAccount,
  clearStudioPortfolioStorage,
  discardSessionStudioRecords,
  hasPortfolioContent,
  readStudioRecord,
  stripProofFromMilestones,
  unverifiedContact,
  writeStudioRecord
} from "@/lib/studioPortfolio";
import { getVerificationStatus } from "@/lib/verificationLevel";
import { chapterProofItems, companyVerificationTooltip, endorsedClaimIndexes, firstChapterWithoutColleague, hasWorkEmailProof, mergeChapterProof, postSavePrompt } from "@/lib/verificationSignals";
import { corporateEmailMatchesCompany } from "@/lib/corporateEmail";
import { interpretStudioMessage } from "@/lib/allyIntent";
import { suggestStudioActions, unknownStudioReply, type StudioAction, type StudioActionPlan } from "@/lib/studioActions";
import { resolveStudioPhase, studioMobileChrome } from "@/lib/studioPhase";
import { NextActionDock } from "@/components/studio/NextActionDock";
import { interpretVerificationAsk } from "@/lib/chapterMatch";
import { nextPortfolioVerificationStep, verificationStatusLine } from "@/lib/verificationQueue";
import { dossierSectionRank, encodeDossierLayout, parseDossierLayout, publicRegistryLabel, type PortfolioAsset } from "@/lib/portfolioAssets";
import { LOOP_EVENTS, consumeCorroboratorRef } from "@/lib/corroborationLoop";
import { linkedInHandle, linkedInProfileUrl, preferLinkedInProfile } from "@/lib/linkedin";
import { WORD_RESUME_MESSAGE, isWordResumeFile, resumeImportHasContent, resumeImportLog } from "@/app/api/parse/parseResume";
import { flagEmoji, parseLocation } from "@/lib/locations";
import { repairSkillList } from "@/lib/skills";
import { resolvePlace, suggestPlaces } from "@/lib/places";
import { hydrateChapter, packChapter } from "@/lib/chapterMeta";
import { hasUnpublishedChanges, summarizeDossierChanges, type DossierSnapshot } from "@/lib/dossierChanges";
import { draftDeleteBlocksCancel, EXPLICIT_PUBLISH_HEADER } from "@/lib/dossierDraft";
import { publishDraft } from "@/lib/publishDraft";
import { publishFailureMessage } from "@/lib/publishResult";
import { chapterHasProof, hasKeptIdentity, keepPublishedIdentity, mergePeerVerifications, mergeReplacedContact, overlayChapterProof, patchVaultIdentity, replaceResumeChapters, withIdentity } from "@/lib/studioSync";
import { ReviewChangesDialog } from "@/components/studio/ReviewChangesDialog";
import { UndoBanner } from "@/components/studio/UndoBanner";
import { faviconUrl, publicHttpsUrl, siteLabel } from "@/lib/companySite";
import { blankChapter, formatTenureFields, parseTenureFields, sortChaptersByTenure, type TenureFields } from "@/lib/tenureOverlap";
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

function savedChapters(list: Milestone[]) {
  return sortChaptersByTenure(list).flatMap((milestone) => {
    const compact = blankChapter(milestone);
    if (!compact.hasContent) return [];
    return [packChapter({ ...milestone, claims: compact.claims })];
  });
}

function savedHighlights(lines: string[]) {
  return lines.map((line) => line.trim()).filter(Boolean);
}

const TENURE_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function TenureEditor({
  value,
  readOnly,
  onChange,
  onCommit
}: {
  value: string;
  readOnly?: boolean;
  onChange: (period: string) => void;
  onCommit?: () => void;
}) {
  const fields = parseTenureFields(value);
  const write = (next: Partial<TenureFields>) => {
    const merged = { ...fields, ...next };
    if (merged.present) {
      merged.endMonth = "";
      merged.endYear = "";
    }
    onChange(formatTenureFields(merged));
  };
  const monthSelect = (label: string, month: string, onMonth: (month: string) => void) => (
    <select
      aria-label={label}
      disabled={readOnly}
      value={month}
      onChange={(event) => onMonth(event.target.value)}
      onBlur={onCommit}
      className="bg-transparent text-[11px] font-medium text-slate-600 focus:outline-none disabled:cursor-default"
    >
      <option value="">Month</option>
      {TENURE_MONTHS.map((name) => (
        <option key={name} value={name}>{name}</option>
      ))}
    </select>
  );
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5 text-[11px] font-medium text-slate-600">
      {monthSelect("Start month", fields.startMonth, (startMonth) => write({ startMonth }))}
      <input
        aria-label="Start year"
        inputMode="numeric"
        maxLength={4}
        readOnly={readOnly}
        value={fields.startYear}
        onChange={(event) => write({ startYear: event.target.value.replace(/\D/g, "").slice(0, 4) })}
        onBlur={onCommit}
        placeholder="Year"
        className="w-12 bg-transparent text-right focus:outline-none"
      />
      <span className="text-slate-300">—</span>
      {fields.present ? (
        <span>Present</span>
      ) : (
        <>
          {monthSelect("End month", fields.endMonth, (endMonth) => write({ endMonth }))}
          <input
            aria-label="End year"
            inputMode="numeric"
            maxLength={4}
            readOnly={readOnly}
            value={fields.endYear}
            onChange={(event) => write({ endYear: event.target.value.replace(/\D/g, "").slice(0, 4) })}
            onBlur={onCommit}
            placeholder="Year"
            className="w-12 bg-transparent text-right focus:outline-none"
          />
        </>
      )}
      <label className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
        <input
          type="checkbox"
          checked={fields.present}
          disabled={readOnly}
          onChange={(event) => write({ present: event.target.checked })}
        />
        Present
      </label>
    </div>
  );
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
  const [chosen, setChosen] = useState<ReturnType<typeof suggestPlaces>[number] | null>(null);
  const [remote, setRemote] = useState<ReturnType<typeof suggestPlaces>>([]);
  const suggestionsRef = React.useRef<ReturnType<typeof suggestPlaces>>([]);
  const choosingRef = React.useRef(false);
  useEffect(() => {
    const label = parseLocation(value)?.label || value;
    setDraft(label);
    setChosen(resolvePlace(label));
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
  const selected = chosen && chosen.label.toLowerCase() === draft.trim().toLowerCase() ? chosen : null;
  const place = selected || resolved;
  const notice = !open && touched && draft.trim() && !place ? "Choose a city from the list." : "";
  const choosePlace = (next: ReturnType<typeof suggestPlaces>[number]) => {
    choosingRef.current = true;
    setChosen(next);
    setDraft(next.label);
    setOpen(false);
    setTouched(false);
    onChange(next.label);
  };
  return (
    <div className="relative p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
      <div className="flex items-center gap-2">
        <span className="text-sm leading-none shrink-0">
          {place?.countryCode ? flagEmoji(place.countryCode) : <MapPin className="w-3.5 h-3.5 text-slate-400" />}
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
              if (choosingRef.current) {
                choosingRef.current = false;
                setOpen(false);
                return;
              }
              setOpen(false);
              const listed = suggestionsRef.current;
              const match = resolvePlace(draft) || (listed.length === 1 ? listed[0] : null);
              if (match) {
                choosePlace(match);
              } else if (!chosen || chosen.label.toLowerCase() !== draft.trim().toLowerCase()) {
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
                choosePlace(place);
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

  if (companyUrl && !showCustom) {
    return (
      <>
        <a
          href={companyUrl}
          target="_blank"
          rel="noreferrer"
          className="order-first shrink-0"
          aria-label={`Open ${siteLabel(companyUrl)}`}
          title={siteLabel(companyUrl)}
        >
          <img src={faviconUrl(companyUrl)} alt="" className="w-4 h-4 rounded-sm" />
        </a>
        <button
          type="button"
          onClick={() => {
            setCustom("");
            setShowCustom(true);
          }}
          className="text-[10px] font-bold text-slate-400 hover:text-[#0F172A] cursor-pointer shrink-0"
        >
          Modify URL
        </button>
      </>
    );
  }

  const pending = !showCustom && suggestion && suggestion !== dismissed ? suggestion : "";
  const useCustom = (value: string) => {
    const url = publicHttpsUrl(value);
    if (!url) return;
    onChange(url);
    setCustom("");
    setShowCustom(false);
    setDismissed("");
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px] shrink-0">
      {looking && <span className="text-slate-400">Finding a site…</span>}
      {pending && (
        <>
          <span className="text-slate-600">Is {siteLabel(pending)} right?</span>
          <button type="button" onClick={() => useCustom(pending)} className="font-bold text-[#059669] cursor-pointer">
            Yes
          </button>
          <button
            type="button"
            onClick={() => {
              setDismissed(pending);
              setCustom("");
              setShowCustom(true);
            }}
            className="font-bold text-slate-400 cursor-pointer"
          >
            Other
          </button>
        </>
      )}
      {(showCustom || (!pending && !looking && saved && !companyUrl)) && (
        <form
          className="inline-flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            useCustom(custom);
          }}
        >
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="google.com"
            aria-label="Company site"
            className="w-28 text-[11px] px-2 py-1 rounded-lg border border-[#E2E8F0] bg-white focus:outline-none focus:border-[#059669]"
          />
          <button type="submit" className="font-bold text-[#059669] cursor-pointer">
            Use
          </button>
          {companyUrl && (
            <button
              type="button"
              onClick={() => {
                setShowCustom(false);
                setCustom("");
              }}
              className="font-bold text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
          )}
        </form>
      )}
    </span>
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
  const [sampleWorkAddSignal, setSampleWorkAddSignal] = useState(0);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!addMenuOpen) return;
    const close = (event: MouseEvent) => {
      if (!addMenuRef.current?.contains(event.target as Node)) setAddMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAddMenuOpen(false);
    };
    document.addEventListener("mousedown", close, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [addMenuOpen]);
  useEffect(() => {
    if (!headerMenuOpen) return;
    const close = (event: MouseEvent) => {
      if (!headerMenuRef.current?.contains(event.target as Node)) setHeaderMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHeaderMenuOpen(false);
    };
    document.addEventListener("mousedown", close, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [headerMenuOpen]);
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
  const [entryReady, setEntryReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [vaultChecked, setVaultChecked] = useState(false);
  const [signInRequested, setSignInRequested] = useState(false);
  const [dockExpanded, setDockExpanded] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [sourcePasteOpen, setSourcePasteOpen] = useState(false);
  const [sourceNotice, setSourceNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [importNotice, setImportNotice] = useState("");
  const [sectionToRemove, setSectionToRemove] = useState<"summary" | "highlights" | null>(null);
  const [chapterToRemove, setChapterToRemove] = useState<{ id: string; company: string } | null>(null);
  const [undoNotice, setUndoNotice] = useState<
    | { kind: "skill"; index: number; value: string }
    | { kind: "highlight"; index: number; value: string }
    | { kind: "achievement"; milestoneId: string; index: number; value: string }
    | null
  >(null);
  const [proofToRemove, setProofToRemove] = useState<{
    milestoneId: string;
    kind: "verification" | "document";
    id: string;
    label: string;
  } | null>(null);
  const replaceSourceRef = useRef(false);
  const undoTimerRef = useRef<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [publishedSnapshot, setPublishedSnapshot] = useState<DossierSnapshot | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [isReplayingProof, setIsReplayingProof] = useState(false);
  const skipNextAutosaveRef = useRef(true);
  const restoredDraftRef = useRef(false);
  const pendingReviewRef = useRef(false);
  const sessionDraftRef = useRef(false);
  const autosaveAbortRef = useRef<AbortController | null>(null);
  const loggingOutRef = useRef(false);
  const publishedSnapshotRef = useRef<DossierSnapshot | null>(null);
  const editorPayloadRef = useRef<DossierSnapshot | null>(null);
  const serverDraftRef = useRef(false);

  const rememberPublished = (next: DossierSnapshot | null) => {
    publishedSnapshotRef.current = next;
    setPublishedSnapshot(next);
  };

  // Peer Corroboration Modal State
  const [isVerifyHubOpen, setIsVerifyHubOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isArtifactModalOpen, setIsArtifactModalOpen] = useState(false);
  const [isCorpEmailModalOpen, setIsCorpEmailModalOpen] = useState(false);
  const [artifactScanError, setArtifactScanError] = useState<string | null>(null);
  const returnToVerifyHubRef = useRef(false);
  const removedProofIdsRef = useRef(new Set<string>());
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
  bindStudioAccount(user?.id ?? null);
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
              const linkedinSub = user.user_metadata?.sub || user.id;
              const linkedin = nextContact.linkedin || savedRec?.contact?.linkedin || "";
              if (savedRec?.handle && linkedin) {
                const identity = { ...nextContact, linkedin, linkedinVerified: true };
                writeStudioRecord(STUDIO_SAVED_KEY, withIdentity(savedRec, { ...savedRec.contact, ...identity }, linkedinSub));
                const draftRec = readStudioRecord<any>(STUDIO_DRAFT_KEY);
                if (draftRec) writeStudioRecord(STUDIO_DRAFT_KEY, withIdentity(draftRec, { ...draftRec.contact, ...identity }, linkedinSub));
                const current = publishedSnapshotRef.current;
                if (current) {
                  const next = withIdentity(current, { ...(current.contact || {}), ...identity }, linkedinSub);
                  publishedSnapshotRef.current = next;
                  setPublishedSnapshot(next);
                }
                void patchVaultIdentity({
                  handle: String(savedRec.handle).toLowerCase().trim(),
                  linkedin,
                  linkedinVerified: true,
                  linkedinSub
                });
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studioPlanRef = useRef<StudioActionPlan | null>(null);

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
    highlights: savedHighlights(highlights),
    portfolioAssets,
    milestones: savedChapters(milestones)
  });
  editorPayloadRef.current = buildPortfolioPayload();

  const persistPortfolioLocally = (saved: boolean, payload = buildPortfolioPayload()) => {
    if (loggingOutRef.current) return;
    if (user && !vaultChecked) return;
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
    if (Array.isArray(parsed.skills)) setSkills(repairSkillList(parsed.skills));
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

  const publishedBaseline = (parsed: any): DossierSnapshot => ({
    ...parsed,
    skills: Array.isArray(parsed?.skills) ? repairSkillList(parsed.skills) : parsed?.skills,
    highlights: Array.isArray(parsed?.highlights) ? parsed.highlights.map((line: unknown) => String(line || "")) : parsed?.highlights,
    milestones: Array.isArray(parsed?.milestones)
      ? incomingChapters(parsed.milestones).map((milestone) => packChapter(milestone))
      : parsed?.milestones
  });

  useEffect(() => {
    if (!isPortfolioSaved) return;
    const saved = readStudioRecord<DossierSnapshot>(STUDIO_SAVED_KEY);
    const currentHandle = String(saved?.handle || handle || "").toLowerCase().trim();
    if (saved?.handle && !publishedSnapshotRef.current) rememberPublished(saved);
    const baselineAtStart = publishedSnapshotRef.current;
    if (currentHandle.length < 2) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/vault?handle=${encodeURIComponent(currentHandle)}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!data?.handle || cancelled) return;
        if (String(data.handle).toLowerCase().trim() !== currentHandle) return;
        const baseline = publishedBaseline(data);
        if (cancelled) return;
        if (baselineAtStart && publishedSnapshotRef.current !== baselineAtStart) return;
        rememberPublished(baseline);
        writeStudioRecord(STUDIO_SAVED_KEY, baseline);
      } catch {
        // The local saved copy remains the comparison baseline.
      }
    })();
    return () => {
      cancelled = true;
    };
    // The live handle is fixed once the page exists. A draft handle edit must not swap the baseline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPortfolioSaved]);

  useEffect(() => {
    if (!user) return;
    const vaultTimer = window.setTimeout(() => setVaultChecked(true), 8000);
    let cancelled = false;
    const adoptServerDraft = async () => {
      const draftRes = await fetch("/api/vault/draft", { credentials: "include" });
      if (!draftRes.ok || cancelled) return false;
      const body = await draftRes.json().catch(() => null);
      const payload = body?.payload;
      if (!payload || typeof payload !== "object" || !hasPortfolioContent(payload) || cancelled) return false;
      skipNextAutosaveRef.current = true;
      serverDraftRef.current = true;
      sessionDraftRef.current = false;
      applyPortfolioRecord(payload);
      writeStudioRecord(STUDIO_DRAFT_KEY, payload);
      discardSessionStudioRecords();
      return true;
    };
    (async () => {
      try {
        const res = await fetch("/api/vault?mine=1", { credentials: "include" });
        if (cancelled) return;
        if (!res.ok) {
          if (res.status === 404) {
            rememberPublished(null);
            setIsPortfolioSaved(false);
          }
          if (!pendingReviewRef.current) {
            const adopted = await adoptServerDraft();
            if (!adopted && !cancelled) {
              const owned = readStudioRecord<DossierSnapshot>(STUDIO_DRAFT_KEY);
              if (owned && hasPortfolioContent(owned)) {
                skipNextAutosaveRef.current = true;
                sessionDraftRef.current = false;
                applyPortfolioRecord(owned);
                discardSessionStudioRecords();
              } else if (sessionDraftRef.current && editorPayloadRef.current) {
                writeStudioRecord(STUDIO_DRAFT_KEY, editorPayloadRef.current);
                discardSessionStudioRecords();
                sessionDraftRef.current = false;
              }
            }
          }
          if (!cancelled) setVaultChecked(true);
          return;
        }
        const data = await res.json();
        if (!data?.handle || cancelled) {
          if (!cancelled) {
            rememberPublished(null);
            setIsPortfolioSaved(false);
          }
          if (!pendingReviewRef.current) {
            const adopted = await adoptServerDraft();
            if (!adopted && !cancelled) {
              const owned = readStudioRecord<DossierSnapshot>(STUDIO_DRAFT_KEY);
              if (owned && hasPortfolioContent(owned)) {
                skipNextAutosaveRef.current = true;
                sessionDraftRef.current = false;
                applyPortfolioRecord(owned);
                discardSessionStudioRecords();
              } else if (sessionDraftRef.current && editorPayloadRef.current) {
                writeStudioRecord(STUDIO_DRAFT_KEY, editorPayloadRef.current);
                discardSessionStudioRecords();
                sessionDraftRef.current = false;
              }
            }
          }
          if (!cancelled) setVaultChecked(true);
          return;
        }
        const baseline = publishedBaseline(data);
        rememberPublished(baseline);
        writeStudioRecord(STUDIO_SAVED_KEY, baseline);
        setIsPortfolioSaved(true);
        if (pendingReviewRef.current) {
          const liveContact = {
            email: String(data.contact?.email || ""),
            phone: String(data.contact?.phone || ""),
            linkedin: String(data.contact?.linkedin || ""),
            location: String(data.contact?.location || ""),
            emailVerified: Boolean(data.contact?.emailVerified),
            phoneVerified: Boolean(data.contact?.phoneVerified),
            linkedinVerified: Boolean(data.contact?.linkedinVerified)
          };
          setHandle((current) => String(data.handle || "").toLowerCase().trim() || current.trim());
          setFullName((current) => String(data.fullName || "").trim() || current.trim());
          setContact((current) => mergeReplacedContact(liveContact, current));
          setPortfolioAssets((current) =>
            current.length > 0 || !Array.isArray(data.portfolioAssets) ? current : data.portfolioAssets
          );
          if (Array.isArray(data.milestones)) {
            const liveChapters = incomingChapters(data.milestones);
            setMilestones((current) => replaceResumeChapters(liveChapters, current));
          }
          skipNextAutosaveRef.current = true;
          setSaveStatus("saved");
          if (!cancelled) setVaultChecked(true);
          return;
        }
        const draftRes = await fetch("/api/vault/draft", { credentials: "include" });
        if (cancelled) return;
        if (draftRes.ok) {
          const body = await draftRes.json().catch(() => null);
          const payload = body?.payload;
          const draftHandle = String(body?.handle || payload?.handle || "").toLowerCase().trim();
          const samePage = !draftHandle || draftHandle === String(data.handle).toLowerCase().trim();
          if (payload && typeof payload === "object" && samePage) {
            const carried = keepPublishedIdentity(payload, baseline);
            skipNextAutosaveRef.current = true;
            serverDraftRef.current = true;
            sessionDraftRef.current = false;
            applyPortfolioRecord(carried);
            writeStudioRecord(STUDIO_DRAFT_KEY, carried);
            discardSessionStudioRecords();
            setSaveStatus("saved");
            setVaultChecked(true);
            return;
          }
        }
        const local = readStudioRecord<DossierSnapshot>(STUDIO_DRAFT_KEY);
        if (local && hasPortfolioContent(local) && hasUnpublishedChanges(baseline, local)) {
          const carried = keepPublishedIdentity(local, baseline);
          skipNextAutosaveRef.current = true;
          sessionDraftRef.current = false;
          applyPortfolioRecord(carried);
          writeStudioRecord(STUDIO_DRAFT_KEY, carried);
          discardSessionStudioRecords();
          setSaveStatus("saving");
          const put = await fetch("/api/vault/draft", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ handle: data.handle, payload: carried })
          });
          serverDraftRef.current = put.ok;
          if (!cancelled) setSaveStatus(put.ok ? "saved" : "error");
        } else if (sessionDraftRef.current || !hasUnpublishedChanges(baseline, editorPayloadRef.current)) {
          skipNextAutosaveRef.current = true;
          serverDraftRef.current = false;
          sessionDraftRef.current = false;
          applyPortfolioRecord(baseline);
          writeStudioRecord(STUDIO_DRAFT_KEY, baseline);
          discardSessionStudioRecords();
          setSaveStatus("saved");
        } else {
          skipNextAutosaveRef.current = true;
          setSaveStatus("saved");
        }
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
          text: "Save and publish first. Verification starts after this page is live."
        }
      ]);
      return;
    }
    persistPortfolioLocally(false);
    onReady();
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

  useEffect(() => {
    if (!isVerifyHubOpen || !targetMilestone?.id) return;
    const milestoneId = targetMilestone.id;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/vault?mine=1", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const fresh = Array.isArray(data.milestones)
          ? data.milestones.find((milestone: Milestone) => milestone.id === milestoneId)
          : null;
        if (!fresh || cancelled) return;
        const mergeFreshProof = <T extends { id?: string; artifacts?: unknown[]; verifications?: unknown[] }>(chapters: T[]) =>
          chapters.map((milestone) => {
            if (milestone.id !== milestoneId) return milestone;
            return {
              ...milestone,
              artifacts: mergeChapterProof((milestone.artifacts || []) as { id?: string }[], fresh.artifacts || [], removedProofIdsRef.current),
              verifications: mergeChapterProof((milestone.verifications || []) as { id?: string }[], fresh.verifications || [], removedProofIdsRef.current)
            };
          });
        setMilestones((prev) => mergeFreshProof(prev));
        setPublishedSnapshot((prev) => {
          if (!prev?.milestones) return prev;
          const next = { ...prev, milestones: mergeFreshProof(prev.milestones) };
          publishedSnapshotRef.current = next;
          return next;
        });
      } catch {
        // The open window still shows whatever proof is already on the chapter.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isVerifyHubOpen, targetMilestone?.id]);


  const applyReplacedSource = (data: any) => {
    const incoming = incomingChapters(data.milestones);
    setMilestones((current) => replaceResumeChapters(current, incoming));
    setSummaryStatement(String(data.summaryStatement || ""));
    setSummaryEditor(Boolean(String(data.summaryStatement || "").trim()));
    setHighlights(Array.isArray(data.highlights) ? data.highlights.map((line) => String(line || "")) : []);
    setSkills(Array.isArray(data.skills) ? repairSkillList(data.skills) : []);
    setEducation(Array.isArray(data.education) ? data.education : []);
    setHeadline(String(data.headline || ""));
    setFullName((current) => current.trim() || String(data.fullName || ""));
    setContact((prev) => mergeReplacedContact(prev, data.contact));
    setPortfolioStarted(true);
    setActiveTab("canvas");
    setSourcePasteOpen(false);
  };

  const executeIngest = async (text: string) => {
    setIsProcessing(true);
    if (replaceSourceRef.current) setSourceNotice(null);
    else setImportNotice("");
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

      const data = await res.json().catch(() => ({}));
      if (res.ok && resumeImportHasContent(data)) {
        if (replaceSourceRef.current) {
          replaceSourceRef.current = false;
          applyReplacedSource(data);
          captureEvent("resume_parsed", { source: "replace_paste", chapters: data.milestones?.length || 0 });
          setSourceNotice(null);
          window.setTimeout(() => document.getElementById("experience")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
          return true;
        }
        setImportNotice("");
        applyParsedResume(data, "studio_paste");
        captureEvent("resume_parsed", { source: "studio_paste", chapters: data.milestones?.length || 0 });
        setChatMessages([
          {
            sender: "ally",
            text: "Upload successful. Please review your resume below and edit as necessary. Once it looks good, save your portfolio to begin verification."
          }
        ]);
        return true;
      }
      const message = typeof data.error === "string" ? data.error : "Could not read career chapters from that text.";
      if (replaceSourceRef.current) {
        replaceSourceRef.current = false;
        setSourceNotice({ text: message, error: true });
      } else {
        setImportNotice(message);
        setActiveTab("paste");
      }
      return false;
    } catch {
      if (replaceSourceRef.current) {
        replaceSourceRef.current = false;
        setSourceNotice({ text: "Could not read that text. Your draft is unchanged.", error: true });
      } else {
        setImportNotice("Could not read that text. Paste it again, or start from scratch.");
        setActiveTab("paste");
      }
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const startBlank = urlParams.get("scratch") === "1";
    if (urlParams.get("signin") === "1") setSignInRequested(true);
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
            const linkedinSub = user.user_metadata?.sub || user.id;
            const identity = { ...nextContact, linkedinVerified: true };
            if (draft && hasPortfolioContent(draft)) {
              writeStudioRecord(STUDIO_DRAFT_KEY, withIdentity(draft, { ...draft.contact, ...identity }, linkedinSub));
            }
            if (saved?.handle) {
              writeStudioRecord(STUDIO_SAVED_KEY, withIdentity(saved, { ...saved.contact, ...identity }, linkedinSub));
              const current = publishedSnapshotRef.current;
              if (current) {
                const next = withIdentity(current, { ...(current.contact || {}), ...identity }, linkedinSub);
                publishedSnapshotRef.current = next;
                setPublishedSnapshot(next);
              }
              void patchVaultIdentity({
                handle: String(saved.handle).toLowerCase().trim(),
                linkedin: identity.linkedin,
                linkedinVerified: true,
                linkedinSub
              });
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

    if (pendingRaw) {
      try {
        const parsed = JSON.parse(pendingRaw);
        localStorage.removeItem("vcv_pending_payload");

        if (resumeImportHasContent(parsed)) {
          pendingReviewRef.current = true;
          applyPortfolioRecord(parsed);
          console.info(JSON.stringify(resumeImportLog("pending_payload", parsed)));
          setChatMessages([
            {
              sender: "ally",
              text: "Upload successful. Please review your resume below and edit as necessary. Once it looks good, save your portfolio to begin verification."
            }
          ]);
        } else if (parsed.rawText && String(parsed.rawText).trim().length > 0) {
          setPasteBuffer(String(parsed.rawText));
          setActiveTab("paste");
          setImportNotice("Paste the resume text, then parse it. A contact line alone is not enough to start the page.");
        } else if (startBlank) {
          setPortfolioStarted(true);
        }
      } catch {
        // ignore unreadable local resume payloads
      }
    } else if (draft && hasPortfolioContent(draft)) {
      sessionDraftRef.current = true;
      applyPortfolioRecord(draft);
    } else if (draft && hasKeptIdentity(draft)) {
      if (draft.fullName) setFullName(String(draft.fullName));
      if (draft.handle) setHandle(String(draft.handle).toLowerCase().trim());
      if (draft.contact) {
        setContact((prev) => mergeReplacedContact(prev, draft.contact));
      }
      setChatMessages([
        {
          sender: "ally",
          text: "Loaded your draft portfolio. Review your chapters and save when ready."
        }
      ]);
    } else if (startBlank) {
      setPortfolioStarted(true);
    }

    if (startBlank) {
      window.history.replaceState({}, document.title, "/studio");
    }

    setEntryReady(true);

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
            const linkedinSub = data.profile.sub;
            const identity = { ...nextContact, linkedinVerified: true };
            if (draft && hasPortfolioContent(draft)) {
              writeStudioRecord(STUDIO_DRAFT_KEY, withIdentity(draft, { ...draft.contact, ...identity }, linkedinSub));
            }
            if (saved?.handle) {
              writeStudioRecord(STUDIO_SAVED_KEY, withIdentity(saved, { ...saved.contact, ...identity }, linkedinSub));
              const current = publishedSnapshotRef.current;
              if (current) {
                const next = withIdentity(current, { ...(current.contact || {}), ...identity }, linkedinSub);
                publishedSnapshotRef.current = next;
                setPublishedSnapshot(next);
              }
              void patchVaultIdentity({
                handle: String(saved.handle).toLowerCase().trim(),
                linkedin: identity.linkedin,
                email: identity.email,
                linkedinVerified: true,
                linkedinSub
              });
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
      highlights: savedHighlights(highlights),
      portfolioAssets,
      milestones: savedChapters(milestones)
    };
    if (!hasPortfolioContent(payload) && !isPortfolioSaved) return;
    const snapshotReady = Boolean(publishedSnapshotRef.current);
    if (restoredDraftRef.current && (!snapshotReady || !hasUnpublishedChanges(publishedSnapshotRef.current, payload))) {
      restoredDraftRef.current = false;
      skipNextAutosaveRef.current = false;
      setSaveStatus("saved");
      return;
    }
    if (skipNextAutosaveRef.current) {
      const pendingEdit = snapshotReady && hasUnpublishedChanges(publishedSnapshotRef.current, payload);
      skipNextAutosaveRef.current = false;
      if (!pendingEdit) {
        setSaveStatus("saved");
        return;
      }
    }
    persistPortfolioLocally(false, payload);

    if (!user || !vaultChecked) return;
    if (isPortfolioSaved && !snapshotReady) return;

    const dirty = !isPortfolioSaved || hasUnpublishedChanges(publishedSnapshotRef.current, payload);
    if (!dirty) {
      setSaveStatus("saved");
      if (!serverDraftRef.current) return;
      const timeout = setTimeout(() => {
        serverDraftRef.current = false;
        writeStudioRecord(STUDIO_DRAFT_KEY, publishedSnapshotRef.current);
        void fetch("/api/vault/draft", { method: "DELETE", credentials: "include" }).catch(() => undefined);
      }, 800);
      return () => clearTimeout(timeout);
    }

    setSaveStatus("saving");
    autosaveAbortRef.current?.abort();
    const controller = new AbortController();
    autosaveAbortRef.current = controller;
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/vault/draft", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ handle: payload.handle, payload }),
          signal: controller.signal
        });
        if (controller.signal.aborted) return;
        if (res.ok) serverDraftRef.current = true;
        setSaveStatus(res.ok ? "saved" : "error");
      } catch (err) {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) return;
        setSaveStatus("error");
      }
    }, 800);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [contact, education, fullName, handle, headline, highlights, isPortfolioSaved, milestones, portfolioAssets, preferredLayout, publishedSnapshot, skills, summaryStatement, user, vaultChecked]);

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
          const liveChapters = data.milestones as Milestone[];
          setMilestones((prev) => mergePeerVerifications(prev, liveChapters));
          setPublishedSnapshot((prev) => {
            if (!prev?.milestones) return prev;
            const next = { ...prev, milestones: mergePeerVerifications(prev.milestones, liveChapters) };
            publishedSnapshotRef.current = next;
            return next;
          });
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


  const applyParsedResume = (data: {
    milestones?: unknown[];
    fullName?: string;
    headline?: string;
    summaryStatement?: string;
    highlights?: unknown[];
    skills?: unknown[];
    education?: unknown[];
    contact?: {
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      emailVerified?: boolean;
      phoneVerified?: boolean;
      linkedinVerified?: boolean;
    };
  }, source: string) => {
    const milestonesIn = incomingChapters(data.milestones);
    const highlightsIn = Array.isArray(data.highlights) ? data.highlights.map((line) => String(line || "")) : [];
    const skillsIn = Array.isArray(data.skills) ? repairSkillList(data.skills) : [];
    const educationIn = Array.isArray(data.education) ? data.education as EducationRecord[] : [];
    setMilestones((current) => replaceResumeChapters(current, milestonesIn));
    setFullName((current) => current.trim() || String(data.fullName || ""));
    setHeadline(String(data.headline || ""));
    setSummaryStatement(String(data.summaryStatement || ""));
    setHighlights(highlightsIn);
    setSkills(skillsIn);
    setEducation(educationIn);
    setContact((prev) => mergeReplacedContact(prev, data.contact));
    setPortfolioStarted(true);
    setActiveTab("canvas");
    console.info(JSON.stringify(resumeImportLog(source, {
      milestones: milestonesIn,
      skills: skillsIn,
      highlights: highlightsIn,
      contact: data.contact
    })));
  };

  const clearCanvas = () => {
    console.info(JSON.stringify({
      event: "clear_canvas",
      experienceCount: milestones.length,
      achievementCount: milestones.reduce((count, milestone) => count + (milestone.claims?.length || 0), 0),
      skillCount: skills.length,
      highlightCount: highlights.length,
      hasEmail: Boolean(contact.email?.trim()),
      hasPhone: Boolean(contact.phone?.trim()),
      hasLinkedIn: Boolean(contact.linkedin?.trim()),
      hasLocation: Boolean(contact.location?.trim()),
      serverDraft: serverDraftRef.current
    }));
    const keptChapters = milestones.filter((chapter) => chapterHasProof(chapter));
    const reduced = {
      handle: handle.toLowerCase().trim(),
      email: contact.email,
      fullName,
      headline: "",
      summaryStatement: "",
      contact,
      skills: [],
      education: [],
      preferredLayout,
      highlights: [],
      portfolioAssets: [],
      milestones: savedChapters(keptChapters)
    };
    setMilestones(keptChapters);
    setSummaryStatement("");
    setHighlights([]);
    setSkills([]);
    setEducation([]);
    setPortfolioAssets([]);
    setHeadline("");
    setPasteBuffer("");
    setSourceNotice(null);
    autosaveAbortRef.current?.abort();
    setPortfolioStarted(keptChapters.length > 0);
    setSaveStatus("idle");
    localStorage.removeItem("vcv_pending_payload");
    writeStudioRecord(STUDIO_DRAFT_KEY, reduced);
    const keepServerDraft = hasPortfolioContent(reduced);
    serverDraftRef.current = keepServerDraft;
    if (user && keepServerDraft) {
      void fetch("/api/vault/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ handle: reduced.handle, payload: reduced })
      }).then((res) => {
        console.info(JSON.stringify({ event: "clear_canvas_reset", draftDeleted: false, status: res.status }));
      }).catch(() => {
        console.info(JSON.stringify({ event: "clear_canvas_reset", draftDeleted: false }));
      });
    } else if (user) {
      void fetch("/api/vault/draft", { method: "DELETE", credentials: "include" })
        .then((res) => {
          console.info(JSON.stringify({ event: "clear_canvas_reset", draftDeleted: res.ok, status: res.status }));
        })
        .catch(() => {
          console.info(JSON.stringify({ event: "clear_canvas_reset", draftDeleted: false }));
        });
    } else {
      console.info(JSON.stringify({ event: "clear_canvas_reset", draftDeleted: false, localOnly: true }));
    }
    setActiveTab("canvas");
  };

  const handleManualPasteSubmit = async () => {
    if (!pasteBuffer.trim() || isProcessing) return;
    const imported = await executeIngest(pasteBuffer.trim());
    if (imported) setPasteBuffer("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || isProcessing) return;
    const replacing = replaceSourceRef.current;
    if (isWordResumeFile(file.name, file.type)) {
      replaceSourceRef.current = false;
      if (replacing) setSourceNotice({ text: WORD_RESUME_MESSAGE, error: true });
      else {
        setImportNotice(WORD_RESUME_MESSAGE);
        setActiveTab("paste");
      }
      return;
    }
    setIsProcessing(true);
    if (replacing) setSourceNotice(null);
    else setImportNotice("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && resumeImportHasContent(data)) {
        if (replacing) {
          replaceSourceRef.current = false;
          applyReplacedSource(data);
          captureEvent("resume_parsed", { source: "replace_upload", chapters: data.milestones?.length || 0 });
          setSourceNotice(null);
          window.setTimeout(() => document.getElementById("experience")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
          return;
        }
        setImportNotice("");
        applyParsedResume(data, "studio_upload");
        captureEvent("resume_parsed", { source: "studio_upload", chapters: data.milestones?.length || 0 });
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Parsed ${data.milestones?.length || 0} career chapters from ${file.name}. Review them, then save to publish your page.`
          }
        ]);
      } else if (replacing) {
        replaceSourceRef.current = false;
        setSourceNotice({ text: typeof data.error === "string" ? data.error : "Could not read that file. Your draft is unchanged.", error: true });
      } else {
        setImportNotice(typeof data.error === "string" ? data.error : "Could not read that file. Paste the resume text, or start from scratch.");
        setActiveTab("paste");
      }
    } catch {
      if (replacing) {
        replaceSourceRef.current = false;
        setSourceNotice({ text: "Could not read that file. Your draft is unchanged.", error: true });
      } else {
        setImportNotice("Could not read that file. Paste the resume text, or upload a PDF.");
        setActiveTab("paste");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionPrompt = (actionType: string) => {
    if (actionType === "verify_linkedin") {
      window.location.href = "/api/auth/linkedin?next=/studio";
      return;
    }
    if (actionType === "upload_resume") {
      fileInputRef.current?.click();
      say("Choose a PDF or a text resume. Paste a Word resume instead.");
      return;
    }
    if (actionType === "paste_resume") {
      setActiveTab("paste");
      say("Paste the resume text, then parse it into this page.");
      return;
    }
    if (actionType === "review_changes") {
      if (!changeSummary.hasChanges) {
        say("Your editor matches the live dossier.");
        return;
      }
      openReview();
      return;
    }
    if (actionType === "add_sample_work") {
      setSampleWorkOpen(true);
      setSampleWorkAddSignal((current) => current + 1);
      window.setTimeout(() => document.getElementById("work-samples")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      say("Sample work is open. Pick a type and the fields appear under it.");
      return;
    }
    if (actionType === "edit_summary") {
      if (!summaryStatement.trim()) setSummaryEditor(true);
      show("summary");
      window.setTimeout(() => document.getElementById("summary-text")?.focus(), 50);
      say(isPortfolioSaved ? "Summary is open. It stays in your draft until you publish." : "Summary is open. Write the short version of your work.");
      return;
    }
    if (actionType === "review_resume") {
      setChatMessages((prev) => [
        ...prev,
        { sender: "user", text: "Review & Edit Resume" },
        { sender: "ally", text: "Scroll through your career chapters. You can edit titles, dates, and claims. We recommend keeping only the most impactful, factual deliverables." }
      ]);
      return;
    }
    if (actionType === "save_portfolio") {
      setIsClaimModalOpen(true);
      say("Opening save now. Your page goes live after this.");
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

  const say = (text: string) => {
    setDockExpanded(true);
    setChatMessages((prev) => [...prev, { sender: "ally", text }]);
  };

  const show = (id: string) => {
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  };

  const sendEmailCode = async () => {
    setEmailVerifyError("");
    if (!contact.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      setEmailVerifyError("Enter a valid email first.");
      return "missing" as const;
    }
    const res = await fetch("/api/verify/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: contact.email })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setEmailCodeSent(true);
      say(`Check ${contact.email} for a 6-digit code.`);
      window.setTimeout(() => document.getElementById("email-code")?.focus(), 50);
      return "sent" as const;
    }
    setEmailVerifyError(data.error || "Could not send the email code.");
    say(data.error || "Could not send the email code.");
    return "error" as const;
  };

  const sendPhoneCode = async () => {
    setPhoneVerifyError("");
    if (!contact.phone.trim()) {
      setPhoneVerifyError("Enter a phone number first.");
      return "missing" as const;
    }
    const res = await fetch("/api/verify/phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ phone: contact.phone, handle })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      setPhoneCodeSent(true);
      say(`Check ${contact.phone} for a 6-digit SMS code.`);
      window.setTimeout(() => document.getElementById("phone-code")?.focus(), 50);
      return "sent" as const;
    }
    setPhoneVerifyError(data.error || "Could not send the SMS code.");
    say(data.error || "Could not send the SMS code.");
    return "error" as const;
  };

  const openNextStep = () => {
    const primary = studioPlanRef.current?.primary;
    if (!primary) return;
    handleActionPrompt(primary.id);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setDockExpanded(true);

    const query = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: query }]);
    setChatInput("");

    const studioMessage = interpretStudioMessage(query);
    if (studioMessage.type === "skills") {
      show("skills");
      if (studioMessage.skill) {
        const skill = studioMessage.skill;
        if (skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
          say(`${skill} is already on your skills.`);
          return;
        }
        setSkills((prev) => [...prev, skill]);
        say("Skills are open.");
        return;
      }
      window.setTimeout(() => document.getElementById("skill-input")?.focus(), 50);
      say("Skills are open. Type one in the field and press Add, or remove one with the ×.");
      return;
    }
    if (studioMessage.type === "sample_work") {
      setSampleWorkOpen(true);
      setSampleWorkAddSignal((current) => current + 1);
      window.setTimeout(() => document.getElementById("work-samples")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
      say("Sample work is open. Pick a type and the fields appear under it.");
      return;
    }
    if (studioMessage.type === "resume") {
      if (isPortfolioSaved) {
        setReplaceOpen(true);
        say("Replace resume keeps the live dossier until you publish.");
        return;
      }
      fileInputRef.current?.click();
      say("Choose a PDF or a text resume. Paste a Word resume instead.");
      return;
    }
    if (studioMessage.type === "education") {
      if (education.length) {
        show("education");
        say("Education is on the page. Each row is the school, degree, and year from your resume.");
        return;
      }
      say("Education appears when a resume includes a school. Upload one that lists it, or leave the section off.");
      return;
    }
    if (studioMessage.type === "summary") {
      if (!summaryStatement.trim()) setSummaryEditor(true);
      show("summary");
      window.setTimeout(() => document.getElementById("summary-text")?.focus(), 50);
      say(isPortfolioSaved ? "Summary is open. It stays in your draft until you publish." : "Summary is open. Write the short version of your work.");
      return;
    }
    if (studioMessage.type === "headline" || studioMessage.type === "name" || studioMessage.type === "location") {
      show("identity-card");
      if (studioMessage.type === "name") {
        window.setTimeout(() => document.getElementById("candidate-name")?.focus(), 50);
        say("Your name is ready at the top of the page.");
        return;
      }
      if (studioMessage.type === "headline") {
        window.setTimeout(() => document.getElementById("candidate-headline")?.focus(), 50);
        say("The headline is ready under your name.");
        return;
      }
      say("Location is on the contact row, next to LinkedIn.");
      return;
    }
    if (studioMessage.type === "highlights") {
      if (!highlights.length) setHighlights([""]);
      show("highlights");
      say(isPortfolioSaved ? "Highlights are open. Add a line in your draft." : "Highlights are open. Add a line here.");
      return;
    }
    if (studioMessage.type === "chapters") {
      if (studioMessage.create) addEmptyMilestone();
      show("experience");
      say(
        studioMessage.create
          ? isPortfolioSaved
            ? "A blank chapter is at the top of Experience. It stays in your draft until you publish."
            : "A blank chapter is at the top of Experience. Replace the company, title, and dates."
          : isPortfolioSaved
            ? "Experience is open. Edits stay in your draft until you publish."
            : "Experience is open. Edit the company, title, dates, and lines on each chapter."
      );
      return;
    }
    if (studioMessage.type === "layout") {
      if (sampleWorkOpen || portfolioAssets.length) {
        show("work-samples");
        say("Sample work can sit at the top or bottom of the dossier. The control is just above that section.");
        return;
      }
      say("That control appears after sample work is on the page. Ask me to add sample work.");
      return;
    }
    if (studioMessage.type === "identity") {
      show("identity-card");
      if (studioMessage.field === "email") {
        if (studioMessage.mode === "edit" || contact.emailVerified) {
          if (contact.emailVerified) setEditingVerifiedField("email");
          window.setTimeout(() => document.getElementById("contact-email")?.focus(), 50);
          say(
            contact.emailVerified
              ? "That email is already verified. Change it here and the check comes off until you verify the new address."
              : "The email field is ready. Update it, then I can send a code."
          );
          return;
        }
        requirePortfolioSaved(() => {
          void sendEmailCode().then((result) => {
            if (result === "missing") {
              document.getElementById("contact-email")?.focus();
              say("Enter an email in the contact row. I put the cursor there.");
            }
          });
        });
        return;
      }
      if (studioMessage.field === "phone") {
        if (studioMessage.mode === "edit" || contact.phoneVerified) {
          if (contact.phoneVerified) setEditingVerifiedField("phone");
          window.setTimeout(() => document.getElementById("contact-phone")?.focus(), 50);
          say(
            contact.phoneVerified
              ? "That phone is already verified. Change it here and the check comes off until you verify the new number."
              : "The phone field is ready. Update it, then I can send a code."
          );
          return;
        }
        requirePortfolioSaved(() => {
          void sendPhoneCode().then((result) => {
            if (result === "missing") {
              document.getElementById("contact-phone")?.focus();
              say("Enter a phone number in the contact row. I put the cursor there.");
            }
          });
        });
        return;
      }
      if (contact.linkedinVerified && studioMessage.mode === "edit") {
        setEditingVerifiedField("linkedin");
        window.setTimeout(() => document.getElementById("contact-linkedin")?.focus(), 50);
        say("The LinkedIn field is ready. Change the handle, then verify it again.");
        return;
      }
      if (contact.linkedinVerified) {
        say("LinkedIn is already confirmed. Use Edit on the contact row if the handle should change.");
        return;
      }
      requirePortfolioSaved(() => {
        setLinkedinVerifyError("");
        persistPortfolioLocally(false);
        captureEvent("linkedin_verify_clicked", { handle: handle.toLowerCase().trim() });
        say("Opening LinkedIn to confirm this profile.");
        window.location.href = "/api/auth/linkedin?next=/studio";
      });
      return;
    }
    if (studioMessage.type === "work_email") {
      requirePortfolioSaved(() => {
        const chapter = firstChapterWithoutColleague(milestones) || milestones[0];
        if (!chapter) {
          say("Add a company chapter first, then we can verify a work email.");
          return;
        }
        setTargetMilestone(chapter);
        show(chapter.id);
        openVerifyStep("corp");
        say(`Opening work-email verification for ${chapter.company}.`);
      });
      return;
    }
    if (studioMessage.type === "review") {
      const review = reviewResume({
        summary: summaryStatement,
        chapters: milestones.map((milestone) => ({ id: milestone.id, company: milestone.company, claims: milestone.claims }))
      });
      say(review.notes.join(" "));
      if (review.focusId === "summary") show("summary");
      else {
        setHighlightedMilestoneId(review.focusId);
        show(review.focusId);
      }
      return;
    }
    if (studioMessage.type === "document") {
      handleActionPrompt("attach_docs");
      return;
    }
    if (studioMessage.type === "colleague") {
      handleActionPrompt("invite_peers");
      return;
    }
    if (studioMessage.type === "review_changes") {
      handleActionPrompt("review_changes");
      return;
    }
    if (studioMessage.type === "save") {
      if (isPortfolioSaved) {
        say("Your portfolio is already live. Use Review changes when you want the live dossier to update.");
        return;
      }
      if (!hasPortfolioContent({ milestones, summaryStatement, highlights, portfolioAssets })) {
        say("Upload or paste a resume first, then I can save your portfolio.");
        return;
      }
      setIsClaimModalOpen(true);
      say("Opening save now. Your page goes live after this.");
      return;
    }
    if (studioMessage.type === "next") {
      openNextStep();
      return;
    }
    if (studioMessage.type === "help" || studioMessage.type === "unknown") {
      say(unknownStudioReply(studioPlanRef.current?.primary.label || "Save and publish", isPortfolioSaved));
      return;
    }

    const verificationAsk = interpretVerificationAsk(query, milestones);
    if (verificationAsk.status === "match") {
      const chapter = verificationAsk.chapter;
      requirePortfolioSaved(() => {
        setTargetMilestone(chapter);
        setHighlightedMilestoneId(chapter.id);
        document.getElementById(chapter.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
        setIsVerifyHubOpen(true);
        setChatMessages((prev) => [
          ...prev,
          { sender: "ally", text: `${chapter.company} is on your resume. Opening verification for that chapter.` }
        ]);
      });
      return;
    }
    if (verificationAsk.status === "missing") {
      const names = milestones.map((milestone) => milestone.company).filter(Boolean);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ally",
          text: names.length
            ? `I don't see ${verificationAsk.phrase} on your resume. Your chapters are ${names.join(", ")}.`
            : "Add a company chapter first, then we can verify it."
        }
      ]);
      return;
    }
    if (verificationAsk.status === "ambiguous") {
      const names = verificationAsk.chapters.map((chapter) => chapter.company).filter(Boolean);
      setChatMessages((prev) => [
        ...prev,
        { sender: "ally", text: `That could be ${names.join(" or ")}. Which chapter should we verify?` }
      ]);
      return;
    }
    if (verificationAsk.status === "next") {
      openNextStep();
      return;
    }

    say(unknownStudioReply(studioPlanRef.current?.primary.label || "Save and publish", isPortfolioSaved));
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
      highlights: savedHighlights(highlights),
      portfolioAssets,
      milestones: savedChapters(milestones)
    };

    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json", [EXPLICIT_PUBLISH_HEADER]: "1" },
        credentials: "include",
        body: JSON.stringify({ ...dossierPayload, explicitPublish: true })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        skipNextAutosaveRef.current = true;
        rememberPublished(dossierPayload);
        serverDraftRef.current = false;
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
    const snapshot = publishedSnapshotRef.current;
    if (!isPortfolioSaved || !handle || !snapshot) return;
    const proofMilestones = overlayChapterProof(snapshot.milestones || [], updatedMilestones);
    const proofPayload = {
      ...snapshot,
      handle: handle.toLowerCase().trim(),
      milestones: savedChapters(proofMilestones)
    };
    const draftPayload = {
      ...buildPortfolioPayload(),
      milestones: savedChapters(updatedMilestones)
    };
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json", [EXPLICIT_PUBLISH_HEADER]: "1" },
        credentials: "include",
        body: JSON.stringify({ ...proofPayload, explicitPublish: true })
      });
      if (!res.ok) return;
      rememberPublished(proofPayload);
      writeStudioRecord(STUDIO_SAVED_KEY, proofPayload);
      writeStudioRecord(STUDIO_DRAFT_KEY, draftPayload);
      if (hasUnpublishedChanges(proofPayload, draftPayload)) {
        const draftRes = await fetch("/api/vault/draft", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ handle: proofPayload.handle, payload: draftPayload })
        });
        if (draftRes.ok) serverDraftRef.current = true;
      } else {
        serverDraftRef.current = false;
      }
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
      const baseline = publishedBaseline(record);
      rememberPublished(baseline);
      applyPortfolioRecord(baseline);
      writeStudioRecord(STUDIO_SAVED_KEY, baseline);
      const draftRes = await fetch("/api/vault/draft", { credentials: "include" });
      if (draftRes.ok) {
        const body = await draftRes.json().catch(() => null);
        const payload = body?.payload;
        const draftHandle = String(body?.handle || payload?.handle || "").toLowerCase().trim();
        if (payload && typeof payload === "object" && (!draftHandle || draftHandle === claimed)) {
          serverDraftRef.current = true;
          applyPortfolioRecord(payload);
          writeStudioRecord(STUDIO_DRAFT_KEY, payload);
        } else {
          serverDraftRef.current = false;
          writeStudioRecord(STUDIO_DRAFT_KEY, baseline);
        }
      } else {
        serverDraftRef.current = false;
        writeStudioRecord(STUDIO_DRAFT_KEY, baseline);
      }
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

  const scheduleUndo = (
    next:
      | { kind: "skill"; index: number; value: string }
      | { kind: "highlight"; index: number; value: string }
      | { kind: "achievement"; milestoneId: string; index: number; value: string }
  ) => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setUndoNotice(next);
    undoTimerRef.current = window.setTimeout(() => {
      setUndoNotice(null);
      undoTimerRef.current = null;
    }, 6000);
  };

  const undoLastRemoval = () => {
    const current = undoNotice;
    if (!current) return;
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    setUndoNotice(null);
    if (current.kind === "skill") {
      setSkills((prev) => {
        const next = [...prev];
        next.splice(Math.min(current.index, next.length), 0, current.value);
        return next;
      });
      return;
    }
    if (current.kind === "highlight") {
      setHighlights((prev) => {
        const next = [...prev];
        next.splice(Math.min(current.index, next.length), 0, current.value);
        return next;
      });
      return;
    }
    setMilestones((prev) =>
      prev.map((milestone) => {
        if (milestone.id !== current.milestoneId) return milestone;
        const claims = [...milestone.claims];
        claims.splice(Math.min(current.index, claims.length), 0, current.value);
        return { ...milestone, claims };
      })
    );
  };

  const deleteClaimFromMilestone = (milestoneId: string, claimIndex: number) => {
    const value = milestones.find((milestone) => milestone.id === milestoneId)?.claims[claimIndex];
    if (value === undefined) return;
    setMilestones((prev) =>
      prev.map((milestone) => {
        if (milestone.id !== milestoneId) return milestone;
        return {
          ...milestone,
          claims: milestone.claims.filter((_, idx) => idx !== claimIndex)
        };
      })
    );
    scheduleUndo({ kind: "achievement", milestoneId, index: claimIndex, value });
  };

  const canPublish = hasPortfolioContent({ milestones, summaryStatement, highlights, portfolioAssets });

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    };
  }, []);

  const beginReplaceUpload = () => {
    replaceSourceRef.current = true;
    captureEvent("source_replace_confirmed", { source: "upload" });
    setReplaceOpen(false);
    setSourcePasteOpen(false);
    fileInputRef.current?.click();
  };

  const beginReplacePaste = () => {
    replaceSourceRef.current = true;
    captureEvent("source_replace_confirmed", { source: "paste" });
    setReplaceOpen(false);
    setSourcePasteOpen(true);
    window.setTimeout(() => document.getElementById("replace-source-paste")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
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

  const changeSummary = React.useMemo(() => {
    if (!isPortfolioSaved || !publishedSnapshot) {
      return { changes: [], overflow: 0, overflowLabel: "", hasChanges: false };
    }
    return summarizeDossierChanges(publishedSnapshot, buildPortfolioPayload());
  }, [contact, education, fullName, handle, headline, highlights, isPortfolioSaved, milestones, portfolioAssets, preferredLayout, publishedSnapshot, skills, summaryStatement]);

  const studioPlan = React.useMemo(
    () =>
      suggestStudioActions({
        hasLivePage: isPortfolioSaved,
        hasContent: hasPortfolioContent({ milestones, summaryStatement, highlights, portfolioAssets }),
        hasUnpublishedChanges: changeSummary.hasChanges,
        hasSummary: Boolean(summaryStatement.trim()),
        hasSampleWork: portfolioAssets.length > 0,
        canAskColleague: Boolean(firstChapterWithoutColleague(milestones)),
        nextStep: { id: nextVerifyStep.id, title: nextVerifyStep.title },
        suggestLinkedIn: Boolean(isPortfolioSaved && contact.emailVerified && !contact.linkedinVerified)
      }),
    [changeSummary.hasChanges, contact.emailVerified, contact.linkedinVerified, highlights, isPortfolioSaved, milestones, nextVerifyStep.id, nextVerifyStep.title, portfolioAssets, summaryStatement]
  );
  studioPlanRef.current = studioPlan;

  const hasReviewableContent = portfolioStarted || canPublish;
  const phase = resolveStudioPhase({
    authChecked,
    entryReady,
    vaultChecked,
    hasSession,
    signInRequested,
    hasReviewableContent,
    hasConfirmedLiveDossier: isPortfolioSaved,
    hasUnpublishedChanges: Boolean(publishedSnapshot) && changeSummary.hasChanges
  });
  const editorPhase = phase === "draft" || phase === "live" || phase === "live_dirty";
  const mobileChrome = studioMobileChrome(phase);

  useEffect(() => {
    if (phase !== "signed_out") return;
    router.replace("/");
  }, [phase, router]);

  const runStudioAction = (action: StudioAction) => {
    handleActionPrompt(action.id);
  };

  const retryDraftSave = async () => {
    if (!user) return;
    const payload = buildPortfolioPayload();
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/vault/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ handle: payload.handle, payload })
      });
      if (res.ok) serverDraftRef.current = true;
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
  };

  const openReview = () => {
    if (!changeSummary.hasChanges) return;
    setReviewError("");
    setCancelConfirmOpen(false);
    setReviewOpen(true);
  };

  const publishChanges = async () => {
    const snapshot = publishedSnapshotRef.current;
    if (!snapshot || !changeSummary.hasChanges) return;
    setReviewBusy(true);
    setReviewError("");
    try {
      const merged = publishDraft(snapshot, buildPortfolioPayload());
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json", [EXPLICIT_PUBLISH_HEADER]: "1" },
        credentials: "include",
        body: JSON.stringify({ ...merged, explicitPublish: true })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setReviewError(publishFailureMessage(body));
        return;
      }
      const keptEmail = body?.emailKept ? String(snapshot.contact?.email || snapshot.email || "") : "";
      const publishedRecord = keptEmail
        ? {
            ...merged,
            email: keptEmail,
            contact: {
              ...(merged.contact || {}),
              email: keptEmail,
              emailVerified: Boolean(snapshot.contact?.emailVerified)
            }
          }
        : merged;
      skipNextAutosaveRef.current = true;
      serverDraftRef.current = false;
      rememberPublished(publishedRecord);
      applyPortfolioRecord(publishedRecord);
      try {
        writeStudioRecord(STUDIO_SAVED_KEY, publishedRecord);
        writeStudioRecord(STUDIO_DRAFT_KEY, publishedRecord);
      } catch {
        // The live page is already updated. A full browser store must not look like a failed publish.
      }
      setSaveStatus("saved");
      setReviewOpen(false);
      setCancelConfirmOpen(false);
      if (typeof body?.emailNotice === "string" && body.emailNotice.trim()) say(body.emailNotice.trim());
      try {
        captureEvent("changes_published", { handle: handle.toLowerCase().trim() });
      } catch {
        // Analytics must not undo a publish that already succeeded.
      }
    } catch {
      setReviewError("Could not publish changes.");
    } finally {
      setReviewBusy(false);
    }
  };

  const restorePublishedEditor = (snapshot: DossierSnapshot) => {
    autosaveAbortRef.current?.abort();
    autosaveAbortRef.current = null;
    restoredDraftRef.current = true;
    skipNextAutosaveRef.current = true;
    serverDraftRef.current = false;
    applyPortfolioRecord(snapshot);
    setFullName(String(snapshot.fullName || ""));
    setHeadline(String(snapshot.headline || ""));
    setSummaryStatement(String(snapshot.summaryStatement || ""));
    setSummaryEditor(Boolean(String(snapshot.summaryStatement || "").trim()));
    if (snapshot.contact) {
      setContact({
        email: String(snapshot.contact.email || ""),
        phone: String(snapshot.contact.phone || ""),
        location: String(snapshot.contact.location || ""),
        linkedin: String(snapshot.contact.linkedin || ""),
        emailVerified: Boolean(snapshot.contact.emailVerified),
        phoneVerified: Boolean(snapshot.contact.phoneVerified),
        linkedinVerified: Boolean(snapshot.contact.linkedinVerified)
      });
    }
    writeStudioRecord(STUDIO_SAVED_KEY, snapshot);
    writeStudioRecord(STUDIO_DRAFT_KEY, snapshot);
    setSaveStatus("saved");
    setReviewError("");
    setReviewOpen(false);
    setCancelConfirmOpen(false);
  };

  const cancelChanges = async () => {
    const snapshot = publishedSnapshotRef.current;
    if (!snapshot) {
      setReviewError("Could not cancel changes.");
      return;
    }
    setReviewBusy(true);
    setReviewError("");
    const serverDraftKnown = serverDraftRef.current;
    try {
      if (user || serverDraftKnown) {
        const res = await fetch("/api/vault/draft", { method: "DELETE", credentials: "include" });
        if (draftDeleteBlocksCancel(res.status, serverDraftKnown)) {
          setReviewError("Could not cancel changes.");
          return;
        }
      }
      restorePublishedEditor(snapshot);
    } catch {
      if (serverDraftKnown) {
        setReviewError("Could not cancel changes.");
        return;
      }
      restorePublishedEditor(snapshot);
    } finally {
      setReviewBusy(false);
    }
  };

  const headerStatus = !isPortfolioSaved
    ? ""
    : saveStatus === "saving"
      ? "Saving…"
      : saveStatus === "error"
        ? "Couldn’t save draft"
        : !publishedSnapshot
          ? ""
          : changeSummary.hasChanges
            ? ""
            : "Live";

  return (
    <div className="h-dvh overflow-hidden bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col antialiased selection:bg-emerald-100">
      <header className="shrink-0 sticky top-0 z-50 bg-white border-b border-[#E2E8F0]">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 sm:px-6">
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

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {editorPhase && (canPublish || portfolioStarted) && !isPortfolioSaved && (
            <button
              type="button"
              onClick={clearCanvas}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors px-2 sm:px-3 py-1.5 cursor-pointer"
            >
              Start over
            </button>
          )}

          {editorPhase && isPortfolioSaved ? (
            <>
              {headerStatus && (
                <span className="text-[11px] font-semibold text-slate-500">{headerStatus}</span>
              )}
              {saveStatus === "error" && (
                <button
                  type="button"
                  onClick={() => void retryDraftSave()}
                  className="hidden text-xs font-bold text-[#0F172A] cursor-pointer md:inline"
                >
                  Retry
                </button>
              )}
              {changeSummary.hasChanges && (
                <button
                  type="button"
                  onClick={openReview}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Review changes
                </button>
              )}
              <div className="hidden md:flex items-center gap-2 sm:gap-3">
              <Link
                href={`/${handle.toLowerCase().trim()}`}
                target="_blank"
                aria-label="View live dossier"
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <span>View live dossier</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setReplaceOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E2E8F0] text-[#0F172A] text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replace resume</span>
              </button>
              <button
                type="button"
                onClick={logOut}
                className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
              >
                Log out
              </button>
              </div>
              {mobileChrome.liveOverflow && (
                <div ref={headerMenuRef} className="relative md:hidden">
                  <button
                    type="button"
                    aria-expanded={headerMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Page actions"
                    onClick={() => setHeaderMenuOpen((open) => !open)}
                    className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-slate-600 cursor-pointer"
                  >
                    Menu
                  </button>
                  {headerMenuOpen && (
                    <div role="menu" className="absolute right-0 top-full z-40 mt-1 w-48 rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-lg">
                      {saveStatus === "error" && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setHeaderMenuOpen(false);
                            void retryDraftSave();
                          }}
                          className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
                        >
                          Retry save
                        </button>
                      )}
                      <Link
                        href={`/${handle.toLowerCase().trim()}`}
                        target="_blank"
                        role="menuitem"
                        onClick={() => setHeaderMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC]"
                      >
                        View live dossier
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setHeaderMenuOpen(false);
                          setReplaceOpen(true);
                        }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
                      >
                        Replace resume
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setHeaderMenuOpen(false);
                          void logOut();
                        }}
                        className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-600 hover:bg-[#F8FAFC] cursor-pointer"
                      >
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            editorPhase && canPublish && (
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Save and publish
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
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md"
        className="hidden"
        onChange={handleFileUpload}
      />

      {mobileChrome.stickyPrimary && (
        <NextActionDock
          primary={studioPlan.primary}
          suggestions={studioPlan.suggestions}
          messages={chatMessages}
          input={chatInput}
          onInput={setChatInput}
          onSubmit={handleSendMessage}
          onAction={runStudioAction}
          expanded={dockExpanded}
          onToggle={() => setDockExpanded((open) => !open)}
          processing={isProcessing}
          note={isPortfolioSaved && changeSummary.hasChanges ? "Unpublished changes" : ""}
          mobileOnly={mobileChrome.stickyOnly}
        />
      )}

      <div className="flex-1 flex overflow-hidden min-h-0">
        <main className="min-h-0 flex-1 overflow-y-auto w-full">
          <div className="mx-auto max-w-5xl space-y-8 p-4 pb-24 antialiased sm:p-8 sm:pb-28 md:pb-44">
          {phase === "loading" || phase === "signed_out" || phase === "sign_in" ? (
            <p className="pt-16 text-center text-sm font-semibold text-slate-500">
              {phase === "signed_out" ? "Taking you to the start page…" : phase === "sign_in" ? "Sign in to open your portfolio." : "Opening your studio…"}
            </p>
          ) : phase === "empty" ? (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xs max-w-2xl mx-auto mt-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669] mx-auto">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-[#0F172A]">Upload your resume</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  You are signed in, and this page does not have a resume yet. Upload a PDF or paste the text. Word files need to be pasted.
                </p>
              </div>
              {importNotice && (
                <p className="text-xs font-semibold leading-relaxed text-amber-800">{importNotice}</p>
              )}

              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="hidden w-full md:inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  <span>{isProcessing ? "Analyzing..." : "Upload resume"}</span>
                </button>
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setActiveTab("paste")}
                    className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer disabled:opacity-50"
                  >
                    Paste resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortfolioStarted(true)}
                    className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
                  >
                    Start from scratch
                  </button>
                </div>
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
            <div className="flex flex-col gap-8">
              <nav
                aria-label="Resume sections"
                className="sticky top-0 z-20 -mx-4 px-4 sm:-mx-8 sm:px-8 py-2.5 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-[#E2E8F0] flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {[
                  { id: "identity-card", label: "You" },
                  ...(summaryStatement || summaryEditor ? [{ id: "summary", label: "Summary" }] : []),
                  ...(highlights.length > 0 ? [{ id: "highlights", label: "Highlights" }] : []),
                  { id: "experience", label: "Experience" },
                  { id: "skills", label: "Skills" },
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
                {sourceNotice?.error && (
                  <p className="text-[11px] font-semibold leading-relaxed text-amber-700">
                    {sourceNotice.text}
                  </p>
                )}
                {importNotice && (
                  <p className="text-[11px] font-semibold leading-relaxed text-amber-800">{importNotice}</p>
                )}
              </nav>

              {/* Candidate Identity & Contact Verification Strip */}
              {sourcePasteOpen && (
                <div id="replace-source-paste" className="scroll-mt-14 bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-3">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F172A]">Paste a new resume</h3>
                    <p className="text-xs text-slate-600">This replaces the resume text in your draft. Your live dossier stays as it is until you publish.</p>
                  </div>
                  <textarea
                    rows={8}
                    value={pasteBuffer}
                    onChange={(e) => setPasteBuffer(e.target.value)}
                    spellCheck={true}
                    autoCorrect="on"
                    lang="en"
                    placeholder="Paste resume text with contact headers and pipe-delimited experience chapters..."
                    className="w-full text-xs p-4 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-mono bg-[#F8FAFC] leading-relaxed"
                  />
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        replaceSourceRef.current = false;
                        setSourcePasteOpen(false);
                        setPasteBuffer("");
                      }}
                      className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#0F172A] cursor-pointer"
                    >
                      Keep my resume
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing || !pasteBuffer.trim()}
                      onClick={() => void handleManualPasteSubmit()}
                      className="px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? "Reading…" : "Use this text"}
                    </button>
                  </div>
                </div>
              )}

              <div id="identity-card" className="scroll-mt-14 bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <input
                      id="candidate-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Candidate Legal Name"
                      spellCheck={true}
                      className={`text-xl sm:text-2xl font-black text-[#0F172A] focus:outline-none border-b border-transparent focus:border-[#059669]`}
                    />
                    <input
                      id="candidate-headline"
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Professional Headline"
                      spellCheck={true}
                      className={`w-full text-xs sm:text-sm font-semibold text-slate-600 focus:outline-none border-b border-transparent focus:border-[#059669]`}
                    />
                  </div>

                  <div className="flex items-start self-start sm:self-auto">
                  {(!isPortfolioSaved || publishedSnapshot) && (
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                    isPortfolioSaved && !changeSummary.hasChanges
                      ? "bg-emerald-50 border-emerald-200 text-[#059669]"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isPortfolioSaved ? (changeSummary.hasChanges ? "Unpublished changes" : "Live") : "Not published"}</span>
                  </span>
                  )}
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
                        readOnly={contact.emailVerified && editingVerifiedField !== "email"}
                        onChange={(e) => {
                          setContact({ ...contact, email: e.target.value, emailVerified: false });
                          setEmailCodeSent(false);
                          setEditingVerifiedField(null);
                        }}
                        placeholder="Work Email"
                        className={`w-full text-xs bg-transparent focus:outline-none font-medium ${contact.emailVerified && editingVerifiedField !== "email" ? "cursor-default" : ""}`}
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
                        onClick={() => {
                          requirePortfolioSaved(() => {
                            void sendEmailCode();
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
                        readOnly={contact.phoneVerified && editingVerifiedField !== "phone"}
                        onChange={(e) => {
                          setContact({ ...contact, phone: e.target.value, phoneVerified: false });
                          setPhoneCodeSent(false);
                          setEditingVerifiedField(null);
                        }}
                        placeholder="Phone"
                        className={`w-full text-xs bg-transparent focus:outline-none font-medium ${contact.phoneVerified && editingVerifiedField !== "phone" ? "cursor-default" : ""}`}
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
                        onClick={() => {
                          requirePortfolioSaved(() => {
                            void sendPhoneCode();
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
                            persistPortfolioLocally(false);
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
                    saved
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
                      id="email-code"
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
                          persistPortfolioLocally(false, { ...buildPortfolioPayload(), contact: nextContact });
                          if (isPortfolioSaved) {
                            const ok = await patchVaultIdentity({
                              handle: handle.toLowerCase().trim(),
                              email: nextContact.email,
                              emailVerified: true
                            });
                            const snapshot = publishedSnapshotRef.current;
                            if (ok && snapshot) {
                              const next = withIdentity(snapshot, { ...(snapshot.contact || {}), email: nextContact.email, emailVerified: true });
                              rememberPublished(next);
                              writeStudioRecord(STUDIO_SAVED_KEY, next);
                            }
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
                      id="phone-code"
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
                          persistPortfolioLocally(false, { ...buildPortfolioPayload(), contact: nextContact });
                          if (isPortfolioSaved) {
                            const ok = await patchVaultIdentity({
                              handle: handle.toLowerCase().trim(),
                              phone: nextContact.phone,
                              phoneVerified: true
                            });
                            const snapshot = publishedSnapshotRef.current;
                            if (ok && snapshot) {
                              const next = withIdentity(snapshot, { ...(snapshot.contact || {}), phone: nextContact.phone, phoneVerified: true });
                              rememberPublished(next);
                              writeStudioRecord(STUDIO_SAVED_KEY, next);
                            }
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
                      onClick={() => setSectionToRemove("summary")}
                      className="text-[10px] font-bold text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    id="summary-text"
                    rows={4}
                    value={summaryStatement}
                    onChange={(e) => setSummaryStatement(e.target.value)}
                    spellCheck={true}
                    autoCorrect="on"
                    lang="en"
                    className={`w-full text-xs text-slate-700 leading-relaxed p-3.5 rounded-xl border border-[#E2E8F0] focus:outline-none font-sans resize-y bg-[#F8FAFC] focus:border-[#059669]`}
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
                        onClick={() => setSectionToRemove("highlights")}
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
                          onChange={(next) =>
                            setHighlights((prev) => prev.map((item, itemIndex) => (itemIndex === index ? next : item)))
                          }
                          className="flex-1 text-xs text-slate-700 leading-relaxed focus:outline-none font-sans bg-transparent"
                        />
                        <button
                          type="button"
                          aria-label="Remove highlight"
                          onClick={() => {
                            scheduleUndo({ kind: "highlight", index, value: line });
                            setHighlights((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                          }}
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
                <div className="pb-2 border-b border-[#E2E8F0]">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                    Experience ({milestones.length})
                  </h3>
                </div>

                <div className="space-y-6">
                  {milestones.map((milestone) => {
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
                      <div className="space-y-1 pb-2 border-b border-[#E2E8F0]/70">
                        <div className="flex items-start justify-between gap-3">
                          <div className="inline-flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <input
                            type="text"
                            value={milestone.company}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMilestones((prev) =>
                                prev.map((m) => (m.id === milestone.id ? { ...m, company: val } : m))
                              );
                            }}
                            placeholder="Company name"
                            spellCheck={true}
                            size={Math.max(milestone.company.trim().length, 12)}
                            className={`w-auto max-w-full font-black text-base text-[#0F172A] focus:outline-none border-b border-transparent [field-sizing:content] focus:border-[#059669]`}
                          />
                            <CompanySitePrompt
                              company={milestone.company}
                              companyUrl={milestone.companyUrl}
                              saved
                              onChange={(url) =>
                                setMilestones((prev) =>
                                  prev.map((item) => (item.id === milestone.id ? { ...item, companyUrl: url } : item))
                                )
                              }
                            />
                          </div>
                          <span className="group/proof relative inline-flex shrink-0">
                            <button
                              type="button"
                              onClick={() => openVerifyHub(milestone)}
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                                isPortfolioSaved
                                  ? "text-[#059669] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                                  : "text-slate-400 bg-slate-50 border border-slate-200"
                              }`}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Verification</span>
                            </button>
                            <span className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden w-56 rounded-lg bg-slate-900 px-3 py-2 text-left text-[10px] font-semibold leading-relaxed text-white shadow-xl group-hover/proof:block group-focus-within/proof:block">
                              {companyVerificationTooltip(
                                milestone.company,
                                milestone.verifications || [],
                                milestone.artifacts?.length || 0
                              ) || "Nothing checked for this chapter yet."}
                            </span>
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                          <input
                            type="text"
                            value={milestone.role}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMilestones((prev) =>
                                prev.map((m) => (m.id === milestone.id ? { ...m, role: val } : m))
                              );
                            }}
                            placeholder="Role title"
                            spellCheck={true}
                            size={Math.max(milestone.role.trim().length, 16)}
                            className={`min-w-0 w-auto max-w-full text-xs font-semibold text-slate-600 focus:outline-none border-b border-transparent [field-sizing:content] focus:border-[#059669]`}
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            <TenureEditor
                              value={milestone.period}
                              onChange={(period) =>
                                setMilestones((prev) =>
                                  prev.map((item) => (item.id === milestone.id ? { ...item, period } : item))
                                )
                              }
                              onCommit={() => setMilestones((prev) => sortChaptersByTenure(prev))}
                            />
                            <button
                              type="button"
                              onClick={() => setChapterToRemove({ id: milestone.id, company: milestone.company || "this chapter" })}
                              className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                              title="Remove chapter"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
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
                        Skills ({skills.length})
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
                      id="skill-input"
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
                          aria-label={`Remove ${skill}`}
                          onClick={() => {
                            scheduleUndo({ kind: "skill", index: idx, value: skill });
                            setSkills((prev) => prev.filter((_, i) => i !== idx));
                          }}
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
                {portfolioAssets.length > 0 && (
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
                )}
              <PortfolioStudioPanel
                assets={portfolioAssets}
                handle={handle}
                addSignal={sampleWorkAddSignal}
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
                <h3 className="font-black text-sm text-[#0F172A]">Verification for {targetMilestone.company}</h3>
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

              const checked = chapterProofItems(live.verifications || [], live.artifacts || []);
              const workEmailDone = hasWorkEmailProof(live.verifications || []);
              const documentDone = (live.artifacts || []).length > 0;
              const dropProof = (item: { id: string; kind: "verification" | "document" }) => {
                removedProofIdsRef.current.add(item.id);
                const updated = milestones.map((milestone) => {
                  if (milestone.id !== live.id) return milestone;
                  if (item.kind === "verification") {
                    return {
                      ...milestone,
                      verifications: (milestone.verifications || []).filter((record) => record.id !== item.id)
                    };
                  }
                  return {
                    ...milestone,
                    artifacts: (milestone.artifacts || []).filter((artifact) => artifact.id !== item.id)
                  };
                });
                setMilestones(updated);
                setProofToRemove(null);
                void updateVaultStore(updated);
              };

              return (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {checked.length === 0 && (
                      <p className="text-[11px] text-slate-500">Nothing checked for this chapter yet.</p>
                    )}
                    {checked.map((item) => (
                      <div key={`${item.kind}-${item.id}`} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2">
                        {proofToRemove?.id === item.id && proofToRemove.kind === item.kind ? (
                          <div className="space-y-2">
                            <p className="text-[11px] leading-relaxed text-slate-600">
                              Remove {item.label}? It will no longer count as proof on {live.company}.
                            </p>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setProofToRemove(null)}
                                className="text-[11px] font-bold text-slate-500 cursor-pointer"
                              >
                                Keep
                              </button>
                              <button
                                type="button"
                                onClick={() => dropProof(item)}
                                className="text-[11px] font-bold text-red-700 cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold text-[#0F172A]">{item.label}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setProofToRemove({
                                  milestoneId: live.id,
                                  kind: item.kind,
                                  id: item.id,
                                  label: item.label
                                })
                              }
                              className="text-[10px] font-bold text-slate-400 hover:text-red-600 cursor-pointer shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {!workEmailDone && (
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
                  )}

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

                  {!documentDone && (
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
                  )}

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

      {chapterToRemove && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Warning</p>
              <h3 className="font-black text-lg text-[#0F172A]">Remove {chapterToRemove.company}?</h3>
              <p className="text-xs leading-relaxed text-slate-600">
                {isPortfolioSaved
                  ? "This removes the chapter from your draft. Proof on it stays on your live dossier until you publish."
                  : "This removes the chapter from this page, including any proof attached to it."}
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setChapterToRemove(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#0F172A] cursor-pointer"
              >
                Keep chapter
              </button>
              <button
                type="button"
                onClick={() => {
                  setMilestones((prev) => prev.filter((item) => item.id !== chapterToRemove.id));
                  setChapterToRemove(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-red-700 text-xs font-bold cursor-pointer"
              >
                Remove chapter
              </button>
            </div>
          </div>
        </div>
      )}

      <ReviewChangesDialog
        open={reviewOpen && changeSummary.hasChanges}
        changes={changeSummary.changes}
        overflowLabel={changeSummary.overflowLabel}
        busy={reviewBusy}
        error={reviewError}
        confirmCancel={cancelConfirmOpen}
        onKeepEditing={() => {
          setReviewOpen(false);
          setCancelConfirmOpen(false);
          setReviewError("");
        }}
        onRequestCancel={() => {
          setReviewError("");
          setCancelConfirmOpen(true);
        }}
        onDismissCancel={() => {
          setCancelConfirmOpen(false);
          setReviewError("");
        }}
        onConfirmCancel={() => void cancelChanges()}
        onPublish={() => void publishChanges()}
      />

      {sectionToRemove && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="space-y-2">
              <h3 className="font-black text-lg text-[#0F172A]">
                {sectionToRemove === "summary" ? "Remove summary?" : "Remove highlights?"}
              </h3>
              <p className="text-xs leading-relaxed text-slate-600">
                {isPortfolioSaved
                  ? "This removes it from your draft. It stays on your live dossier until you publish."
                  : "This removes it from this page."}
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setSectionToRemove(null)}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#0F172A] cursor-pointer"
              >
                {sectionToRemove === "summary" ? "Keep summary" : "Keep highlights"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sectionToRemove === "summary") {
                    setSummaryStatement("");
                    setSummaryEditor(false);
                  } else {
                    setHighlights([]);
                  }
                  setSectionToRemove(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-red-700 text-xs font-bold cursor-pointer"
              >
                {sectionToRemove === "summary" ? "Remove summary" : "Remove highlights"}
              </button>
            </div>
          </div>
        </div>
      )}

      {replaceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="space-y-2">
              <h3 className="font-black text-lg text-[#0F172A]">Replace resume?</h3>
              <p className="text-xs leading-relaxed text-slate-600">
                This replaces the resume or pasted text in your draft. Your live dossier stays as it is until you publish. Publishing can remove chapters, and proof on removed chapters goes with them.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setReplaceOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#0F172A] cursor-pointer"
              >
                Keep my resume
              </button>
              <button
                type="button"
                onClick={beginReplacePaste}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#0F172A] cursor-pointer"
              >
                Paste text
              </button>
              <button
                type="button"
                onClick={beginReplaceUpload}
                className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-red-700 text-xs font-bold cursor-pointer"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {undoNotice && (
        <UndoBanner
          label={
            undoNotice.kind === "skill"
              ? "Skill removed"
              : undoNotice.kind === "highlight"
                ? "Highlight removed"
                : "Achievement removed"
          }
          onUndo={undoLastRemoval}
        />
      )}

      {/* SIGNUP & HANDLE CLAIM MODAL */}
      {(phase === "sign_in" || isClaimModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <VerifiedCVLogo className="w-6 h-6" />
                <h3 className="font-black text-sm text-[#0F172A]">{canPublish ? "Save and publish" : "Sign in"}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsClaimModalOpen(false);
                  setSignInRequested(false);
                }}
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
                After you save, this page goes live. Later edits stay private until you publish them.
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
                      <span>Save and publish</span>
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