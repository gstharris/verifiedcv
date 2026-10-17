"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-3 sm:items-center sm:p-4">
      <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-[#E2E8F0] bg-white shadow-lg">
        {confirmCancel ? (
          <div className="space-y-5 p-6">
            <div className="space-y-2">
              <h3 className="font-black text-lg text-[#0F172A]">Cancel changes?</h3>
              <p className="text-xs leading-relaxed text-slate-600">
                Unpublished edits will be discarded. Your live dossier stays as it is.
              </p>
            </div>
            {error && <p className="text-xs font-bold text-red-600">{error}</p>}
            <div className="flex flex-col gap-2">
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
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6 pb-3">
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
            </div>
            <div className="flex flex-col gap-2 border-t border-[#E2E8F0] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={onPublish}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {busy ? "Publishing…" : "Publish changes"}
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
                onClick={onKeepEditing}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-xs font-bold text-[#0F172A] cursor-pointer"
              >
                Keep editing
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
