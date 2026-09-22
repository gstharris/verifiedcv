import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VerifiedCV | Candidate Trust Platform",
  description: "Prove your career track record upfront with forensic proof signals.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] text-[#0F172A] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}