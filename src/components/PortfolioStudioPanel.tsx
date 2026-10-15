"use client";

import React, { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, Plus, Trash2, UploadCloud } from "lucide-react";
import {
  PORTFOLIO_ASSET_TYPES,
  RESUME_TEMPLATES,
  assetForm,
  assetTypeLabel,
  encodeDossierLayout,
  isAllowedPortfolioUpload,
  normalizePortfolioAsset,
  parseDossierLayout,
  workPreviewUrl,
  type PortfolioAsset,
  type PortfolioAssetType,
  type ResumeTemplate,
  type SamplePlacement
} from "@/lib/portfolioAssets";

export function DossierLayoutControl({
  layout,
  saved,
  assetCount,
  onLayoutChange
}: {
  layout: string;
  saved: boolean;
  assetCount: number;
  onLayoutChange: (layout: string) => void;
}) {
  const current = parseDossierLayout(layout);
  const choiceClass = (active: boolean) =>
    `px-2 py-1 rounded-md text-[11px] font-bold ${
      active ? "bg-emerald-50 text-[#059669]" : "text-slate-500 hover:text-[#0F172A]"
    } cursor-pointer`;

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[11px] text-slate-500">
        This studio is a preview of your public dossier. These choices change how that page reads.
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dossier layout</span>
        <div className="inline-flex flex-wrap p-0.5 rounded-lg bg-white border border-[#E2E8F0]">
          {RESUME_TEMPLATES.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={!saved}
              title={option.summary}
              onClick={() => onLayoutChange(encodeDossierLayout(option.id, current.placement))}
              className={choiceClass(current.template === option.id)}
            >
              {option.title}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sample work</span>
        <div className="inline-flex p-0.5 rounded-lg bg-white border border-[#E2E8F0]">
          {(["top", "bottom", "hidden"] as SamplePlacement[]).map((placement) => (
            <button
              key={placement}
              type="button"
              disabled={!saved}
              onClick={() => onLayoutChange(encodeDossierLayout(current.template as ResumeTemplate, placement))}
              className={choiceClass(current.placement === placement)}
            >
              {placement === "top" ? "Top of page" : placement === "bottom" ? "Bottom of page" : "Don't show"}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-slate-500">
          {current.placement === "hidden"
            ? "Sample work stays off the public page."
            : assetCount === 0
              ? "Nothing added yet, so this stays off the public page."
              : "Moves the sample-work previews on the public page."}
        </span>
      </div>
    </div>
  );
}

function titleFromFile(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

export default function PortfolioStudioPanel({
  assets,
  handle,
  saved,
  addSignal = 0,
  onAssetsChange
}: {
  assets: PortfolioAsset[];
  handle: string;
  saved: boolean;
  addSignal?: number;
  onAssetsChange: (assets: PortfolioAsset[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState<PortfolioAssetType | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [attachedName, setAttachedName] = useState("");

  useEffect(() => {
    if (!addSignal) return;
    setMenuOpen(true);
    setAdding(null);
  }, [addSignal]);

  const form = adding ? assetForm(adding) : null;
  const linkAfterFile = Boolean(form?.file);

  const chooseType = (next: PortfolioAssetType) => {
    const nextForm = assetForm(next);
    setAdding(next);
    setMenuOpen(false);
    if (!nextForm.issuer) setIssuer("");
    if (!nextForm.issuedAt) setIssuedAt("");
    if (!nextForm.description) setDescription("");
    if (!nextForm.url && !nextForm.file) {
      setUrl("");
      setAttachedName("");
    }
    setError("");
  };

  const closeForm = () => {
    setAdding(null);
    setMenuOpen(false);
    setTitle("");
    setUrl("");
    setDescription("");
    setIssuer("");
    setIssuedAt("");
    setAttachedName("");
    setError("");
  };

  const addAsset = (nextUrl = url) => {
    if (!adding || !form) return;
    const asset = normalizePortfolioAsset({
      title,
      url: form.url || form.file ? nextUrl : "",
      type: adding,
      description: form.description ? description : "",
      issuer: form.issuer ? issuer : "",
      issuedAt: form.issuedAt ? issuedAt : ""
    });
    if (!asset) {
      setError("Add a name so recruiters know what this is.");
      return;
    }
    onAssetsChange([...assets, asset]);
    closeForm();
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

  const linkField = form?.url ? (
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

  const fileField = form?.file ? (
    <label
      className={`inline-flex items-center justify-center gap-2 text-xs font-semibold p-2.5 rounded-xl border border-dashed ${
        attachedName
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-[#E2E8F0] bg-[#F8FAFC] text-slate-600"
      } cursor-pointer`}
    >
      <UploadCloud className="w-3.5 h-3.5" />
      {uploading ? "Uploading…" : attachedName ? `Attached ${attachedName}` : form?.file}
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
          <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">Sample work</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Projects, decks, apps, certifications, and patents.</p>
        </div>
        <div className="relative shrink-0">
          <button
            type="button"
            disabled={!saved}
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#059669] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
            <ChevronDown className="w-3 h-3" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-[#E2E8F0] bg-white py-1 shadow-lg">
              {PORTFOLIO_ASSET_TYPES.map((assetType) => (
                <button
                  key={assetType}
                  type="button"
                  onClick={() => chooseType(assetType)}
                  className="block w-full px-3 py-2 text-left text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  {assetTypeLabel(assetType)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {form && adding && (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">{form.hint}</p>
          <button type="button" onClick={closeForm} className="text-[11px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer">
            Cancel
          </button>
        </div>

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

        {error && <p className="text-[11px] font-bold text-red-500">{error}</p>}
        {title.trim() && (
          <button
            type="button"
            disabled={!saved}
            onClick={() => addAsset()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0F172A] hover:bg-slate-800 px-3 py-2 rounded-xl cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Add to your page
          </button>
        )}
      </div>
      )}

      {assets.length > 0 && (
        <div className="space-y-2">
          {assets.map((asset) => (
            <div key={asset.id} className="flex items-start justify-between gap-3 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-16 h-12 shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
                  {workPreviewUrl(asset.url) ? (
                    <img src={workPreviewUrl(asset.url)} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[9px] font-bold uppercase text-slate-400">
                      {assetTypeLabel(asset.type)}
                    </div>
                  )}
                </div>
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
