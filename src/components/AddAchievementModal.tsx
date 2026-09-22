"use client";

import { useState } from "react";
import { 
  X, 
  PlusCircle, 
  Loader2, 
  TrendingUp, 
  Cpu, 
  Users, 
  Target,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Experience {
  id: string;
  company_name: string;
  title: string;
}

interface AddAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  experiences: Experience[];
  onAchievementAdded: (newClaim: any, experienceId: string) => void;
}

export default function AddAchievementModal({
  isOpen,
  onClose,
  experiences,
  onAchievementAdded,
}: AddAchievementModalProps) {
  const [selectedExpId, setSelectedExpId] = useState<string>(experiences[0]?.id || "");
  const [achievementText, setAchievementText] = useState("");
  const [metricSummary, setMetricSummary] = useState("");
  const [category, setCategory] = useState<"METRIC" | "ARCHITECTURE" | "LEADERSHIP" | "EXECUTION">("METRIC");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achievementText.trim()) {
      setError("Please enter the achievement details.");
      return;
    }
    if (!selectedExpId && experiences.length > 0) {
      setError("Please select the experience this achievement belongs to.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/vault/achievement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceId: selectedExpId,
          rawBullet: achievementText.trim(),
          metricSummary: metricSummary.trim() || undefined,
          category,
        }),
      });

      const data = await res.json();
      if (data.success && data.claim) {
        onAchievementAdded(data.claim, selectedExpId);
        onClose();
      } else {
        setError(data.error || "Failed to add achievement.");
      }
    } catch {
      setError("Network error adding achievement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Unlisted Achievement</h3>
              <p className="text-xs text-slate-500">Capture wins, shadow projects, and undocumented metrics</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Experience Picker */}
          {experiences.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Parent Experience *
              </label>
              <div className="relative">
                <select
                  value={selectedExpId}
                  onChange={(e) => setSelectedExpId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                >
                  {experiences.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.title} • {exp.company_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Achievement Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCategory("METRIC")}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  category === "METRIC"
                    ? "bg-blue-50 border-blue-400 text-blue-900 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                Metric & Growth
              </button>

              <button
                type="button"
                onClick={() => setCategory("ARCHITECTURE")}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  category === "ARCHITECTURE"
                    ? "bg-purple-50 border-purple-400 text-purple-900 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-purple-600" />
                Architecture & Tech
              </button>

              <button
                type="button"
                onClick={() => setCategory("LEADERSHIP")}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  category === "LEADERSHIP"
                    ? "bg-amber-50 border-amber-400 text-amber-900 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-amber-600" />
                Leadership & Scale
              </button>

              <button
                type="button"
                onClick={() => setCategory("EXECUTION")}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                  category === "EXECUTION"
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900 shadow-2xs"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                Execution & Launch
              </button>
            </div>
          </div>

          {/* Achievement Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              What did you deliver? (Operational Narrative) *
            </label>
            <textarea
              rows={3}
              value={achievementText}
              onChange={(e) => setAchievementText(e.target.value)}
              placeholder="e.g., Led zero-downtime migration of multi-tenant PostgreSQL to Citus cluster handling 15k QPS during peak seasonal traffic."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
            />
          </div>

          {/* Key Deliverable / Metric Isolation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Isolated Metric or Anchor Deliverable (Optional)
            </label>
            <input
              type="text"
              value={metricSummary}
              onChange={(e) => setMetricSummary(e.target.value)}
              placeholder="e.g., 15k QPS, 0 Downtime, $1.4M ARR"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl text-xs shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving to Vault...
                </>
              ) : (
                "Save Achievement to Vault"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}