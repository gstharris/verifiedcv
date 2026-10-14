import { initPostHog } from "@/lib/posthog";

try {
  initPostHog();
} catch (error) {
  console.warn("Visit tracking failed to start", error);
}
