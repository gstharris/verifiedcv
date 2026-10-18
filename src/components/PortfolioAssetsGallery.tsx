"use client";

import { assetTypeLabel, type PortfolioAsset } from "@/lib/portfolioAssets";
import { faviconUrl, siteLabel } from "@/lib/companySite";

export default function PortfolioAssetsGallery({ assets }: { assets: PortfolioAsset[] }) {
  if (!assets.length) return null;

  return (
    <div className="space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs">
      <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
        Sample work ({assets.length})
      </h2>
      <div className="divide-y divide-slate-100">
        {assets.map((asset) => {
          const host = asset.url ? siteLabel(asset.url) : "";
          const icon = asset.url ? faviconUrl(asset.url) : "";
          const body = (
            <>
              {icon ? (
                <img src={icon} alt="" className="mt-0.5 h-4 w-4 shrink-0 rounded-sm" />
              ) : (
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-bold leading-snug text-[#0F172A]">{asset.title}</span>
                <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
                  {assetTypeLabel(asset.type)}
                  {host ? ` · ${host}` : ""}
                </span>
                {asset.description && (
                  <span className="mt-1 block text-xs leading-relaxed text-slate-600">{asset.description}</span>
                )}
              </span>
            </>
          );
          const className = "flex items-start gap-3 py-3";
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
              className={`${className} hover:bg-[#F8FAFC]`}
            >
              {body}
            </a>
          );
        })}
      </div>
    </div>
  );
}
