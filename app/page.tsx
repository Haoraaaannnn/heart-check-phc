'use client';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-red-100 font-sans flex flex-col">


      <nav className="flex items-center justify-between px-12 py-6">
        <span className="text-gray-800 font-bold text-lg">
          Heart Check <span className="text-[#cc3535]">PHC</span>
        </span>
        <div className="w-10"></div>
      </nav>

   
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-20">
        <h1 className="text-5xl font-black text-gray-800 mb-4 leading-tight">
          Heart Check <span className="text-[#cc3535]">PHC</span>
        </h1>
        <p className="text-xl text-gray-500 mb-2 max-w-lg">
          A Queueing Management System for the Out-Patient Department
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push('/monitor')}
            className="px-10 py-4 bg-[#cc3535] text-white rounded-full text-base font-bold hover:bg-red-700 transition shadow-lg active:scale-95"
          >
            Monitor
          </button>
          <button
            onClick={() => router.push('/kiosk/kiosk-services')}
            className="px-10 py-4 bg-white text-[#cc3535] border-2 border-[#cc3535] rounded-full text-base font-bold hover:bg-red-50 transition shadow-sm active:scale-95"
          >
            Patient Kiosk
          </button>
        </div>
      </div>

     
      <div className="px-12 pb-16 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto w-full">
        {[
          { icon: 'bx-list-ol', title: 'Queue Management', desc: 'Real-time patient queue tracking across all services' },
          { icon: 'bxs-message-dots', title: 'SMS Notifications', desc: 'Automatic SMS alerts when patients are called' },
          { icon: 'bxs-bar-chart-alt-2', title: 'Analytics', desc: 'Daily reports and patient flow insights' },
        ].map(card => (
          <div key={card.title} className="bg-white rounded-3xl p-6 shadow-sm border-2 border-red-100 flex flex-col gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center">
              <i className={`bx ${card.icon} text-xl text-[#cc3535]`}></i>
            </div>
            <h3 className="text-gray-700 font-semibold text-sm">{card.title}</h3>
            <p className="text-gray-400 text-xs leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

  
      <footer className="border-t border-red-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-12 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-gray-600 text-sm">
            Heart Check <span className="text-[#cc3535] font-medium">PHC</span>
          </span>
          
          <div className="flex items-center gap-8">
            <span 
              onClick={() => router.push('/login')}
              className="text-[#cc3535] hover:text-red-700 cursor-pointer transition font-semibold text-base px-4 py-2 rounded-lg hover:bg-red-50"
            >
              Staff Login
            </span>

          </div>
        </div>
      </footer>
    </div>
  );
}