"use client";

import { useState } from "react";
import { 
  X, 
  CheckCircle2, 
  Sparkles, 
  Loader2,
  ExternalLink,
  RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PendingRequest {
  id: string;
  company_name: string;
  target_name?: string;
  target_email?: string;
  relationship: string;
  created_at: string;
  reminder_count: number;
}

interface AllyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pendingRequests: PendingRequest[];
  onRefreshRequests: () => void;
}

export default function AllyDrawer({
  isOpen,
  onClose,
  pendingRequests,
  onRefreshRequests,
}: AllyDrawerProps) {
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendNudge = async (id: string) => {
    setRemindingId(id);
    setFeedback(null);
    try {
      const res = await fetch("/api/attest/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attestationId: id }),
      });
      const result = await res.json();
      if (result.success) {
        setFeedback(result.message);
        onRefreshRequests();
      } else {
        setFeedback(result.error || "Failed to send reminder.");
      }
    } catch {
      setFeedback("Network error sending reminder.");
    } finally {
      setRemindingId(null);
    }
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col antialiased font-sans animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#FAFAF9]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pith Ally</h3>
            <p className="text-[11px] text-slate-500">Dossier Strategist & Outbox</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Nudge Feedback Notice */}
        {feedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Section 1: Corroboration Outbox */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Corroboration Outbox ({pendingRequests.length})
            </h4>
            <span className="text-[11px] text-slate-400">Live Status</span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center space-y-1 bg-[#FBFBFA]">
              <p className="text-xs font-medium text-slate-600">No pending corroboration requests.</p>
              <p className="text-[11px] text-slate-400">Use "Request Corroboration" on any experience to invite a peer or manager.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => {
                const daysAgo = Math.floor(
                  (Date.now() - new Date(req.created_at).getTime()) / (1000 * 60 * 60 * 24)
                );
                const isStale = daysAgo >= 5;

                return (
                  <div 
                    key={req.id}
                    className={`p-4 rounded-xl border transition-all space-y-3 ${
                      isStale 
                        ? "bg-amber-50/40 border-amber-200" 
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {req.target_name || req.target_email || "Colleague"}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {req.relationship.replace("_", " ")} • {req.company_name}
                        </p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] font-semibold ${
                          isStale 
                            ? "bg-amber-100 text-amber-800 border-amber-300" 
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {isStale ? `${daysAgo}d pending (Stale)` : `${daysAgo}d ago`}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-400">
                        {req.reminder_count > 0 ? `${req.reminder_count} nudges sent` : "No nudges yet"}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={remindingId === req.id}
                        onClick={() => handleSendNudge(req.id)}
                        className="h-7 px-2.5 text-[11px] font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
                      >
                        {remindingId === req.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3 mr-1 text-slate-500" />
                            Send Nudge
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Proactive Coaching Strategies */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Dossier Optimization
          </h4>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <p className="text-xs font-bold text-slate-800">
              Target Tier 3 Leadership Sign-off
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Recruiters place the highest confidence on achievements verified by direct superiors. Securing one manager sign-off lifts your profile to Executive status.
            </p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-[#FAFAF9] text-center">
        <a 
          href="/gharris" 
          target="_blank"
          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center justify-center gap-1.5"
        >
          <span>Preview Public Trust Profile</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

    </aside>
  );
}