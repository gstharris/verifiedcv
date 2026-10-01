import posthog from "posthog-js";

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

export function identifyHandle(handle: string) {
  const id = handle.toLowerCase().trim();
  if (typeof window === "undefined" || !id) return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
  posthog.identify(id);
}
