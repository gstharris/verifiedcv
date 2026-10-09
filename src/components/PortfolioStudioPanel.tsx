"use client";

import React, { useState } from "react";
import { ChevronDown, ExternalLink, Plus, Trash2, UploadCloud } from "lucide-react";
import {
  PORTFOLIO_ASSET_TYPES,
  RECRUITER_LAYOUTS,
  assetForm,
  assetTypeLabel,
  isAllowedPortfolioUpload,
  normalizePortfolioAsset,
  recruiterLayout,
  type LayoutBlock,
  type PortfolioAsset,
  type PortfolioAssetType,
  type RecruiterLayout
} from "@/lib/portfolioAssets";

const BLOCK_LABEL: Record<LayoutBlock, string> = {
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  work: "Work samples"
};

function LayoutSketch({
  blocks,
  featured,
  active
}: {
  blocks: LayoutBlock[];
  featured: boolean;
  active: boolean;
}) {
  return (
    <div
      className={`w-full rounded-lg border p-1.5 space-y-1 ${
        active ? "border-emerald-300 bg-white" : "border-[#E2E8F0] bg-white"
      }`}
      aria-hidden="true"
    >
      <div className="rounded-sm bg-[#0F172A] text-white text-[8px] font-bold px-1 py-0.5">Your name</div>
      {blocks.map((block) =>
        block === "work" && featured ? (
          <div key={block} className="grid grid-cols-2 gap-0.5">
            <div className="rounded-sm bg-emerald-500 text-white text-[8px] font-bold px-1 py-1">Work</div>
            <div className="rounded-sm bg-emerald-400 text-white text-[8px] font-bold px-1 py-1">Work</div>
          </div>
        ) : (
          <div
            key={block}
            className={`rounded-sm px-1 py-0.5 text-[8px] font-bold ${
              block === "work" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
            }`}
          >
            {BLOCK_LABEL[block]}
          </div>
        )
      )}
    </div>
  );
}

