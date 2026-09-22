"use client";

import { useState } from "react";
import { 
  X, 
  UserPlus, 
  Copy, 
  Check, 
  Loader2, 
  CheckSquare, 
  Square,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Achievement {
  id: string;
  raw_bullet: string;
  metric_summary?: string;
}

interface InviteCorroboratorModalProps {
  experienceId: string;
  companyName: string;
  roleTitle: string;
  achievements: Achievement[];
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteCorroboratorModal({
  experienceId,
  companyName,
  roleTitle,
  achievements,
  isOpen,
  onClose,
}: InviteCorroboratorModalProps) {
  const [relationship, setRelationship] = useState<"MANAGER" | "PEER" | "DIRECT_REPORT" | "CROSS_FUNCTIONAL">("MANAGER");
  const [targetName, setTargetName] = useState("");
  const [selectedAchievementIds, setSelectedAchievementIds] = useState<string[]>(
    achievements.map((a) => a.id) // Default: select all
  );
  const [allowExpansion, setAllowExpansion] = useState(true);
  const [loading, setLoading] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedAchievementIds.length === achievements.length) {
      setSelectedAchievementIds([]);
    } else {
      setSelectedAchievementIds(achievements.map((a) => a.id));
    }
  };

  const toggleAchievement = (id: string) => {
    setSelectedAchievementIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGenerateLink = async () => {
    if (selectedAchievementIds.length === 0) {
      setError("Please select at least one achievement to request corroboration on.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attest/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceId,
          primaryClaimId: selectedAchievementIds[0], // First selected is primary spotlight
          selectedClaimIds: selectedAchievementIds,
          allowExpansion,
          relationship,
          targetName: targetName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.shareableUrl) {
        setShareableUrl(data.shareableUrl);
        navigator.clipboard.writeText(data.shareableUrl);
        setCopied(true);
      } else {
        setError(data.error || "Could not generate link");
      }
    } catch (err: any) {
      setError("Failed to create corroboration invite link.");
    } finally {
      setLoading(false);
    }
  };

  const copyExisting = () => {
    if (shareableUrl) {
      navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Request Corroboration</h3>
              <p className="text-xs text-slate-500 font-medium">{roleTitle} • {companyName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {!shareableUrl ? (
            <>
              {/* Relationship Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  1. Who are you asking to corroborate?
                </label>
                <div className="grid grid-cols-2 gap-2 text-left">
                  <button
                    type="button"
                    onClick={() => setRelationship("MANAGER")}
                    className={`p-3 rounded-xl border text-xs text-left transition-all ${
                      relationship === "MANAGER"
                        ? "bg-emerald-50/80 border-emerald-500 text-emerald-900 shadow-2xs font-bold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Direct Manager</span>
                      <Badge className="bg-emerald-100 text-emerald-800 border-none text-[9px] px-1.5 py-0">Tier 3 (100%)</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-normal">Executive sign-off authority</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRelationship("PEER")}
                    className={`p-3 rounded-xl border text-xs text-left transition-all ${
                      relationship === "PEER"
                        ? "bg-emerald-50/80 border-emerald-500 text-emerald-900 shadow-2xs font-bold"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Colleague / Peer</span>
                      <Badge className="bg-slate-100 text-slate-700 border-none text-[9px] px-1.5 py-0">Tier 2 (85%)</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-normal">Teammate in same org</p>
                  </button>
                </div>
              </div>

              {/* Achievements Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    2. Select Achievements to Request Validation ({selectedAchievementIds.length}/{achievements.length})
                  </label>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    {selectedAchievementIds.length === achievements.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/40 max-h-48 overflow-y-auto">
                  {achievements.map((item) => {
                    const isChecked = selectedAchievementIds.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleAchievement(item.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-start gap-2.5 transition-all ${
                          isChecked 
                            ? "bg-white border-emerald-300 shadow-2xs" 
                            : "bg-white/60 border-slate-200 opacity-60"
                        }`}
                      >
                        <div className="mt-0.5 text-emerald-600">
                          {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </div>
                        <p className="text-slate-800 leading-snug line-clamp-2">{item.raw_bullet}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expansion Permission Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="expansionToggle"
                  checked={allowExpansion}
                  onChange={(e) => setAllowExpansion(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="expansionToggle" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
                  <span className="font-bold text-slate-900 block">Allow corroborator to vouch for other unselected achievements</span>
                  If enabled, any achievements you didn't highlight will appear as an optional checklist they can vouch for if they remember them.
                </label>
              </div>

              {/* Corroborator Name (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Corroborator Name (Optional)
                </label>
                <input
                  type="text"
                  value={targetName}
                  onChange={(e) => setTargetName(e.target.value)}
                  placeholder="e.g., Sarah Chen"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                  {error}
                </div>
              )}

              <Button
                onClick={handleGenerateLink}
                disabled={loading || selectedAchievementIds.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl text-xs shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Packet Link...
                  </>
                ) : (
                  "Create Corroboration Link & Copy"
                )}
              </Button>
            </>
          ) : (
            /* Link Ready State */
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Corroboration Link Ready!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Send this link to your {relationship.toLowerCase().replace("_", " ")}. They can corroborate your achievements at {companyName} in under a minute.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableUrl}
                  className="bg-transparent text-xs text-slate-600 flex-1 outline-hidden font-mono truncate"
                />
                <Button
                  size="sm"
                  onClick={copyExisting}
                  className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shrink-0 flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={onClose}
                className="text-xs text-slate-600 border-slate-200 hover:bg-slate-50 w-full"
              >
                Done
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}