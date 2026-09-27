"use client";

import { useEffect } from "react";

export default function MockLinkedInLogin() {
  useEffect(() => {
    window.location.replace("/api/auth/linkedin?next=/studio");
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-sm text-slate-500">
      Redirecting to LinkedIn...
    </div>
  );
}
