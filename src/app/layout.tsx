import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEHAT SETU — Layer 1 (Clinical Intelligence Layer)",
  description: "AI-Powered Patient Case-Taking & Medical Document Intelligence for Pre-Consultation Evidence Preparation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
