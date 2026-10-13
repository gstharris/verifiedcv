export const LOOP_REF_KEY = "vcv_corroborator_ref";

export const LOOP_EVENTS = {
  corroborationCompleted: "corroboration_completed",
  corroboratorProfileStarted: "corroborator_profile_started",
  corroboratorProfileCreated: "corroborator_profile_created"
} as const;

export type CorroboratorRef = {
  handle: string;
  name: string;
  company: string;
};

function clean(value: string | null, max = 120) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function corroboratorRefFromSearch(params: URLSearchParams): CorroboratorRef | null {
  const handle = clean(params.get("ref"), 64).toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(handle)) return null;
  return {
    handle,
    name: clean(params.get("refName")),
    company: clean(params.get("company"))
  };
}

export function readCorroboratorRef(): CorroboratorRef | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LOOP_REF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CorroboratorRef>;
    const handle = clean(parsed.handle || "", 64).toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(handle)) return null;
    return {
      handle,
      name: clean(parsed.name || ""),
      company: clean(parsed.company || "")
    };
  } catch {
    return null;
  }
}

export function writeCorroboratorRef(ref: CorroboratorRef) {
  if (typeof window === "undefined") return;
  const stored = corroboratorRefFromSearch(
    new URLSearchParams({ ref: ref.handle, refName: ref.name, company: ref.company })
  );
  if (!stored) return;
  sessionStorage.setItem(LOOP_REF_KEY, JSON.stringify(stored));
}

export function consumeCorroboratorRef(): CorroboratorRef | null {
  const current = readCorroboratorRef();
  if (typeof window !== "undefined") sessionStorage.removeItem(LOOP_REF_KEY);
  return current;
}
