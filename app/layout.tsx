import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProgressionProvider } from "@/lib/progression";
import { MarketProvider } from "@/lib/market";
import { LevelUpDialog } from "@/components/LevelUpDialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Маннру Банк — Ваш цифровой банк",
  description: "Современный цифровой банк с выгодными условиями, кэшбэком и бонусами",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <ProgressionProvider>
          <MarketProvider>
            {children}
            <LevelUpDialog />
          </MarketProvider>
        </ProgressionProvider>
      </body>
    </html>
  );
}
