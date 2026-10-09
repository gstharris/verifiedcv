"use client";

import React, { useState } from "react";
import { ChevronDown, ExternalLink, Plus, Trash2, UploadCloud } from "lucide-react";
import {
  PORTFOLIO_ASSET_TYPES,
  assetTypeLabel,
  normalizePortfolioAsset,
  type PortfolioAsset,
  type PortfolioAssetType,
  type RecruiterLayout
} from "@/lib/portfolioAssets";

const LAYOUTS: { id: RecruiterLayout; title: string; order: Array<"you" | "work" | "jobs"> }[] = [
  { id: "traditional", title: "Traditional", order: ["you", "jobs", "work"] },
  { id: "hybrid", title: "Hybrid", order: ["you", "work", "jobs"] },
  { id: "creative", title: "Creative", order: ["work", "you", "jobs"] }
];

function blockClass(kind: "you" | "work" | "jobs") {
  if (kind === "you") return "h-1.5 bg-slate-300";
  if (kind === "work") return "h-3 bg-emerald-400";
  return "h-2.5 bg-slate-400";
}

function LayoutSketch({ order, active }: { order: Array<"you" | "work" | "jobs">; active: boolean }) {
  return (
    <div
      className={`w-11 h-[52px] rounded-md border p-1 flex flex-col gap-0.5 ${
        active ? "border-emerald-300 bg-white" : "border-[#E2E8F0] bg-white"
      }`}
      aria-hidden="true"
    >
      {order.map((kind, index) => (
        <div key={`${kind}-${index}`} className={`w-full rounded-[2px] ${blockClass(kind)}`} />
      ))}
    </div>
  );
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
  const [layoutOpen, setLayoutOpen] = useState(false);

  const current = LAYOUTS.find((option) => option.id === layout) || LAYOUTS[1];

  const addAsset = (nextUrl = url) => {
    const asset = normalizePortfolioAsset({ title, url: nextUrl, type, description, issuer, issuedAt });
    if (!asset) {
      setError("Add a title so recruiters know what this is.");
      return;
    }
    onAssetsChange([...assets, asset]);
    setTitle("");
    setUrl("");
    setDescription("");
    setIssuer("");
    setIssuedAt("");
    setError("");
  };

  const uploadFile = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("handle", handle);
      const res = await fetch("/api/portfolio/upload", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setError(data.error || "Could not upload that file. Paste a public URL instead.");
        return;
      }
      setUrl(data.url);
    } catch {
      setError("Could not upload that file. Paste a public URL instead.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">Work samples</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Projects, decks, apps, certifications, patents.</p>
        </div>
        <button
          type="button"
          onClick={() => setLayoutOpen((open) => !open)}
          className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
        >
          Layout: {current.title}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${layoutOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {layoutOpen && (
        <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-2">
          <p className="text-[10px] text-slate-500">
            Optional. Green is work samples. Gray is you, then experience.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {LAYOUTS.map((option) => {
              const active = layout === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={!saved}
                  onClick={() => onLayoutChange(option.id)}
                  className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-colors ${
                    active ? "border-emerald-200 bg-white" : "border-transparent hover:border-[#E2E8F0] hover:bg-white"
                  } ${saved ? "cursor-pointer" : "opacity-70 cursor-pointer"}`}
                >
                  <LayoutSketch order={option.order} active={active} />
                  <span className={`text-[10px] font-bold ${active ? "text-[#059669]" : "text-slate-600"}`}>
                    {option.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          value={title}
          readOnly={!saved}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (PMP, demo app, patent…)"
          className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
        />
        <select
          value={type}
          disabled={!saved}
          onChange={(e) => setType(e.target.value as PortfolioAssetType)}
          className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
        >
          {PORTFOLIO_ASSET_TYPES.map((assetType) => (
            <option key={assetType} value={assetType}>
              {assetTypeLabel(assetType)}
            </option>
          ))}
        </select>
        <input
          type="url"
          value={url}
          readOnly={!saved}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https:// public link"
          className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
        />
        <label className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 p-2.5 rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] cursor-pointer">
          <UploadCloud className="w-3.5 h-3.5" />
          {uploading ? "Uploading…" : "Upload a file"}
          <input
            type="file"
            className="hidden"
            disabled={!saved || uploading}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.ppt,.pptx,.key,.zip"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
              e.currentTarget.value = "";
            }}
          />
        </label>
        <input
          type="text"
          value={issuer}
          readOnly={!saved}
          onChange={(e) => setIssuer(e.target.value)}
          placeholder="Issuer or inventor (optional)"
          className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
        />
        <input
          type="text"
          value={issuedAt}
          readOnly={!saved}
          onChange={(e) => setIssuedAt(e.target.value)}
          placeholder="Year or date (optional)"
          className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
        />
      </div>
      <textarea
        value={description}
        readOnly={!saved}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What should a recruiter notice?"
        rows={2}
        className="w-full text-xs p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#059669]"
      />
      {error && <p className="text-[10px] font-bold text-red-500">{error}</p>}
      <button
        type="button"
        disabled={!saved}
        onClick={() => addAsset()}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0F172A] hover:bg-slate-800 px-3 py-2 rounded-xl cursor-pointer disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" />
        Add to portfolio
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
