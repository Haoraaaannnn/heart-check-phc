'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CATEGORIES, CATEGORY_ICONS } from '../lib/constants';

type SidebarProps = {
  sidebarOpen: boolean;
  selectedCategory: string | null;
  queueCounts: Record<string, number>;
  onSelectCategory: (category: string) => void;
  onToggleSidebar: () => void;
};

export function Sidebar({ sidebarOpen, selectedCategory, queueCounts, onSelectCategory, onToggleSidebar }: SidebarProps) {
  const router = useRouter();

  const CategoryItem = ({ category }: { category: string }) => {
    const queueCount = queueCounts[category] || 0;
    const isActive = selectedCategory === category;
    const icon = CATEGORY_ICONS[category] || 'bx-folder';
    
    return (
      <button
        onClick={() => onSelectCategory(category)}
        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${
          isActive 
            ? 'bg-[#cc3535] text-white shadow-md' 
            : 'text-gray-700 hover:bg-red-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <i className={`bx ${icon} text-xl ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-[#cc3535]'}`}></i>
          <span className={`text-sm font-medium ${!sidebarOpen ? 'hidden' : 'block'}`}>
            {category}
          </span>
        </div>
        {queueCount > 0 && (
          <span className={`${sidebarOpen ? 'text-xs px-2 py-0.5' : 'text-[10px] w-5 h-5 flex items-center justify-center'} rounded-full ${
            isActive 
              ? 'bg-white text-[#cc3535]' 
              : 'bg-red-100 text-[#cc3535]'
          }`}>
            {queueCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div 
      className={`fixed left-0 top-0 h-full bg-white/95 backdrop-blur-sm border-r border-red-100 shadow-xl transition-all duration-300 z-20 flex flex-col ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-red-100">
        {sidebarOpen && (
          <div className="flex items-center gap-2">
            <span className="text-gray-800 font-bold text-sm">Patient Transfer</span>
          </div>
        )}
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-500 hover:text-[#cc3535] ${!sidebarOpen && 'mx-auto'}`}
        >
          <i className={`bx ${sidebarOpen ? 'bx-chevron-left' : 'bx-chevron-right'} text-xl`}></i>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <div className="space-y-1 px-2">
          {CATEGORIES.map(category => (
            <CategoryItem key={category} category={category} />
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-red-100">
        <button
          onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-[#cc3535] transition-colors ${!sidebarOpen && 'justify-center'}`}
        >
          <i className="bx bx-log-out text-lg"></i>
          {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}