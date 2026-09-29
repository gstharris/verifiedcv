import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "VerifiedCV • A portfolio people can confirm",
  description:
    "Turn your resume into a living portfolio. Ask colleagues to confirm the chapters they were part of — free while we are in beta.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none'><rect width='32' height='32' rx='8' fill='%230F172A'/><path d='M8 11L16 6L24 11V18C24 23 16 26.5 16 26.5C16 26.5 8 23 8 18V11Z' stroke='%23059669' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/><path d='M12 16L15 19L20 13' stroke='%2310B981' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
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
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none'><rect width='32' height='32' rx='8' fill='%230F172A'/><path d='M8 11L16 6L24 11V18C24 23 16 26.5 16 26.5C16 26.5 8 23 8 18V11Z' stroke='%23059669' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/><path d='M12 16L15 19L20 13' stroke='%2310B981' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/></svg>"
          type="image/svg+xml"
        />
      </head>
      <body className="antialiased bg-[#F8FAFC] text-[#0F172A] selection:bg-emerald-100">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}