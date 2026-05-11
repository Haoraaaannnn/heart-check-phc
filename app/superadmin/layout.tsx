import SuperAdminNav from "@/components/superadmin/SuperAdminNav"

export default function SuperAdminLayout ({children}: {children?: React.ReactNode}) {
    return(
        <div className="min-h-screen bg-white">
            <SuperAdminNav/>
            {children}
        </div>
    )
}