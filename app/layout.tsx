import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "LocalLeads AI — Local SEO Lead Generation & Outreach",
    template: "%s | LocalLeads AI",
  },
  description:
    "Find local businesses that need SEO help, verify their contact info, and reach them with AI-personalized cold email — all in one platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
