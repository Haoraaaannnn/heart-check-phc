'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Patient = {
  id: number;
  patientNum: string;
  status?: string;
  cubicleNum?: string;
  service?: string;
  phoneNum?: number;
  started_at?: string;
  with_doctor_since?: string;
};

export default function CategoryMonitorPage() {
  const params = useParams();
  const category = decodeURIComponent(params.category as string);

  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [started, setStarted] = useState(false);

  const announcedRef = useRef<Set<number>>(new Set());
  const speakingRef = useRef(false);

  const speak = async (text: string, times: number = 3) => {
    if (speakingRef.current) return;
    speakingRef.current = true;
    try {
      const response = await fetch(
        'https://api.deepgram.com/v1/speak?model=aura-2-atlas-en',
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${process.env.NEXT_PUBLIC_DEEPGRAM_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        }
      );
      if (!response.ok) { speakingRef.current = false; return; }
      const arrayBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      let count = 0;
      const audio = new Audio(audioUrl);
      const playOnce = () => { audio.currentTime = 0; audio.play(); count++; };
      audio.onended = () => {
        if (count < times) setTimeout(playOnce, 800);
        else { URL.revokeObjectURL(audioUrl); speakingRef.current = false; }
      };
      playOnce();
    } catch { speakingRef.current = false; }
  };

  useEffect(() => {
    const fetchPatients = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('service', category)
        .eq('status', 'Assigned')
        .not('cubicleNum', 'is', null)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: true });

      if (!error && data) {
        console.log('Monitor fetched patients:', data.map(p => ({ id: p.id, num: p.patientNum, status: p.status, cubicle: p.cubicleNum })));
        setAssignedPatients(data);

        const newlyAssigned = data.filter(
          (p: Patient) => !announcedRef.current.has(p.id)
        );
        for (const p of newlyAssigned) {
          announcedRef.current.add(p.id);
          const num = p.patientNum;
          const letter = num.charAt(0);
          const digits = parseInt(num.slice(1), 10).toString();
          const cubicleRaw = p.cubicleNum ?? '';
          const roomMatch = cubicleRaw.match(/R(\d+)/);
          const cubicleMatch = cubicleRaw.match(/C(\d+)$/);
          const roomNum = roomMatch ? roomMatch[1] : '';
          const cNum = cubicleMatch ? cubicleMatch[1] : '';
          const cubicleSpoken = roomNum && cNum ? `Room ${roomNum}, Cubicle ${cNum}` : cubicleRaw;
          const message = `Number ${letter} ${digits}, Number ${letter} ${digits}, proceed to ${cubicleSpoken}`;
          speak(message, 3);
        }
      }
    };

    fetchPatients();

    const channel = supabase
      .channel(`monitor-${category}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, (payload) => {
        console.log('Monitor real-time update:', payload);
        fetchPatients();
      })
      .subscribe();

    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(clockInterval);
    };
  }, [category]);

  if (!started) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 bg-[#cc3535] rounded-2xl flex items-center justify-center">
          <i className="bx bx-plus-medical text-3xl text-white"></i>
        </div>
        <h1 className="text-3xl font-bold text-gray-700">{category} Monitor</h1>
        <button
          onClick={() => {
            const audio = new Audio();
            audio.play().catch(() => {});
            setStarted(true);
          }}
          className="px-12 py-5 bg-[#cc3535] text-white text-2xl font-bold rounded-3xl hover:bg-red-700 transition shadow-lg"
        >
          Start Monitor
        </button>
      </div>
    );
  }


  const groupedByCubicle: Record<string, Patient[]> = {};
  assignedPatients.forEach(patient => {
    const cubicle = patient.cubicleNum || 'Unknown';
    if (!groupedByCubicle[cubicle]) groupedByCubicle[cubicle] = [];
    groupedByCubicle[cubicle].push(patient);
  });

  return (
    <div className="min-h-screen bg-white font-sans">

      <div className="bg-[#cc3535] px-12 py-6 flex items-center justify-between">
        <div>
          <p className="text-white/70 text-lg uppercase tracking-widest font-medium">OUT-PATIENT DIVISION</p>
          <h1 className="text-white text-5xl font-black">{category}</h1>
        </div>
        <div className="text-right">
          <p className="text-white text-5xl font-bold tabular-nums">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-white/70 text-lg">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>


      <div className="p-12">
        {assignedPatients.length === 0 ? (
          <div className="flex items-center justify-center h-[70vh]">
            <p className="text-gray-300 text-4xl font-bold">No patients being served</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(groupedByCubicle).map(([cubicle, patients]) => (
              <div key={cubicle} className="bg-gray-50 rounded-3xl p-6 shadow-lg border-2 border-gray-100">
                <h2 className="text-gray-600 text-xl font-semibold mb-4 uppercase tracking-wider">
                  {cubicle}
                </h2>
                <div className="space-y-3">
                  {patients.map(patient => (
                    <div
                      key={patient.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between"
                    >
                      <span className="text-[#cc3535] font-black text-3xl tabular-nums">
                        {patient.patientNum}
                      </span>
                      <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      <div className="bg-gray-100 border-t border-gray-200 px-12 py-4 flex items-center justify-between fixed bottom-0 left-0 right-0">
        <p className="text-gray-500 text-lg">Please wait for your number to be called</p>
        <p className="text-gray-500 text-lg">Hintayin ang inyong numero na tawaging</p>
      </div>
    </div>
  );
}