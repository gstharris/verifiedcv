import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VerifiedCV • The Living Portfolio for Verified Careers",
  description:
    "Prove your track record upfront. Replace unverified resumes with forensic proof signals, peer corroboration, and registry links that bypass screening filters.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23059669' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><path d='m9 12 2 2 4-4'/></svg>"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23059669' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/><path d='m9 12 2 2 4-4'/></svg>"
          type="image/svg+xml"
        />
      </head>
      <body className="antialiased bg-[#F8FAFC] text-[#0F172A] selection:bg-emerald-100">
        {children}
      </body>
    </html>
  );
}