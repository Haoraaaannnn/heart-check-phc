'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const CATEGORIES = [
  { name: 'Consultation', hasSubcategories: true },
  { name: 'Registration', hasSubcategories: false },
  { name: 'OPD Card', hasSubcategories: false },
  { name: 'Refill Prescription', hasSubcategories: false },
  { name: 'ECG', hasSubcategories: false },
  { name: 'Warfarin', hasSubcategories: false },
  { name: 'OPD Reschedule', hasSubcategories: false },
  { name: 'Benzathine', hasSubcategories: false },
  { name: 'OPD Screening', hasSubcategories: false }
];

const SUB_CATEGORIES = ['Pedia', 'Adult'];

export default function MonitorIndexPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (cat: { name: string; hasSubcategories: boolean }) => {
    if (cat.hasSubcategories) {
      setSelectedCategory(cat.name);
    } else {
      router.push(`/monitor/${encodeURIComponent(cat.name)}`);
    }
  };

  const handleSubCategoryClick = (sub: string) => {
    if (selectedCategory) {
      router.push(`/monitor/${encodeURIComponent(selectedCategory)}-${encodeURIComponent(sub)}`);
    }
  };

  if (selectedCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-8 p-12">
        <button
          onClick={() => setSelectedCategory(null)}
          className="fixed top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-[#cc3535] transition group"
        >
          <i className="bx bx-arrow-back text-xl group-hover:-translate-x-1 transition-transform"></i>
          <span className="text-sm font-medium">Back to Categories</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-700">Select {selectedCategory} Type</h1>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {SUB_CATEGORIES.map(sub => (
            <button
              key={sub}
              onClick={() => handleSubCategoryClick(sub)}
              className="bg-white border-2 border-gray-100 hover:border-[#cc3535] hover:text-[#cc3535] rounded-3xl p-6 text-gray-700 font-semibold text-sm shadow-sm transition text-left"
            >
              {sub}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-8 p-12">
      <button
        onClick={() => router.push('/')}
        className="fixed top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-[#cc3535] transition group"
      >
        <i className="bx bx-arrow-back text-xl group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-sm font-medium">Back to Home</span>
      </button>
      <h1 className="text-3xl font-bold text-gray-700">Select Monitor</h1>
      <div className="grid grid-cols-3 gap-4 w-full max-w-2xl">
        {CATEGORIES.map(cat => (
          <button
            key={cat.name}
            onClick={() => handleCategoryClick(cat)}
            className="bg-white border-2 border-gray-100 hover:border-[#cc3535] hover:text-[#cc3535] rounded-3xl p-6 text-gray-700 font-semibold text-sm shadow-sm transition text-left"
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}