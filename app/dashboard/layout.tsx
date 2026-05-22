import { Sidebar } from "@/components/Sidebar";
import { MobileNavbar } from "@/components/MobileNavbar";
import { NewbieGuide } from "@/components/NewbieGuide";
import { LevelUpDialog } from "@/components/LevelUpDialog";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="lg:ml-64 pb-20 lg:pb-0">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
      <MobileNavbar />
      <NewbieGuide />
      <LevelUpDialog />
    </div>
  );
}
