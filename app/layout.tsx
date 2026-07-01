import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ProgressionProvider } from "@/lib/progression";
import { MarketProvider } from "@/lib/market";
import { LevelUpDialog } from "@/components/LevelUpDialog";

const geistSans = localFont({
  src: [
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Black.woff2",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    {
      path: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
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
