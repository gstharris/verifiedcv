"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog } from "@/lib/posthog";
import { captureEvent } from "@/lib/analytics";
import { trackNavigation, trackPageHide } from "@/lib/visitTracking";

function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const search = searchParams?.toString() ?? "";
    const startedAt = Date.now();
    const { pageview, pageleave } = trackNavigation({
      pathname,
      search,
      origin: window.location.origin,
      referrer: document.referrer,
      startedAt
    });
    if (pageleave) captureEvent("$pageleave", pageleave);
    if (pageview) captureEvent("$pageview", pageview);

    const onHide = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      const leave = trackPageHide(Date.now());
      if (leave) captureEvent("$pageleave", leave, { transport: "sendBeacon" });
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [pathname, searchParams]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </>
  );
}
