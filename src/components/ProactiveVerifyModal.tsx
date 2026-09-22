"use client";

import { useState, useRef } from "react";
import { 
  ShieldCheck, 
  Mail, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  Lock, 
  Upload, 
  EyeOff, 
  Check, 
  Award, 
  Building2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProactiveVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  experienceId: string;
  companyName: string;
  roleTitle: string;
  onVerified: (method: string, proofScore: number) => void;
}

export default function ProactiveVerifyModal({
  isOpen,
  onClose,
  experienceId,
  companyName,
  roleTitle,
  onVerified,
}: ProactiveVerifyModalProps) {
  const [activeTab, setActiveTab] = useState<"DOMAIN_OTP" | "DOCUMENT_SCAN">("DOMAIN_OTP");

  // Domain OTP State
  const [emailAddress, setEmailAddress] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [domainFeedback, setDomainFeedback] = useState<string | null>(null);

  // Document Scan State
  const [docType, setDocType] = useState<string>("PAYSTUB");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [candidateConfirmedRedaction, setCandidateConfirmedRedaction] = useState(false);
  const [docFeedback, setDocFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handler: Send Domain OTP
  const handleSendOtp = async () => {
    if (!emailAddress.includes("@")) return;
    setOtpLoading(true);
    setDomainFeedback(null);

    try {
      const res = await fetch("/api/verify/domain/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experienceId, emailAddress, companyName }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setDomainFeedback(data.message);
        if (data.devOtp) {
          setOtpCode(data.devOtp); // Auto-fill in development for fast testing
        }
      } else {
        setDomainFeedback(data.error || "Failed to dispatch verification code.");
      }
    } catch {
      setDomainFeedback("Network error connecting to verification service.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handler: Confirm Domain OTP
  const handleConfirmOtp = async () => {
    if (otpCode.length < 6) return;
    setOtpLoading(true);
    setDomainFeedback(null);

    try {
      const res = await fetch("/api/verify/domain/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experienceId, otpCode }),
      });
      const data = await res.json();
      if (data.success) {
        onVerified("DOMAIN_OTP", 95);
        onClose();
      } else {
        setDomainFeedback(data.error || "Invalid code.");
      }
    } catch {
      setDomainFeedback("Could not complete verification.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handler: File Selected
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setOcrResult(null);
    }
  };

  // Handler: Scan & Analyze Document
  const handleScanDocument = async () => {
    if (!selectedFile) return;
    setScanLoading(true);
    setDocFeedback(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("documentType", docType);
    formData.append("expectedEntity", companyName);

    try {
      const res = await fetch("/api/verify/document/scan", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success && result.data) {
        setOcrResult(result.data);
      } else {
        setDocFeedback(result.error || "OCR audit failed to recognize credentials.");
      }
    } catch {
      setDocFeedback("Network error analyzing document.");
    } finally {
      setScanLoading(false);
    }
  };

  // Handler: Commit Redacted Proof
  const handleCommitDocumentProof = async () => {
    if (!candidateConfirmedRedaction || !ocrResult) return;
    onVerified("DOCUMENT_REDACTED", 92);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Proactive Self-Verification</h3>
              <p className="text-xs text-slate-500">
                {companyName} • {roleTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 pb-0 bg-white border-b border-slate-100 flex items-center gap-4">
          <button
            onClick={() => setActiveTab("DOMAIN_OTP")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "DOMAIN_OTP"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Work Domain OTP (Instant)</span>
          </button>

          <button
            onClick={() => setActiveTab("DOCUMENT_SCAN")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "DOCUMENT_SCAN"
                ? "border-emerald-600 text-emerald-800"
                : "border-transparent text-slate-400 hover:text-slate-700"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Redacted Document / License Scan</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* ======================================================== */}
          {/* RAIL 1: DOMAIN EMAIL OTP                                  */}
          {/* ======================================================== */}
          {activeTab === "DOMAIN_OTP" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold">Instant Cryptographic Match:</span> If you have an active or alumni email address ending in your employer or school's domain (e.g. <code>@company.com</code> or <code>@school.edu</code>), we'll send a 6-digit handshake code to lock in your tenure immediately.
              </div>

              {!otpSent ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    Corporate or Academic Email Address
                  </label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder={`you@${companyName.toLowerCase().replace(/\s+/g, '')}.com`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  />
                  <Button
                    onClick={handleSendOtp}
                    disabled={otpLoading || !emailAddress.includes("@")}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
                  >
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Send 6-Digit Handshake Code
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Enter Verification Code
                    </label>
                    <span className="text-[11px] text-slate-400">Sent to {emailAddress}</span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-center tracking-widest font-mono text-lg bg-slate-50 border border-slate-200 rounded-xl py-2 text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
                  />
                  <Button
                    onClick={handleConfirmOtp}
                    disabled={otpLoading || otpCode.length < 6}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
                  >
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                    Authenticate & Lock Proof (95%)
                  </Button>
                </div>
              )}

              {domainFeedback && (
                <p className="text-xs text-slate-600 text-center">{domainFeedback}</p>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* RAIL 2: CANDIDATE-IN-THE-LOOP REDACTED DOCUMENT SCANNER   */}
          {/* ======================================================== */}
          {activeTab === "DOCUMENT_SCAN" && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Privacy-First Redaction Guarantee</span>
                </div>
                <p>
                  You own your privacy. SSNs, compensation numbers, bank routing, and home addresses are automatically detected and omitted. You approve the final redacted preview before anything is stored.
                </p>
              </div>

              {/* Document Type Selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "PAYSTUB", label: "Paystub" },
                  { id: "OFFER_LETTER", label: "Contract / Offer" },
                  { id: "BUSINESS_CARD", label: "Business Card" },
                  { id: "LICENSE", label: "State License" },
                  { id: "CERTIFICATE", label: "Certification" },
                  { id: "AWARD", label: "Award / Honors" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDocType(item.id)}
                    className={`text-[11px] font-bold py-2 px-2.5 rounded-lg border text-center transition-all ${
                      docType === item.id
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* File Uploader */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/20 rounded-xl p-6 text-center cursor-pointer transition-all space-y-2"
                >
                  <Upload className="w-6 h-6 mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-700">
                    Upload image of your {docType.replace("_", " ").toLowerCase()}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports JPG, PNG, WebP or clear photo
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-xs">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setOcrResult(null);
                      }}
                      className="text-red-600 font-bold hover:underline text-[11px]"
                    >
                      Remove
                    </button>
                  </div>

                  {!ocrResult ? (
                    <Button
                      onClick={handleScanDocument}
                      disabled={scanLoading}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
                    >
                      {scanLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                          Running Privacy-Preserving OCR Audit...
                        </>
                      ) : (
                        "Analyze & Redact Document"
                      )}
                    </Button>
                  ) : (
                    /* Human-in-the-Loop Confirmation View */
                    <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Audit Matched ({ocrResult.confidenceScore}% Confidence)
                        </span>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
                          Private Data Stripped
                        </Badge>
                      </div>

                      <div className="text-xs space-y-1 text-slate-700 border-t border-b border-emerald-200/60 py-2">
                        <p><strong className="text-slate-900">Entity:</strong> {ocrResult.extractedEntity || companyName}</p>
                        <p><strong className="text-slate-900">Title / ID:</strong> {ocrResult.extractedTitle || ocrResult.identifierOrLicense || roleTitle}</p>
                        <p><strong className="text-slate-900">Dates:</strong> {ocrResult.datesFound || "Verified active period"}</p>
                        {ocrResult.redactedItemsDetected?.length > 0 && (
                          <p className="text-[11px] text-slate-500 italic pt-1">
                            Blocked from record: {ocrResult.redactedItemsDetected.join(", ")}
                          </p>
                        )}
                      </div>

                      {/* Candidate in the loop confirmation checkbox */}
                      <label className="flex items-start gap-2 text-xs text-slate-800 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={candidateConfirmedRedaction}
                          onChange={(e) => setCandidateConfirmedRedaction(e.target.checked)}
                          className="mt-0.5 rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>
                          I confirm all private financial details and SSN are redacted. I authorize this proof hash to be attached to my verified profile.
                        </span>
                      </label>

                      <Button
                        onClick={handleCommitDocumentProof}
                        disabled={!candidateConfirmedRedaction}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs"
                      >
                        Commit Verified Proof Hash to Vault (92%)
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {docFeedback && (
                <p className="text-xs text-red-600 text-center">{docFeedback}</p>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}