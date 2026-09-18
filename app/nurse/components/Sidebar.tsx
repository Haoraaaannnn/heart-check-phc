'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Cubicle } from '@/types/Types';
import { CATEGORY_ICONS } from '../lib/constants';

type SidebarProps = {
  sidebarOpen: boolean;
  selectedCategory: string | null;
  selectedCubicleNum: string | null;
  categoryCounts: Record<string, number>;
  assignedCubicles: Cubicle[];
  onSelectCategory: (category: string | null) => void;
  onSelectCubicle: (cubicleNum: string) => void;
  onToggleSidebar: () => void;
};

export function Sidebar({
  sidebarOpen,
  selectedCategory,
  selectedCubicleNum,
  categoryCounts,
  assignedCubicles,
  onSelectCategory,
  onSelectCubicle,
  onToggleSidebar,
}: SidebarProps) {
  const router = useRouter();

  const services = assignedCubicles.reduce<Record<string, Cubicle[]>>(
    (groups, cubicle) => {
      groups[cubicle.category] ??= [];
      groups[cubicle.category].push(cubicle);
      return groups;
    },
    {}
  );

  const totalPatients = Object.values(categoryCounts).reduce(
    (total, count) => total + count,
    0
  );

  return (
    <aside
      className="fixed left-0 top-0 z-20 flex h-full flex-col border-r border-gray-200 bg-white shadow-lg transition-all duration-300"
      style={{ width: sidebarOpen ? '280px' : '64px' }}
    >
    <div
      className={`flex items-center border-b border-gray-200 ${
        sidebarOpen ? 'justify-between p-4' : 'justify-center p-2'
      }`}
    >

        <button
          onClick={onToggleSidebar}
          className={`rounded-lg p-2 text-gray-500 hover:bg-gray-100 ${
            !sidebarOpen ? 'mx-auto' : ''
          }`}
        >
          <i
            className={`bx ${
              sidebarOpen ? 'bx-chevron-left' : 'bx-chevron-right'
            } text-xl`}
          />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        <button
          onClick={() => onSelectCategory(null)}
          className={`mb-5 flex w-full items-center
          ${sidebarOpen ? 'justify-between px-4' : 'justify-center px-0'} rounded-xl px-4 py-3 text-left transition ${
            !selectedCategory && !selectedCubicleNum
              ? 'bg-[#cc3535] text-white shadow-md'
              : 'text-gray-700 hover:bg-red-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <i className="bx bx-grid-alt text-xl" />
            {sidebarOpen && (
              <span className="text-sm font-semibold">All my cubicles</span>
            )}
          </div>

          {sidebarOpen && totalPatients > 0 && (
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#cc3535]">
              {totalPatients}
            </span>
          )}
        </button>

        {sidebarOpen && (
          <p className="mb-2 px-2 text-xs font-bold uppercase tracking-wide text-gray-400">
            My coverage
          </p>
        )}

        <div className="space-y-3">
          {Object.entries(services).map(([service, cubicles]) => {
            const isServiceActive =
              selectedCategory === service && !selectedCubicleNum;

            return (
              <div key={service}>
                <button
                  onClick={() => onSelectCategory(service)}
                  className={`flex w-full items-center
                  ${sidebarOpen ? 'justify-between px-4' : 'justify-center px-0'} rounded-lg px-3 py-2.5 text-left transition ${
                    isServiceActive
                      ? 'bg-red-50 text-[#cc3535]'
                      : 'text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <i
                      className={`bx ${
                        CATEGORY_ICONS[service] || 'bx-folder'
                      } text-lg`}
                    />
                    <span
                      className={`text-sm font-semibold ${
                        sidebarOpen ? 'block' : 'hidden'
                      }`}
                    >
                      {service}
                    </span>
                  </div>

                  {sidebarOpen && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                      {categoryCounts[service] || 0}
                    </span>
                  )}
                </button>

                {sidebarOpen && (
                  <div className="ml-5 mt-1 space-y-1 border-l border-gray-200 pl-3">
                    {cubicles.map((cubicle) => {
                      const active = selectedCubicleNum === cubicle.cubicleNum;

                      return (
                        <button
                          key={cubicle.id}
                          onClick={() => onSelectCubicle(cubicle.cubicleNum)}
                          className={`w-full rounded-lg px-3 py-2 text-left transition ${
                            active
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          <p className="text-xs font-bold">
                            {cubicle.cubicleNum}
                          </p>
                          <p
                            className={`mt-0.5 text-[11px] ${
                              active ? 'text-blue-100' : 'text-gray-400'
                            }`}
                          >
                            Room {cubicle.room}
                            {cubicle.subcategory
                              ? ` · ${cubicle.subcategory}`
                              : ''}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace('/login');
          }}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-gray-600 hover:bg-red-50 hover:text-[#cc3535] ${
            !sidebarOpen ? 'justify-center' : ''
          }`}
        >
          <i className="bx bx-log-out text-lg" />
          {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}