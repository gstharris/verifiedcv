import posthog from "posthog-js";
import { sanitizeAnalyticsUrl } from "@/lib/visitTracking";

type CaptureOptions = {
  transport?: "sendBeacon";
};

type Pending =
  | { type: "capture"; event: string; properties?: Record<string, unknown>; options?: CaptureOptions }
  | { type: "identify"; id: string };

const URL_PROPERTIES = [
  "$current_url",
  "$pathname",
  "$referrer",
  "$initial_current_url",
  "$initial_referrer",
  "$session_entry_url"
];

let ready = false;
let pending: Pending[] = [];

function analyticsEnabled() {
  return typeof window !== "undefined" && Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

function send(item: Pending) {
  if (item.type === "identify") {
    posthog.identify(item.id);
    return;
  }
  posthog.capture(item.event, item.properties, item.options);
}

export function markAnalyticsReady() {
  ready = true;
  const queued = pending;
  pending = [];
  for (const item of queued) send(item);
}

export function scrubAnalyticsEvent<T extends { properties?: Record<string, unknown> | undefined }>(event: T) {
  const properties = event.properties;
  if (!properties) return event;
  for (const key of URL_PROPERTIES) {
    const value = properties[key];
    if (typeof value === "string") properties[key] = sanitizeAnalyticsUrl(value);
  }
  return event;
}

export function captureEvent(event: string, properties?: Record<string, unknown>, options?: CaptureOptions) {
  if (!analyticsEnabled()) return;
  const item: Pending = { type: "capture", event, properties, options };
  if (!ready) {
    pending.push(item);
    return;
  }
  send(item);
}

export function identifyHandle(handle: string) {
  const id = handle.toLowerCase().trim();
  if (!analyticsEnabled() || !id) return;
  const item: Pending = { type: "identify", id };
  if (!ready) {
    pending.push(item);
    return;
  }
  send(item);
}
