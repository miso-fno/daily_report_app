import { Noto_Sans_JP } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";

import type { Metadata } from "next";

import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "営業日報システム",
  description: "営業担当者の日報管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} min-h-screen bg-background font-sans antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
