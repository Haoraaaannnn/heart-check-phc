import DashboardBG from "@/components/dashboard/DashBG";
import Sidebar from "@/components/dashboard/DashSideNavigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout({children}:{children: React.ReactNode}){
    return(
    <DashboardBG>
        <Sidebar/>
        {children}
    </DashboardBG>
    );
}