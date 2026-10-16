"use client";

import type { DossierChange } from "@/lib/dossierChanges";

export function ReviewChangesDialog({
  open,
  changes,
  overflowLabel,
  busy,
  error,
  confirmCancel,
  onKeepEditing,
  onRequestCancel,
  onDismissCancel,
  onConfirmCancel,
  onPublish
}: {
  open: boolean;
  changes: DossierChange[];
  overflowLabel: string;
  busy: boolean;
  error: string;
  confirmCancel: boolean;
  onKeepEditing: () => void;
  onRequestCancel: () => void;
  onDismissCancel: () => void;
  onConfirmCancel: () => void;
  onPublish: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
        {confirmCancel ? (
          <>
            <div className="space-y-2">
              <h3 className="font-black text-lg text-[#0F172A]">Cancel changes?</h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Unpublished edits will be discarded. Your live dossier stays as it is.
              </p>
            </div>
            {error && <p className="text-xs font-bold text-red-600">{error}</p>}
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={onDismissCancel}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#0F172A] cursor-pointer"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={onConfirmCancel}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-red-200 bg-white text-red-700 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {busy ? "Cancelling…" : "Cancel changes"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="font-black text-lg text-[#0F172A]">Review changes</h3>
              <p className="text-xs leading-relaxed text-slate-600">Your live dossier is unchanged until you publish.</p>
            </div>
            <ul className="space-y-2">
              {changes.map((change, index) => (
                <li key={`${change.section}-${index}`} className="text-xs text-[#0F172A] leading-relaxed">
                  {change.text}
                </li>
              ))}
            </ul>
            {overflowLabel && <p className="text-xs text-slate-500">{overflowLabel}</p>}
            {error && <p className="text-xs font-bold text-red-600">{error}</p>}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={onKeepEditing}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#0F172A] cursor-pointer"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={onRequestCancel}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#0F172A] cursor-pointer"
              >
                Cancel changes
              </button>
              <button
                type="button"
                onClick={onPublish}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {busy ? "Publishing…" : "Publish changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
