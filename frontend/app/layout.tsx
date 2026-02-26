import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgencyFlow — Multi-Channel Marketing Automation",
  description: "B2B SaaS platform for Indian digital marketing agencies. Run SMS, WhatsApp, Email, and Voice campaigns with AI-powered enhancement.",
  keywords: "marketing automation, SMS campaign, WhatsApp marketing, email marketing, voice calls, AI, SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-base text-text-primary">
        {children}
      </body>
    </html>
  );
}
