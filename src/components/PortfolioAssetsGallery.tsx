"use client";

import { useState } from "react";
import { assetTypeLabel, workPreviewUrl, type PortfolioAsset } from "@/lib/portfolioAssets";

function WorkPreview({ asset }: { asset: PortfolioAsset }) {
  const preview = workPreviewUrl(asset.url);
  const [failed, setFailed] = useState(false);
  if (!preview || failed) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F8FAFC] px-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {assetTypeLabel(asset.type)}
      </div>
    );
  }
  return (
    <img
      src={preview}
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
      <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
        Sample work ({assets.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {assets.map((asset) => {
          const body = (
            <>
              <div className="aspect-[4/3] overflow-hidden border-b border-[#E2E8F0]">
                <WorkPreview asset={asset} />
              </div>
              <div className="p-2.5 space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {assetTypeLabel(asset.type)}
                </div>
                <div className="text-xs font-bold text-[#0F172A] leading-snug line-clamp-2">{asset.title}</div>
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
            <a key={asset.id} href={asset.url} target="_blank" rel="noreferrer" className={className}>
              {body}
            </a>
          );
        })}
      </div>
    </div>
  );
}
