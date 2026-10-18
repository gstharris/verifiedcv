"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { assetTypeLabel, workPreview, type PortfolioAsset } from "@/lib/portfolioAssets";
import { siteLabel } from "@/lib/companySite";

const PAGE_SIZE = 2;

function WorkBlock({ asset }: { asset: PortfolioAsset }) {
  const preview = workPreview(asset.url);
  const host = asset.url ? siteLabel(asset.url) : "";
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F8FAFC]">
        {preview?.kind === "image" || preview?.kind === "shot" ? (
          <img src={preview.src} alt="" className="h-full w-full object-cover" />
        ) : preview?.kind === "frame" ? (
          <iframe title={asset.title} src={preview.src} className="h-full w-full border-0" />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {assetTypeLabel(asset.type)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {assetTypeLabel(asset.type)}
          {host ? ` · ${host}` : ""}
        </p>
        {asset.url ? (
          <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-sm font-black leading-snug text-[#0F172A] hover:text-[#059669]">
            {asset.title}
          </a>
        ) : (
          <h3 className="text-sm font-black leading-snug text-[#0F172A]">{asset.title}</h3>
        )}
        {asset.description && <p className="text-xs leading-relaxed text-slate-600">{asset.description}</p>}
      </div>
    </article>
  );
}

export default function PortfolioAssetsGallery({ assets }: { assets: PortfolioAsset[] }) {
  const [page, setPage] = useState(0);
  if (!assets.length) return null;

  const pageCount = Math.ceil(assets.length / PAGE_SIZE);
  const safePage = Math.min(page, pageCount - 1);
  const visible = assets.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <section className="space-y-3" aria-label="Sample work">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">Sample work</h2>
        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(0, Math.min(current, pageCount - 1) - 1))}
              disabled={safePage === 0}
              aria-label="Previous sample work"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-slate-600 hover:text-[#0F172A] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1 text-[11px] font-semibold text-slate-500">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pageCount - 1, Math.min(current, pageCount - 1) + 1))}
              disabled={safePage >= pageCount - 1}
              aria-label="Next sample work"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-slate-600 hover:text-[#0F172A] disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((asset) => (
          <WorkBlock key={asset.id} asset={asset} />
        ))}
      </div>
    </section>
  );
}
