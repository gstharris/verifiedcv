"use client";

import { useState, useRef } from "react";
import { 
  ShieldCheck, 
  Upload, 
  EyeOff, 
  CheckCircle2, 
  Loader2, 
  CreditCard, 
  Award, 
  Tag, 
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ArtifactUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceId: string;
  companyName: string;
  onArtifactCommitted: (trustDelta: number, artifactType: string) => void;
}

const ARTIFACT_PRESETS = [
  { id: "EMPLOYEE_BADGE", label: "Employee Badge / Keycard", icon: CreditCard, maxDelta: "+15%" },
  { id: "BUSINESS_CARD", label: "Business Card", icon: Tag, maxDelta: "+10%" },
  { id: "INTERNAL_AWARD", label: "Award / Commendation", icon: Award, maxDelta: "+12%" },
  { id: "CONFERENCE_BADGE", label: "Event / Speaker Pass", icon: CreditCard, maxDelta: "+7%" },
];

export default function ArtifactUploadModal({
  isOpen,
  onClose,
  experienceId,
  companyName,
  onArtifactCommitted,
}: ArtifactUploadModalProps) {
  const [selectedType, setSelectedType] = useState("EMPLOYEE_BADGE");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [shaHash, setShaHash] = useState<string>("");
  const [committing, setCommitting] = useState(false);
  const [privacyConfirmed, setPrivacyConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAuditResult(null);
      setErrorMsg(null);
    }
  };

  const handleRunAudit = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("experienceId", experienceId);
    formData.append("artifactType", selectedType);
    formData.append("expectedCompany", companyName);

    try {
      const res = await fetch("/api/verify/artifact", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setAuditResult(data.audit);
        setShaHash(data.sha256Hash);
      } else {
        setErrorMsg(data.error || "OCR extraction was unable to identify credentials.");
      }
    } catch {
      setErrorMsg("Network error verifying artifact.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCommit = async () => {
    if (!auditResult || !privacyConfirmed) return;
    setCommitting(true);

    try {
      const res = await fetch("/api/verify/artifact/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceId,
          artifactType: selectedType,
          sha256Hash: shaHash,
          ocrData: auditResult,
          trustDelta: auditResult.suggestedTrustDelta,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onArtifactCommitted(auditResult.suggestedTrustDelta, selectedType);
        onClose();
      } else {
        setErrorMsg(data.error || "Could not save artifact to vault.");
      }
    } catch {
      setErrorMsg("Failed to commit artifact.");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Micro-Artifact Proof</h3>
              <p className="text-xs text-slate-500">{companyName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {/* Preset Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Artifact Type</label>
            <div className="grid grid-cols-2 gap-2">
              {ARTIFACT_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedType === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedType(preset.id);
                      setAuditResult(null);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-emerald-50/70 border-emerald-300 text-emerald-900 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-semibold">{preset.label}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                      {preset.maxDelta}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />

          {/* Upload Dropzone / Preview */}
          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 rounded-xl p-6 text-center cursor-pointer transition-all space-y-2"
            >
              <Upload className="w-6 h-6 mx-auto text-slate-400" />
              <p className="text-xs font-bold text-slate-800">
                Upload or snap a photo of this item
              </p>
              <p className="text-[11px] text-slate-400">
                JPG, PNG, or mobile camera capture. Private details are redacted.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-900/5 max-h-48 flex items-center justify-center p-2">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Artifact Preview"
                    className="max-h-44 object-contain rounded-lg shadow-2xs"
                  />
                )}
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setAuditResult(null);
                  }}
                  className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-bold px-2 py-1 rounded-md"
                >
                  Change
                </button>
              </div>

              {!auditResult && (
                <Button
                  onClick={handleRunAudit}
                  disabled={analyzing}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Scanning Artifact & Text Alignment...
                    </>
                  ) : (
                    "Inspect & Match Artifact"
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Forensic OCR Audit Result */}
          {auditResult && (
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Signal Matched (+{auditResult.suggestedTrustDelta}% Proof)
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                  Tamper Screen Passed
                </Badge>
              </div>

              <div className="text-xs space-y-1 text-slate-700 bg-white/70 p-3 rounded-lg border border-emerald-100">
                <p><strong className="text-slate-900">Entity Detected:</strong> {auditResult.detectedCompany || companyName}</p>
                {auditResult.detectedTitle && (
                  <p><strong className="text-slate-900">Title / Unit:</strong> {auditResult.detectedTitle}</p>
                )}
                {auditResult.datesFound && (
                  <p><strong className="text-slate-900">Date Range:</strong> {auditResult.datesFound}</p>
                )}
                <p className="text-[11px] text-slate-500 pt-1 leading-relaxed">
                  {auditResult.auditSummary}
                </p>
              </div>

              {/* Privacy Confirmation Checkbox */}
              <label className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={privacyConfirmed}
                  onChange={(e) => setPrivacyConfirmed(e.target.checked)}
                  className="mt-0.5 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="leading-snug">
                  I confirm this is my legitimate credential. Private numbers/codes are securely redacted.
                </span>
              </label>

              <Button
                onClick={handleCommit}
                disabled={!privacyConfirmed || committing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
              >
                {committing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                )}
                Commit +{auditResult.suggestedTrustDelta}% Proof to Dossier
              </Button>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-red-600 text-center font-medium">{errorMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
}