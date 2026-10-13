"use client";

import { useState } from "react";
import { assetTypeLabel, workPreview, type PortfolioAsset } from "@/lib/portfolioAssets";

function WorkPreview({ asset }: { asset: PortfolioAsset }) {
  const preview = workPreview(asset.url);
  const [failed, setFailed] = useState(false);
  if (!preview || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F8FAFC] px-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {assetTypeLabel(asset.type)}
      </div>
    );
  }
  if (preview.kind === "frame") {
    return (
      <iframe
        src={preview.src}
        title=""
        className="pointer-events-none h-full w-full border-0 bg-white"
      />
    );
  }
  return (
    <img
      src={preview.src}
      alt=""
      className="h-full w-full object-cover bg-[#F8FAFC]"
      onError={() => setFailed(true)}
    />
  );
}

export default function PortfolioAssetsGallery({ assets }: { assets: PortfolioAsset[] }) {
  if (!assets.length) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
      <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
        Sample work ({assets.length})
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {assets.map((asset) => {
          const body = (
            <>
              <div className="aspect-[16/10] min-h-52 overflow-hidden border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <WorkPreview asset={asset} />
              </div>
              <div className="p-4 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {assetTypeLabel(asset.type)}
                </div>
                <div className="text-sm font-bold text-[#0F172A] leading-snug">{asset.title}</div>
                {asset.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{asset.description}</p>
                )}
              </div>
            </>
          );
          const className = "block overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white hover:border-slate-300 transition-colors";
          if (!asset.url) {
            return (
              <div key={asset.id} className={className}>
                {body}
              </div>
            );
          }
          return (
            <a
              key={asset.id}
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
            >
              {body}
            </a>
          );
        })}
      </div>
    </div>
  );
}
