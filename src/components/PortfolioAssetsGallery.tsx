import { CheckCircle2, ExternalLink } from "lucide-react";
import { assetTypeLabel, type PortfolioAsset } from "@/lib/portfolioAssets";

export default function PortfolioAssetsGallery({
  assets,
  featured = false
}: {
  assets: PortfolioAsset[];
  featured?: boolean;
}) {
  if (!assets.length) return null;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-1">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
          Sample work ({assets.length})
        </h3>
      </div>
      <div className={`grid gap-3 ${featured ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {assets.map((asset) => (
          <div key={asset.id} className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {assetTypeLabel(asset.type)}
              </span>
              {asset.verificationStatus !== "unverified" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" />
                  {asset.verificationStatus === "registry" ? "Public record" : "Public link"}
                </span>
              )}
            </div>
            <div className="font-bold text-xs text-[#0F172A]">{asset.title}</div>
            {asset.description && <p className="text-[11px] text-slate-500 leading-relaxed">{asset.description}</p>}
            {(asset.issuer || asset.issuedAt) && (
              <p className="text-[11px] text-slate-500">
                {[asset.issuer, asset.issuedAt].filter(Boolean).join(" · ")}
              </p>
            )}
            {asset.verificationNote && (
              <p className="text-[10px] text-slate-400 leading-relaxed">{asset.verificationNote}</p>
            )}
            {asset.url && (
              <a
                href={asset.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669] hover:text-[#047857]"
              >
                Open <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
