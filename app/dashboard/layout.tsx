import DashboardBG from "@/components/dashboard/DashBG";
import Sidebar from "@/components/dashboard/DashSideNavigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (

    <DashboardBG>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 h-screen">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </DashboardBG>
  );
}