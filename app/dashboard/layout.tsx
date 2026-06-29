import DashboardBG from "@/components/backgrounds/DashboardBg";
import Sidebar from "@/app/dashboard/components/navigation/DashSideNavigation";
import DashboardHeader from "@/app/dashboard/components/navigation/DashboardHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (

    <DashboardBG>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 min-h-screen">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </DashboardBG>
  );
}