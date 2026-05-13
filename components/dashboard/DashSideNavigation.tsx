"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import 'boxicons/css/boxicons.min.css';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { label: 'Overview', href: '/dashboard', icon: 'bxs-dashboard'},
    { label: 'Analytics', href: '/dashboard/analytics', icon: 'bxs-objects-vertical-bottom' },
    /*{ label: 'Cubicles', href: '/dashboard/cubicles' },*/
    { label: 'Patients', href: '/dashboard/patients', icon: 'bx-male-female' },
  ];

  const departments = [
    { name: 'Consultation', href: '/dashboard/servicesPHC/consultation', icon: 'bx-chat' },
    { name: 'OPD Card', href: '/dashboard/servicesPHC/opdCard', icon:'bx-id-card' },
    { name: 'Refill Prescription', href: '/dashboard/servicesPHC/refillPrescription', icon:'bx-capsule' },
    { name: 'ECG', href: '/dashboard/servicesPHC/ecg', icon:'bx-heart' },
    { name: 'Warfarin', href: '/dashboard/servicesPHC/warfarin', icon:'bxs-capsule' },
    { name: 'OPD Reschedule', href: '/dashboard/servicesPHC/opdReschedule', icon:'bx-calendar' },
    { name: 'Benzathine', href: '/dashboard/servicesPHC/benzathine', icon:'bx-injection' },
    { name: 'OPD Screening', href: '/dashboard/servicesPHC/opdScreening', icon:'bx-search-alt-2' }
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

                className={`flex items-center text-sm p-3 gap-3 rounded-xl cursor-pointer mb-1 transition-colors ${
                  isActive 
                    ? 'bg-red-50 text-red-600 font-semibold dark:bg-red-500/10 dark:text-red-400' 
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200'
                }`}
              >
                <i className={`bx ${item.icon}`}></i>
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

                className={`flex items-center text-sm p-3 gap-3 rounded-xl cursor-pointer mb-1 transition-colors ${
                  isActive 
                    ? 'bg-red-50 text-red-600 font-semibold dark:bg-red-500/10 dark:text-red-400' 
                    : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50 dark:hover:text-gray-200'
                }`}
              >
              <i className={`bx ${dept.icon}`}></i>
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