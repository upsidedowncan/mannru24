import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ProgressionProvider } from "@/lib/progression";
import { MarketProvider } from "@/lib/market";
import { LevelUpDialog } from "@/components/LevelUpDialog";

export const metadata: Metadata = {
  title: "Маннру Банк — Ваш цифровой банк",
  description: "Современный цифровой банк с выгодными условиями, кэшбэком и бонусаниеми",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
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
