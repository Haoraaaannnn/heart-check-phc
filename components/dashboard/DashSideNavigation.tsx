"use client"; // Required for usePathname()

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { label: 'Overview', href: '/dashboard' },
    { label: 'Analytics', href: '/dashboard/analytics' },
    { label: 'Counters', href: '/dashboard/counters' },
    { label: 'Patients', href: '/dashboard/patients' },
  ];

  const departments = [
    { name: 'Consultation', href: '/dashboard/opd' },
    { name: 'OPD Card', href: '/dashboard/laboratory' },
    { name: 'Refill Prescription', href: '/dashboard/pharmacy' },
    { name: 'ECG', href: '/dashboard/ecg' },
    { name: 'Warfarin', href: '/dashboard/dental' },
    { name: 'OPD Reschedule', href: '/dashboard/pediatrics' },
    { name: 'Benzathine', href: '/dashboard/benzathine' },
    { name: 'OPD Screening', href: '/dashboard/screening' }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col p-6 gap-8 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-bold text-red-800 text-lg leading-tight">Heart Check PHC</h1>
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
                  isActive ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="text-sm">{item.label}</span>
                {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
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
                  isActive ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-500 hover:bg-gray-50'
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