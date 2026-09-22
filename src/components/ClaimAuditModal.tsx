"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  Sparkles, 
  Send, 
  Loader2, 
  AlertCircle, 
  X, 
  BrainCircuit, 
  CheckCircle2,
  TrendingUp,
  Cpu,
  Users,
  Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Claim {
  id: string;
  raw_bullet: string;
  metric_summary: string;
  category: "METRIC" | "ARCHITECTURE" | "LEADERSHIP" | "EXECUTION";
  pith_fidelity_score: number;
  status: string;
}

interface ClaimAuditModalProps {
  claim: Claim;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  onScoreUpdated: (claimId: string, newScore: number, newStatus: string) => void;
}

interface AuditTurn {
  question: string;
  answer?: string;
  critique?: string;
  fidelity_delta?: number;
}

export default function ClaimAuditModal({
  claim,
  companyName,
  isOpen,
  onClose,
  onScoreUpdated,
}: ClaimAuditModalProps) {
  const [loading, setLoading] = useState(false);
  const [auditStarted, setAuditStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [answerInput, setAnswerInput] = useState<string>("");
  const [conversation, setConversation] = useState<AuditTurn[]>([]);
  const [isResolved, setIsResolved] = useState(false);
  const [fidelityScore, setFidelityScore] = useState(claim.pith_fidelity_score || 50);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const startAudit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/interrogate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId: claim.id }),
      });
      const result = await res.json();

      if (result.success && result.data) {
        setCurrentQuestion(result.data.question);
        setAuditStarted(true);
      } else {
        setErrorMsg(result.error || "Failed to initialize interrogation.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error starting audit.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answerInput.trim() || loading) return;

    setLoading(true);
    setErrorMsg(null);

    const activeQuestion = currentQuestion;
    const submittedAnswer = answerInput;
    setAnswerInput("");

    try {
      const res = await fetch("/api/interrogate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId: claim.id,
          answer: submittedAnswer,
        }),
      });

      const result = await res.json();

      if (result.success && result.data) {
        const turn: AuditTurn = {
          question: activeQuestion,
          answer: submittedAnswer,
          critique: result.data.critique,
          fidelity_delta: result.data.fidelity_delta,
        };

        setConversation((prev) => [...prev, turn]);

        if (result.data.fidelity_delta) {
          const updatedScore = Math.min(100, fidelityScore + result.data.fidelity_delta);
          setFidelityScore(updatedScore);
        }

        if (result.data.is_resolved) {
          setIsResolved(true);
          const finalScore = Math.min(100, fidelityScore + (result.data.fidelity_delta || 25));
          onScoreUpdated(claim.id, finalScore, "VERIFIED_AI");
        } else {
          setCurrentQuestion(result.data.question);
        }
      } else {
        setErrorMsg(result.error || "Failed to evaluate answer.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#10131B] border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#141822]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Forensic Interrogator
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px]">
                  Memory Linked
                </Badge>
              </h3>
              <p className="text-xs text-zinc-400">{companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Fidelity Score</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{fidelityScore}%</span>
            </div>
            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Claim Context Bar */}
        <div className="px-6 py-3 bg-[#0B0D13] border-b border-zinc-800/80">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            Target Claim
          </span>
          <p className="text-sm text-zinc-200 leading-snug font-medium italic">
            "{claim.raw_bullet}"
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-950/40 border border-red-500/50 flex items-center gap-2.5 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dialogue Scroll Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {!auditStarted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-bold text-base text-zinc-100">Initiate Forensic Verification</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Pith will cross-reference previously captured facts from {companyName} and probe the operational mechanics of this claim.
                </p>
              </div>
              <Button
                onClick={startAudit}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Querying Memory Graph...
                  </>
                ) : (
                  "Begin Audit"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Prior Conversation Turns */}
              {conversation.map((turn, i) => (
                <div key={i} className="space-y-2 text-sm">
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Pith Interrogator</span>
                    <p>{turn.question}</p>
                  </div>
                  {turn.answer && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-100 space-y-1 ml-6">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Your Defense</span>
                      <p>{turn.answer}</p>
                      {turn.fidelity_delta && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 mt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> +{turn.fidelity_delta}% Fidelity Delta Added
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Active Question or Resolution Banner */}
              {isResolved ? (
                <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-500/50 text-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h4 className="font-bold text-base text-white">Claim Structurally Audited</h4>
                  <p className="text-xs text-emerald-300 max-w-sm mx-auto">
                    Forensic probability confirmed. Durable organizational facts have been persisted to your perpetual candidate graph.
                  </p>
                  <Button 
                    onClick={onClose} 
                    className="mt-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Return to Vault
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 space-y-1.5 animate-in fade-in">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Active Inquiry</span>
                  <p className="text-sm font-medium leading-relaxed">{currentQuestion}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Bar (Only visible while active audit is ongoing) */}
        {auditStarted && !isResolved && (
          <div className="p-4 border-t border-zinc-800 bg-[#141822] flex gap-2">
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitAnswer();
                }
              }}
              placeholder="Provide technical specifics (stack, baseline, team, friction)..."
              className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
            />
            <Button
              onClick={submitAnswer}
              disabled={!answerInput.trim() || loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 shrink-0"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}