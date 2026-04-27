"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { label: 'Overview', href: '/dashboard' },
    { label: 'Analytics', href: '/dashboard/analytics' },
    { label: 'Cubicles', href: '/dashboard/cubicles' },
    { label: 'Patients', href: '/dashboard/patients' },
  ];

  const departments = [
    { name: 'Consultation', href: '/dashboard/servicesPHC/consultation' },
    { name: 'OPD Card', href: '/dashboard/servicesPHC/opdCard' },
    { name: 'Refill Prescription', href: '/dashboard/servicesPHC/refillPrescription' },
    { name: 'ECG', href: '/dashboard/servicesPHC/ecg' },
    { name: 'Warfarin', href: '/dashboard/servicesPHC/warfarin' },
    { name: 'OPD Reschedule', href: '/dashboard/servicesPHC/opdReschedule' },
    { name: 'Benzathine', href: '/dashboard/servicesPHC/benzathine' },
    { name: 'OPD Screening', href: '/dashboard/servicesPHC/opdScreening' }
  ];

  return (

    <aside className="w-60 rounded-[28px] m-3 bg-white/35 border-r border-white/40 flex flex-col p-6 gap-8 h-[calc(100vh-24px)] sticky top-3 z-20 backdrop-blur-xl shadow-[0_10px_40px_rgba(255,120,120,0.06)]
      dark:bg-gray-900/60 dark:border-gray-700/50 dark:shadow-black/20">
      
      {/* Brand Header */}
      <div className="flex items-center gap-3">
        <div>

          <h1 className="font-bold text-red-800 dark:text-red-400 text-lg leading-tight">Heart Check PHC</h1>
          <p className="text-xs text-gray-400">Admin Dashboard</p>
        </div>
      </div>

      <nav className="flex flex-col gap-6 overflow-y-auto">
        {/* Main Section */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Main</p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href} 

                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer mb-1 transition-colors ${
                  isActive 
                    ? 'bg-red-50 text-red-600 font-semibold dark:bg-red-500/10 dark:text-red-400' 
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Departments Section */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Services</p>
          {departments.map((dept) => {
            const isActive = pathname === dept.href;
            return (
              <Link 
                key={dept.href} 
                href={dept.href} 

                className={`block p-3 text-sm rounded-xl cursor-pointer mb-1 transition-colors ${
                  isActive 
                    ? 'bg-red-50 text-red-600 font-semibold dark:bg-red-500/10 dark:text-red-400' 
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200'
                }`}
              >
                {dept.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;