"use client";

export function UndoBanner({ label, onUndo }: { label: string; onUndo: () => void }) {
  return (
    <div className="fixed bottom-24 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-2.5 shadow-lg md:bottom-4 md:left-auto md:right-4 md:translate-x-0">
      <p className="text-xs font-semibold text-[#0F172A]">{label}</p>
      <button type="button" onClick={onUndo} className="text-xs font-bold text-[#059669] cursor-pointer">
        Undo
      </button>
    </div>
  );
}