function titleFromFile(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export default function PortfolioStudioPanel({
  assets,
  layout,
  handle,
  saved,
  onAssetsChange,
  onLayoutChange
}: {
  assets: PortfolioAsset[];
  layout: RecruiterLayout;
  handle: string;
  saved: boolean;
  onAssetsChange: (assets: PortfolioAsset[]) => void;
  onLayoutChange: (layout: RecruiterLayout) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<PortfolioAssetType>("project");
  const [description, setDescription] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachedName, setAttachedName] = useState("");
  const [layoutOpen, setLayoutOpen] = useState(false);

  const current = recruiterLayout(layout);
  const form = assetForm(type);
  const linkAfterFile = Boolean(form.file);

  const chooseType = (next: PortfolioAssetType) => {
    const nextForm = assetForm(next);
    setType(next);
    if (!nextForm.issuer) setIssuer("");
    if (!nextForm.issuedAt) setIssuedAt("");
    if (!nextForm.description) setDescription("");
    if (!nextForm.url && !nextForm.file) {
      setUrl("");
      setAttachedName("");
    }
    setError("");
  };

  const addAsset = (nextUrl = url) => {
    const asset = normalizePortfolioAsset({
      title,
      url: form.url || form.file ? nextUrl : "",
      type,
      description: form.description ? description : "",
      issuer: form.issuer ? issuer : "",
      issuedAt: form.issuedAt ? issuedAt : ""
    });
    if (!asset) {
      setError("Add a name so recruiters know what this is.");
      return;
    }
    onAssetsChange([...assets, asset]);
    setTitle("");
    setUrl("");
    setDescription("");
    setIssuer("");
    setIssuedAt("");
    setAttachedName("");
    setError("");
  };

  const uploadFile = async (file: File) => {
    setError("");
    if (!saved) {
      setError("Save your page first, then upload a file.");
      return;
    }
    if (!isAllowedPortfolioUpload(file.name)) {
      setError("Upload a PDF, image, deck, Keynote, or zip. Or paste a public link.");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("handle", handle);
      const res = await fetch("/api/portfolio/upload", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error || "Could not upload that file. Paste a public link instead.");
        return;
      }
      setUrl(data.url);
      setAttachedName(file.name);
      if (!title.trim()) setTitle(titleFromFile(file.name));
    } catch {
      setError("Could not upload that file. Paste a public link instead.");
    } finally {
      setUploading(false);
    }
  };

  const linkField = form.url ? (
    <input
      type="url"
      value={url}
      readOnly={!saved}
      onChange={(e) => {
        setUrl(e.target.value);
        setAttachedName("");
      }}
      placeholder={form.url}
      className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
    />
  ) : null;

  const fileField = form.file ? (
    <label
      className={`inline-flex items-center justify-center gap-2 text-xs font-semibold p-2.5 rounded-xl border border-dashed ${
        attachedName
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-[#E2E8F0] bg-[#F8FAFC] text-slate-600"
      } cursor-pointer`}
    >
      <UploadCloud className="w-3.5 h-3.5" />
      {uploading ? "Uploading…" : attachedName ? `Attached ${attachedName}` : form.file}
      <input
        type="file"
        className="hidden"
        disabled={uploading}
        accept=".pdf,.png,.jpg,.jpeg,.webp,.ppt,.pptx,.key,.zip"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void uploadFile(file);
          e.currentTarget.value = "";
        }}
      />
    </label>
  ) : null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">Work samples</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{current.summary}</p>
        </div>
        <button
          type="button"
          onClick={() => setLayoutOpen((open) => !open)}
          className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
        >
          {layoutOpen ? "Hide layouts" : "Change layout"}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${layoutOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {layoutOpen && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-3">
          <p className="text-[11px] text-slate-500">
            Your name stays at the top. These sketches are the order underneath it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {RECRUITER_LAYOUTS.map((option) => {
              const active = layout === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={!saved}
                  onClick={() => onLayoutChange(option.id)}
                  className={`text-left p-2 rounded-xl border transition-colors space-y-1.5 ${
                    active ? "border-emerald-200 bg-white" : "border-transparent hover:border-[#E2E8F0] hover:bg-white"
                  } ${saved ? "cursor-pointer" : "opacity-70 cursor-pointer"}`}
                >
                  <LayoutSketch blocks={option.blocks} featured={option.featured} active={active} />
                  <div className={`text-[11px] font-bold ${active ? "text-[#059669]" : "text-[#0F172A]"}`}>
                    {option.title}
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{option.summary}</p>
                </button>
              );
            })}
          </div>
          {handle.trim() && (
            <a
              href={`/${handle.toLowerCase().trim()}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669]"
            >
              Open your page <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="block space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">What is this?</span>
          <select
            value={type}
            disabled={!saved}
            onChange={(e) => chooseType(e.target.value as PortfolioAssetType)}
            className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
          >
            {PORTFOLIO_ASSET_TYPES.map((assetType) => (
              <option key={assetType} value={assetType}>
                {assetTypeLabel(assetType)}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[11px] text-slate-500">{form.hint}</p>

        <input
          type="text"
          value={title}
          readOnly={!saved}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={form.title}
          className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
        />

        {(form.issuer || form.issuedAt) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {form.issuer && (
              <input
                type="text"
                value={issuer}
                readOnly={!saved}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder={form.issuer}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
              />
            )}
            {form.issuedAt && (
              <input
                type="text"
                value={issuedAt}
                readOnly={!saved}
                onChange={(e) => setIssuedAt(e.target.value)}
                placeholder={form.issuedAt}
                className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
              />
            )}
          </div>
        )}

        {!linkAfterFile && linkField}
        {fileField}
        {linkAfterFile && linkField}

        {form.description && (
          <textarea
            value={description}
            readOnly={!saved}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={form.description}
            rows={2}
            className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
          />
        )}
      </div>

      {error && <p className="text-[11px] font-bold text-red-500">{error}</p>}
      <button
        type="button"
        disabled={!saved}
        onClick={() => addAsset()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0F172A] hover:bg-slate-800 px-3 py-2 rounded-xl cursor-pointer disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" />
        Add to your page
      </button>

      {assets.length > 0 && (
        <div className="space-y-2">
          {assets.map((asset) => (
            <div key={asset.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="space-y-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {assetTypeLabel(asset.type)}
                </div>
                <div className="text-xs font-bold text-[#0F172A]">{asset.title}</div>
                {asset.verificationNote && <p className="text-[10px] text-slate-500 leading-relaxed">{asset.verificationNote}</p>}
                {asset.url && (
                  <a
                    href={asset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669]"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={() => onAssetsChange(assets.filter((item) => item.id !== asset.id))}
                className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                aria-label={`Remove ${asset.title}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
