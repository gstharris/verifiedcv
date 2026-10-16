"use client";

import { FormEvent, useEffect, useState } from "react";
import { JWT_EXPIRY_CAVEAT } from "@/lib/adminReset";
import { clearStudioPortfolioStorage } from "@/lib/studioPortfolio";
import { createClient } from "@/lib/supabase/client";

type ResetSummary = {
  dryRun: boolean;
  target: { userId: string | null; email: string | null; handles: string[] };
  storageObjects: string[];
  tables: Record<string, number>;
  skippedCandidates: { handle: string; reason: string }[];
  sessionsRevoked: boolean;
  authUserDeleted: boolean;
  deleteAuthUser: boolean;
  signOutRequired: boolean;
  warnings: string[];
};

type AccessState =
  | { status: "loading" }
  | { status: "ready"; email: string; userId: string }
  | { status: "denied"; message: string };

export function AdminResetForm() {
  const [access, setAccess] = useState<AccessState>({ status: "loading" });
  const [identifier, setIdentifier] = useState("");
  const [confirm, setConfirm] = useState("");
  const [deleteAuthUser, setDeleteAuthUser] = useState(false);
  const [pending, setPending] = useState<"preview" | "reset" | "signout" | null>(null);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<ResetSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/reset", { credentials: "include" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (!response.ok) {
          setAccess({ status: "denied", message: body.error || "This page is not available." });
          return;
        }
        setAccess({ status: "ready", email: body.email || "", userId: body.userId || "" });
      })
      .catch(() => {
        if (!cancelled) setAccess({ status: "denied", message: "Could not check admin access." });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOutAndLeave() {
    setPending("signout");
    clearStudioPortfolioStorage();
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      await createClient().auth.signOut({ scope: "local" });
    } finally {
      clearStudioPortfolioStorage();
      window.location.replace("/");
    }
  }

  async function submit(event: FormEvent, dryRun: boolean) {
    event.preventDefault();
    setError("");
    setSummary(null);
    const value = identifier.trim();
    const payload = value.includes("@")
      ? { email: value, userId: "" }
      : { email: "", userId: value };
    setPending(dryRun ? "preview" : "reset");
    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          dryRun,
          confirm,
          deleteAuthUser
        })
      });
      const body = await response.json().catch(() => ({}));
      const signOutRequired = Boolean(body.signOutRequired || body.summary?.signOutRequired);
      if (signOutRequired) {
        await signOutAndLeave();
        return;
      }
      if (!response.ok) {
        setError(body.table ? `${body.error} (${body.table})` : body.error || "Reset failed.");
        if (body.summary) setSummary(body.summary);
        return;
      }
      setSummary(body);
    } catch {
      setError("Reset failed.");
    } finally {
      setPending((current) => (current === "signout" ? current : null));
    }
  }

  if (access.status === "loading") {
    return <p className="text-sm text-slate-500">Checking access…</p>;
  }

  if (access.status === "denied") {
    return (
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
        <h1 className="text-xl font-semibold">Reset a test user</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{access.message}</p>
      </section>
    );
  }

  const typed = identifier.trim().toLowerCase();
  const resetsSelf = Boolean(
    typed && (typed === access.email.toLowerCase() || typed === access.userId.toLowerCase())
  );
  const tableRows = summary ? Object.entries(summary.tables).filter(([, count]) => count > 0) : [];

  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
      <h1 className="text-xl font-semibold">Reset a test user</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Signed in as {access.email}. Preview is the default and does not delete anything. The reset keeps the login
        unless you explicitly choose to delete it.
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{JWT_EXPIRY_CAVEAT}</p>
      <form className="mt-6 space-y-4" onSubmit={(event) => submit(event, true)}>
        <label className="block text-sm font-medium" htmlFor="reset-target">
          Email or user id
          <input
            id="reset-target"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#059669]"
            autoComplete="off"
            required
          />
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">What to reset</legend>
          <label className="flex items-start gap-2 text-sm leading-5 text-slate-700">
            <input
              type="radio"
              name="reset-mode"
              className="mt-1"
              checked={!deleteAuthUser}
              onChange={() => setDeleteAuthUser(false)}
            />
            Reset app data only. The dossier, draft, and uploaded files are removed. The login stays.
          </label>
          <label className="flex items-start gap-2 text-sm leading-5 text-slate-700">
            <input
              type="radio"
              name="reset-mode"
              className="mt-1"
              checked={deleteAuthUser}
              onChange={() => setDeleteAuthUser(true)}
            />
            Also delete the auth login. This removes the Supabase user after the dossier data.
          </label>
        </fieldset>
        {resetsSelf ? (
          <p className="text-sm leading-6 text-amber-800">
            This is the account you are signed in with. Preview leaves you signed in. After you run the reset, this browser is signed out and sent to the home page.
          </p>
        ) : null}
        <label className="block text-sm font-medium" htmlFor="reset-confirm">
          Type RESET to enable deletion
          <input
            id="reset-confirm"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="mt-1 w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:border-[#059669]"
            autoComplete="off"
          />
        </label>
        {error ? <p className="text-sm text-amber-800">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending !== null}
            className="rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            {pending === "preview" ? "Previewing…" : "Preview"}
          </button>
          <button
            type="button"
            disabled={pending !== null || confirm !== "RESET"}
            onClick={(event) => submit(event, false)}
            className="rounded-lg bg-[#059669] px-4 py-2 text-sm font-medium text-white hover:bg-[#047857] disabled:opacity-60"
          >
            {pending === "signout" ? "Signing out…" : pending === "reset" ? "Resetting…" : deleteAuthUser ? "Reset and delete login" : "Reset app data"}
          </button>
        </div>
      </form>
      {summary ? <Summary summary={summary} tableRows={tableRows} /> : null}
    </section>
  );
}

function Summary({
  summary,
  tableRows
}: {
  summary: ResetSummary;
  tableRows: [string, number][];
}) {
  return (
    <div className="mt-6 border-t border-[#E2E8F0] pt-4 text-sm">
      <h2 className="font-semibold">{summary.dryRun ? "Would delete" : "Deleted"}</h2>
      <p className="mt-2 text-slate-600">
        {summary.target.email || "No email"} · {summary.target.userId || "No login"}
        {summary.target.handles.length > 0 ? ` · ${summary.target.handles.join(", ")}` : ""}
      </p>
      <p className="mt-2 text-slate-600">
        Login {summary.dryRun ? (summary.deleteAuthUser ? "would be deleted" : "would be kept") : summary.authUserDeleted ? "deleted" : "kept"}. Sessions {summary.sessionsRevoked ? "revoked" : "not revoked"}.
      </p>
      {tableRows.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {tableRows.map(([table, count]) => (
            <li key={table}>
              {table}: {count}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-slate-500">No dossier rows matched.</p>
      )}
      <p className="mt-3 text-slate-600">Storage objects: {summary.storageObjects.length}</p>
      {summary.storageObjects.length > 0 ? (
        <ul className="mt-1 max-h-32 space-y-1 overflow-auto text-xs text-slate-500">
          {summary.storageObjects.slice(0, 20).map((path) => (
            <li key={path}>{path}</li>
          ))}
        </ul>
      ) : null}
      {summary.skippedCandidates.length > 0 ? (
        <ul className="mt-3 space-y-1 text-amber-800">
          {summary.skippedCandidates.map((row) => (
            <li key={row.handle}>
              {row.handle}: {row.reason}
            </li>
          ))}
        </ul>
      ) : null}
      <ul className="mt-3 space-y-1 text-slate-500">
        {summary.warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}
