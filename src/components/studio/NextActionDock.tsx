"use client";

import React, { useEffect, useRef } from "react";
import type { StudioAction } from "@/lib/studioActions";

type DockMessage = { sender: "ally" | "user"; text: string };

function Transcript({ messages, processing }: { messages: DockMessage[]; processing: boolean }) {
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = transcriptRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, processing]);

  return (
    <div ref={transcriptRef} className="max-h-[min(360px,50vh)] space-y-2 overflow-y-auto">
      {messages.map((message, index) => (
        <p
          key={index}
          className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
            message.sender === "ally"
              ? "border border-[#E2E8F0] bg-[#F8FAFC] text-slate-700"
              : "ml-6 bg-[#0F172A] text-white"
          }`}
        >
          {message.text}
        </p>
      ))}
      {processing && <p className="text-[11px] font-semibold text-slate-500">Reading your resume…</p>}
    </div>
  );
}

export function NextActionDock({
  primary,
  suggestions,
  messages,
  input,
  onInput,
  onSubmit,
  onAction,
  expanded,
  onToggle,
  processing,
  note,
  mobileOnly = false
}: {
  primary: StudioAction;
  suggestions: StudioAction[];
  messages: DockMessage[];
  input: string;
  onInput: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onAction: (action: StudioAction) => void;
  expanded: boolean;
  onToggle: () => void;
  processing: boolean;
  note?: string;
  mobileOnly?: boolean;
}) {
  const suggestionsList = suggestions.length > 0 && (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {suggestions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onAction(action)}
          className="text-[11px] font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
        >
          {action.label}
        </button>
      ))}
    </div>
  );

  const ask = (
    <form onSubmit={onSubmit}>
      <input
        type="text"
        value={input}
        onChange={(event) => onInput(event.target.value)}
        placeholder="Ask what to do next"
        aria-label="Ask what to do next"
        className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#0F172A] focus:border-[#059669] focus:outline-none"
      />
    </form>
  );

  const conversationControl = (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="text-[11px] font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
    >
      {expanded ? "Hide conversation" : "Show conversation"}
    </button>
  );

  return (
    <>
      <section
        aria-label="Ally"
        className={`fixed bottom-4 left-4 z-30 w-[320px] flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-lg ${mobileOnly ? "hidden" : "hidden md:flex"}`}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ally</p>
          {conversationControl}
        </div>
        {expanded && <Transcript messages={messages} processing={processing} />}
        {note && <p className="text-[11px] font-semibold text-slate-500">{note}</p>}
        <button
          type="button"
          onClick={() => onAction(primary)}
          className="w-full rounded-xl border border-[#E2E8F0] bg-white px-3 py-2.5 text-xs font-bold text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
        >
          {primary.label}
        </button>
        {suggestionsList}
        {ask}
      </section>

      <section aria-label="Ally" className="fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] md:hidden">
        {expanded && (
          <div className="max-h-[50vh] overflow-y-auto border-t border-[#E2E8F0] bg-white px-4 py-3 shadow-lg">
            <div className="space-y-3">
              <Transcript messages={messages} processing={processing} />
              {suggestionsList}
              {ask}
            </div>
          </div>
        )}
        <div className="border-t border-[#E2E8F0] bg-white px-3 py-2.5">
          {note && <p className="mb-2 text-[11px] font-semibold text-slate-500">{note}</p>}
          <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAction(primary)}
            className="min-w-0 flex-1 truncate rounded-xl bg-[#059669] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#047857] cursor-pointer"
          >
            {primary.label}
          </button>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            className="shrink-0 rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-[11px] font-bold text-slate-600 cursor-pointer"
          >
            {expanded ? "Close" : "More"}
          </button>
          </div>
        </div>
      </section>
    </>
  );
}
