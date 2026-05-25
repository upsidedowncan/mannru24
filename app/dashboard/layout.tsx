"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileNavbar } from "@/components/MobileNavbar";
import { NewbieGuide } from "@/components/NewbieGuide";
import { LevelUpDialog } from "@/components/LevelUpDialog";
import { DevPanel } from "@/components/DevPanel";
import { MarketProvider } from "@/lib/market";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        setLoading(false);
      } catch (err) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router, pathname]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  return (
    <MarketProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">
        <Sidebar />
        <main className="lg:ml-64 pb-20 lg:pb-0">
          <div className="p-4 lg:p-8 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
        <MobileNavbar />
        <NewbieGuide />
        <LevelUpDialog />
        <DevPanel />
      </div>
    </MarketProvider>
  );
}
