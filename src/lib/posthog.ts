import posthog from "posthog-js";
import { markAnalyticsReady, scrubAnalyticsEvent } from "@/lib/analytics";
import { VISIT_COLLECT_PATH } from "@/lib/visitTracking";

let started = false;

export function initPostHog() {
  if (typeof window === "undefined" || started) return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  started = true;
  posthog.init(key, {
    api_host: VISIT_COLLECT_PATH,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://us.posthog.com",
    capture_pageview: false,
    capture_pageleave: false,
    autocapture: false,
    rageclick: false,
    disable_session_recording: true,
    person_profiles: "identified_only",
    persistence: "localStorage+cookie",
    cross_subdomain_cookie: true,
    before_send: (event) => (event ? scrubAnalyticsEvent(event) : event),
    loaded: () => {
      markAnalyticsReady();
    }
  });
}
