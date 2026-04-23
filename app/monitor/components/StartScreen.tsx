'use client';
import { useRouter } from 'next/navigation';

type StartScreenProps = {
  category: string;
  subcategory: string | null;
  onStart: () => void;
};

export function StartScreen({ category, subcategory, onStart }: StartScreenProps) {
  const router = useRouter();
  const displayTitle = subcategory ? `${category} - ${subcategory}` : category;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
      <button
        onClick={() => router.push('/monitor')}
        className="fixed top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-[#cc3535] transition group"
      >
        <i className="bx bx-arrow-back text-xl group-hover:-translate-x-1 transition-transform"></i>
        <span className="text-sm font-medium">Back to Services</span>
      </button>
      <div className="w-16 h-16 bg-[#cc3535] rounded-2xl flex items-center justify-center">
        <i className="bx bx-plus-medical text-3xl text-white"></i>
      </div>
      <h1 className="text-3xl font-bold text-gray-700">{displayTitle} Monitor</h1>
      <button
        onClick={() => {
          const audio = new Audio();
          audio.play().catch(() => {});
          onStart();
        }}
        className="px-12 py-5 bg-[#cc3535] text-white text-2xl font-bold rounded-3xl hover:bg-red-700 transition shadow-lg"
      >
        Start Monitor
      </button>
    </div>
  );
}