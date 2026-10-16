import type { Metadata } from "next";
import { AdminResetForm } from "./AdminResetForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reset a test user",
  robots: { index: false, follow: false }
};

export default function AdminResetPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] px-4 py-10 text-[#0F172A]">
      <div className="mx-auto max-w-xl">
        <AdminResetForm />
      </div>
    </main>
  );
}
