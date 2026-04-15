'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { sendSMS } from '@/app/actions/sendSMS';
import { supabase } from '@/lib/supabase';

type Patient = {
  id: number;
  patientNum: string;
  status?: string;
  cubicleNum?: string;
  service?: string;
  created_at?: string;
  updated_at?: string;
  phoneNum?: number;
  started_at?: string;
  with_doctor_since?: string;
};

type Cubicle = {
  id: number;
  cubicleNum: string;
  category: string;
  room: number;
  subcategory?: string;
};

const CATEGORIES = [
  'Consultation', 'OPD Card', 'Refill Prescription', 'ECG',
  'Warfarin', 'OPD Reschedule', 'Benzathine'
];

const CONSULTATION_SUBCATEGORIES = ['Pedia', 'Adult'];

function ElapsedTimer({ startedAt }: { startedAt?: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isLong = elapsed > 600;
  return (
    <span className={`text-xs font-mono tabular-nums font-semibold ${isLong ? 'text-red-400' : 'text-green-500'}`}>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

export default function TransferPage() {
  const router = useRouter();
  const [onProgressPatients, setOnProgressPatients] = useState<Patient[]>([]);
  const [assignedPatients, setAssignedPatients] = useState<Record<string, Patient[]>>({});
  const [withDoctorPatients, setWithDoctorPatients] = useState<Patient[]>([]);
  const [dragging, setDragging] = useState<Patient | null>(null);
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [finishedPatients, setFinishedPatients] = useState<Patient[]>([]);
  const [speaking, setSpeaking] = useState<number | null>(null);

  const clearDrag = () => {
    setDragging(null);
    setDragOverTarget(null);
  };

  const speak = async (text: string, patientId: number, times: number = 3) => {
    setSpeaking(patientId);
    try {
      const response = await fetch(
        'https://api.deepgram.com/v1/speak?model=aura-2-amalthea-en',
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${process.env.NEXT_PUBLIC_DEEPGRAM_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        }
      );
      if (!response.ok) { setSpeaking(null); return; }
      const arrayBuffer = await response.arrayBuffer();
      const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      let count = 0;
      const audio = new Audio(audioUrl);
      const playOnce = async () => { audio.currentTime = 0; await audio.play(); count++; };
      audio.onended = () => {
        if (count < times) setTimeout(playOnce, 800);
        else { URL.revokeObjectURL(audioUrl); setSpeaking(null); }
      };
      await playOnce();
    } catch { setSpeaking(null); }
  };

  const fetchFinished = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const { data, error } = await supabase.from('patients').select('*')
      .eq('status', 'Done').gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString()).order('updated_at', { ascending: false });
    if (!error && data) setFinishedPatients(data);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace('/login'); return; }
    };
    checkSession();

    const fetchData = async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const { data, error } = await supabase.from('patients').select('*')
        .neq('status', 'Done').gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString()).order('created_at', { ascending: true });
      
      if (!error && data) {
        const inQueue = data.filter((p: Patient) => 
          p.status === 'On Progress' && !p.cubicleNum
        );
        
        const assigned = data.filter((p: Patient) => 
          p.status === 'Assigned' && p.cubicleNum
        );
        
        const withDoctor = data.filter((p: Patient) => p.status === 'With Doctor');
        
        setOnProgressPatients(inQueue);
        setWithDoctorPatients(withDoctor);
        
        const grouped: Record<string, Patient[]> = {};
        assigned.forEach((p: Patient) => {
          if (p.cubicleNum) {
            if (!grouped[p.cubicleNum]) grouped[p.cubicleNum] = [];
            grouped[p.cubicleNum].push(p);
          }
        });
        setAssignedPatients(grouped);
      }
    };

    const fetchCubicles = async () => {
      const { data, error } = await supabase.from('cubicle').select('*').order('id', { ascending: true });
      if (!error && data) setCubicles(data);
    };

    fetchData();
    fetchCubicles();
    fetchFinished();

    const channel = supabase.channel('patients-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
        fetchData(); fetchFinished();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  const handleAssignToCubicle = async (patient: Patient, cubicleNum: string) => {
    setOnProgressPatients(prev => prev.filter(p => p.id !== patient.id));
    setAssignedPatients(prev => ({
      ...prev,
      [cubicleNum]: [...(prev[cubicleNum] || []), { ...patient, cubicleNum, status: 'Assigned' }]
    }));
    
    await supabase.from('patients').update({ 
      cubicleNum, 
      status: 'Assigned'
    }).eq('id', patient.id);

    if (patient.phoneNum) {
      try {
        await sendSMS(
          String(patient.phoneNum),
          patient.patientNum,
          cubicleNum
        );
        console.log('SMS sent to:', patient.phoneNum);
      } catch (err) {
        console.error('SMS error:', err);
      }
    }
    
    clearDrag();
  };

  const handleMoveToWithDoctor = async (patient: Patient, cubicleNum: string) => {
    setAssignedPatients(prev => ({
      ...prev,
      [cubicleNum]: (prev[cubicleNum] || []).filter(p => p.id !== patient.id)
    }));
    setWithDoctorPatients(prev => [...prev, { 
      ...patient, 
      status: 'With Doctor', 
      with_doctor_since: new Date().toISOString(),
      cubicleNum: undefined
    }]);
    
    await supabase.from('patients').update({ 
      status: 'With Doctor',
      with_doctor_since: new Date().toISOString(),
      cubicleNum: null
    }).eq('id', patient.id);
  };

  const handleMoveBackToProgress = async (patient: Patient, oldCubicleNum: string) => {
    setAssignedPatients(prev => ({
      ...prev,
      [oldCubicleNum]: (prev[oldCubicleNum] || []).filter(p => p.id !== patient.id)
    }));
    setOnProgressPatients(prev => [...prev, { ...patient, cubicleNum: undefined, status: 'On Progress' }]);
    
    await supabase.from('patients').update({ 
      cubicleNum: null, 
      status: 'On Progress' 
    }).eq('id', patient.id);
  };

  const handleMoveBackFromDoctor = async (patient: Patient) => {
    setWithDoctorPatients(prev => prev.filter(p => p.id !== patient.id));
    setOnProgressPatients(prev => [...prev, { ...patient, cubicleNum: undefined, status: 'On Progress', with_doctor_since: undefined }]);
    
    await supabase.from('patients').update({ 
      cubicleNum: null, 
      status: 'On Progress',
      with_doctor_since: null
    }).eq('id', patient.id);
  };

  const handleFinish = async (patient: Patient) => {
    setOnProgressPatients(prev => prev.filter(p => p.id !== patient.id));
    setAssignedPatients(prev => {
      const updated = { ...prev };
      for (const key in updated) {
        updated[key] = updated[key].filter(p => p.id !== patient.id);
      }
      return updated;
    });
    setWithDoctorPatients(prev => prev.filter(p => p.id !== patient.id));
    
    await supabase.from('patients').update({ status: 'Done', cubicleNum: null }).eq('id', patient.id);
    await fetchFinished();
  };

  const isConsultation = selectedCategory === 'Consultation';

  const getAvailableRooms = () => {
    if (!selectedCategory) return [];
    
    if (isConsultation && selectedSubcategory) {
      const filteredCubicles = cubicles.filter(c => 
        c.category === selectedCategory && 
        c.subcategory === selectedSubcategory
      );
      return [...new Set(filteredCubicles.map(c => c.room))].sort();
    } else if (!isConsultation) {
      const filteredCubicles = cubicles.filter(c => c.category === selectedCategory);
      return [...new Set(filteredCubicles.map(c => c.room))].sort();
    }
    
    return [];
  };

  const rooms = getAvailableRooms();

  const getVisibleCubicles = () => {
    if (isConsultation && selectedSubcategory && selectedRoom) {
      return cubicles.filter(c => 
        c.category === selectedCategory && 
        c.subcategory === selectedSubcategory && 
        c.room === selectedRoom
      );
    } else if (isConsultation && selectedSubcategory && !selectedRoom) {
      return cubicles.filter(c => 
        c.category === selectedCategory && 
        c.subcategory === selectedSubcategory
      );
    } else if (!isConsultation && selectedCategory && !selectedRoom) {
      return cubicles.filter(c => c.category === selectedCategory);
    }
    return [];
  };

  const visibleCubicles = getVisibleCubicles();
  
  const visibleOnProgress = onProgressPatients.filter(p => {
    if (!selectedCategory) return true;
    return p.service === selectedCategory;
  });
  
  const visibleWithDoctor = withDoctorPatients.filter(p => {
    if (!selectedCategory) return true;
    return p.service === selectedCategory;
  });

  const handleDragStart = (e: React.DragEvent, patient: Patient) => {
    e.dataTransfer.setData('text/plain', patient.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    const dragImage = document.createElement('div');
    dragImage.textContent = patient.patientNum;
    dragImage.style.backgroundColor = '#cc3535';
    dragImage.style.color = 'white';
    dragImage.style.padding = '8px 16px';
    dragImage.style.borderRadius = '9999px';
    dragImage.style.fontSize = '14px';
    dragImage.style.fontWeight = 'bold';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 20, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
    setDragging(patient);
  };

  const handleDragOver = (e: React.DragEvent, cubicleNum: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(cubicleNum);
  };

  const handleDrop = (e: React.DragEvent, cubicleNum: string) => {
    e.preventDefault();
    if (dragging) {
      handleAssignToCubicle(dragging, cubicleNum);
    }
    setDragOverTarget(null);
  };

  const CubicleCard = ({ cubicle }: { cubicle: Cubicle }) => {
    const assigned = assignedPatients[cubicle.cubicleNum] || [];
    const isOver = dragOverTarget === cubicle.cubicleNum;
    
    return (
      <div
        onDragOver={(e) => handleDragOver(e, cubicle.cubicleNum)}
        onDragLeave={() => setDragOverTarget(null)}
        onDrop={(e) => handleDrop(e, cubicle.cubicleNum)}
        className={`bg-white border-2 rounded-3xl p-4 flex flex-col gap-2 min-h-36 shadow-sm transition-all duration-150 ${
          isOver ? 'border-[#cc3535] bg-red-50 scale-105' : 'border-gray-100 hover:border-red-200'
        }`}
      >
        <span className="text-gray-700 font-semibold text-xs">{cubicle.cubicleNum}</span>
        {assigned.length === 0 && <p className="text-gray-300 text-xs">Drop patient here</p>}
        <div className="flex flex-col gap-1">
          {assigned.map(p => (
            <div key={p.id} className="flex items-center gap-1">
              <span
                draggable
                onDragStart={(e) => handleDragStart(e, p)}
                onDragEnd={clearDrag}
                className={`px-2 py-1 bg-[#cc3535] text-white rounded-full text-xs font-medium cursor-grab active:cursor-grabbing select-none hover:bg-red-700 transition ${
                  dragging?.id === p.id ? 'opacity-40' : 'opacity-100'
                }`}
              >
                {p.patientNum}
              </span>
              <button
                onClick={() => {
                  const num = p.patientNum;
                  const letter = num.charAt(0);
                  const digits = parseInt(num.slice(1), 10).toString();
                  speak(`Number ${letter} ${digits}, Number ${letter} ${digits}, go to ${cubicle.cubicleNum}`, p.id);
                }}
                disabled={speaking === p.id}
                className={`w-5 h-5 rounded-full flex items-center justify-center transition shrink-0 ${
                  speaking === p.id ? 'bg-blue-300 text-white cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-200 text-blue-500'
                }`}
              >
                <i className={`bx ${speaking === p.id ? 'bx-loader-alt animate-spin' : 'bxs-volume-full'} text-xs`}></i>
              </button>
              <button
                onClick={() => handleMoveToWithDoctor(p, cubicle.cubicleNum)}
                title="With Doctor"
                className="w-5 h-5 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition shrink-0"
              >
                <i className="bx bx-user-plus text-xs"></i>
              </button>
              <button
                onClick={() => handleMoveBackToProgress(p, cubicle.cubicleNum)}
                title="Move back to queue"
                className="w-5 h-5 bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-full flex items-center justify-center transition shrink-0"
              >
                <i className="bx bx-undo text-xs"></i>
              </button>
              <button
                onClick={() => handleFinish(p)}
                title="Complete"
                className="w-5 h-5 bg-green-100 hover:bg-green-200 text-green-500 rounded-full flex items-center justify-center transition shrink-0"
              >
                <i className="bx bx-check text-xs"></i>
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const OnProgressSection = () => (
    <div className="bg-white border-2 border-green-100 rounded-3xl shadow-sm p-5">
      <h2 className="text-green-500 font-semibold text-xs mb-3 tracking-widest uppercase flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block"></span>
        On Progress Queue ({visibleOnProgress.length})
        <span className="text-xs text-gray-400 font-normal ml-2">(Drag to cubicles below)</span>
      </h2>
      {visibleOnProgress.length === 0 && (
        <p className="text-gray-300 text-xs">No patients in queue</p>
      )}
      {visibleOnProgress.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleOnProgress.map((p, index) => (
            <div 
              key={p.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, p)}
              onDragEnd={clearDrag}
              className={`border rounded-2xl p-3 flex flex-col gap-2 cursor-grab active:cursor-grabbing ${
                index < 5 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-yellow-200 bg-yellow-50'
              } ${dragging?.id === p.id ? 'opacity-40' : 'opacity-100'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[#cc3535] font-black text-lg">{p.patientNum}</span>
                <ElapsedTimer startedAt={p.started_at} />
              </div>
              <span className="text-gray-500 text-xs font-medium">{p.service}</span>
              <div className="text-xs">
                {index < 5 ? (
                  <span className="text-green-600">Position: {index + 1} (Next)</span>
                ) : (
                  <span className="text-yellow-600">Position: {index + 1} (Waiting)</span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => {
                    const num = p.patientNum;
                    const letter = num.charAt(0);
                    const digits = parseInt(num.slice(1), 10).toString();
                    speak(`Number ${letter} ${digits}, Number ${letter} ${digits}, go to the consultation area`, p.id);
                  }}
                  disabled={speaking === p.id}
                  className={`w-full flex items-center justify-center gap-1 py-1 rounded-xl text-xs font-medium transition ${
                    speaking === p.id ? 'bg-blue-100 text-blue-300 cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100 text-blue-500'
                  }`}
                >
                  <i className={`bx ${speaking === p.id ? 'bx-loader-alt animate-spin' : 'bxs-volume-full'} text-xs`}></i>
                  <span>Call</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const WithDoctorSection = () => (
    <div className="bg-white border-2 border-purple-100 rounded-3xl shadow-sm p-5">
      <h2 className="text-purple-500 font-semibold text-xs mb-3 tracking-widest uppercase flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse inline-block"></span>
        With Doctor ({visibleWithDoctor.length})
      </h2>
      {visibleWithDoctor.length === 0 && (
        <p className="text-gray-300 text-xs">No patients with doctor</p>
      )}
      {visibleWithDoctor.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {visibleWithDoctor.map(p => (
            <div key={p.id} className="border border-purple-100 rounded-2xl p-3 flex flex-col gap-2 bg-purple-50">
              <div className="flex items-center justify-between">
                <span className="text-[#cc3535] font-black text-lg">{p.patientNum}</span>
                <ElapsedTimer startedAt={p.with_doctor_since} />
              </div>
              <span className="text-gray-500 text-xs font-medium">{p.service}</span>
              <div className="flex items-center gap-1 mt-1">
                <button
                  onClick={() => handleMoveBackFromDoctor(p)}
                  className="flex-1 flex items-center justify-center gap-1 py-1 rounded-xl text-xs font-medium bg-yellow-50 hover:bg-yellow-100 text-yellow-600 transition"
                >
                  <i className="bx bx-undo text-xs"></i>
                  <span>Back</span>
                </button>
                <button
                  onClick={() => handleFinish(p)}
                  className="flex-1 flex items-center justify-center gap-1 py-1 rounded-xl text-xs font-medium bg-green-50 hover:bg-green-100 text-green-500 transition"
                >
                  <i className="bx bx-check text-sm"></i>
                  <span>Done</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const FinishedTable = () => (
    <div className="bg-white border-2 border-gray-100 rounded-3xl shadow-sm p-5">
      <h2 className="text-gray-400 font-semibold text-xs mb-3 tracking-widest uppercase">Finished Today ({finishedPatients.length})</h2>
      {finishedPatients.length === 0 ? (
        <p className="text-gray-300 text-xs">No finished patients yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs border-b border-gray-100">
                <th className="text-left pb-2 font-medium">Queue No.</th>
                <th className="text-left pb-2 font-medium">Service</th>
                <th className="text-left pb-2 font-medium">Cubicle</th>
                <th className="text-left pb-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {finishedPatients.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-2 font-semibold text-[#cc3535]">{p.patientNum}</td>
                  <td className="py-2 text-gray-600">{p.service}</td>
                  <td className="py-2 text-gray-600">{p.cubicleNum || '-'}</td>
                  <td className="py-2 text-gray-400">{p.updated_at ? new Date(p.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-linear-to-br from-white via-red-50 to-red-100 font-sans">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-end px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-red-100 shadow-sm">
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 transition">
              <i className="bx bxs-bell text-lg text-gray-500"></i>
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.replace('/login'); }}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-50 transition"
            >
              <i className="bx bx-log-out text-lg text-gray-500"></i>
            </button>
          </div>
        </div>

        <div className="px-8 py-6 flex gap-5 h-[calc(100vh-73px)] overflow-hidden">
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <button onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setSelectedRoom(null); }}
                className={`hover:text-[#cc3535] transition ${!selectedCategory ? 'text-[#cc3535] font-semibold' : ''}`}>
                Services
              </button>
              {selectedCategory && (<><span>/</span>
                <button onClick={() => { setSelectedSubcategory(null); setSelectedRoom(null); }}
                  className={`hover:text-[#cc3535] transition ${selectedCategory && !selectedSubcategory && !selectedRoom ? 'text-[#cc3535] font-semibold' : ''}`}>
                  {selectedCategory}
                </button></>
              )}
              {isConsultation && selectedSubcategory && (<><span>/</span>
                <button onClick={() => setSelectedRoom(null)}
                  className={`hover:text-[#cc3535] transition ${selectedSubcategory && !selectedRoom ? 'text-[#cc3535] font-semibold' : ''}`}>
                  {selectedSubcategory}
                </button></>
              )}
              {selectedRoom && (<><span>/</span>
                <span className="text-[#cc3535] font-semibold">Room {selectedRoom}</span></>
              )}
            </div>

            {!selectedCategory && (
              <>
                <div className="grid grid-cols-4 gap-3">
                  {CATEGORIES.map(cat => {
                    const inProg = onProgressPatients.filter(p => p.service === cat).length;
                    return (
                      <button key={cat} onClick={() => setSelectedCategory(cat)}
                        className="bg-white border-2 border-gray-100 hover:border-red-200 rounded-3xl p-6 flex flex-col gap-2 shadow-sm transition text-left">
                        <span className="text-gray-700 font-semibold text-sm">{cat}</span>
                        {inProg > 0 && <span className="text-xs text-green-500 font-medium">{inProg} in queue</span>}
                      </button>
                    );
                  })}
                </div>
                <OnProgressSection />
                <WithDoctorSection />
                <FinishedTable />
              </>
            )}

            {selectedCategory === 'Consultation' && !selectedSubcategory && (
              <div className="flex flex-col gap-4">
                <OnProgressSection />
                <div className="grid grid-cols-2 gap-3">
                  {CONSULTATION_SUBCATEGORIES.map(sub => (
                    <button key={sub} onClick={() => setSelectedSubcategory(sub)}
                      className="bg-white border-2 border-gray-100 hover:border-red-200 rounded-3xl p-6 flex flex-col gap-2 shadow-sm transition text-left">
                      <span className="text-gray-700 font-semibold text-sm">{sub}</span>
                    </button>
                  ))}
                </div>
                <WithDoctorSection />
                <FinishedTable />
              </div>
            )}

            {selectedCategory === 'Consultation' && selectedSubcategory && !selectedRoom && (
              <div className="flex flex-col gap-4">
                <OnProgressSection />
                {rooms.length === 0 ? (
                  <div className="bg-white border-2 border-orange-100 rounded-3xl p-8 text-center">
                    <i className="bx bx-info-circle text-4xl text-orange-400 mb-2 block"></i>
                    <p className="text-gray-600 font-medium">No cubicles configured for {selectedSubcategory}</p>
                    <p className="text-gray-400 text-sm mt-1">Please check the cubicle database configuration</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {rooms.map(room => {
                      const roomCubicles = cubicles.filter(c => c.category === 'Consultation' && c.subcategory === selectedSubcategory && c.room === room);
                      const totalAssigned = roomCubicles.reduce((sum, c) => sum + (assignedPatients[c.cubicleNum]?.length ?? 0), 0);
                      return (
                        <button key={room} onClick={() => setSelectedRoom(room)}
                          className="bg-white border-2 border-gray-100 hover:border-red-200 rounded-3xl p-6 flex flex-col gap-2 shadow-sm transition text-left">
                          <span className="text-gray-700 font-semibold text-sm">Room {room}</span>
                          {totalAssigned > 0 && <span className="text-xs text-orange-400 font-medium">{totalAssigned} assigned</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
                <WithDoctorSection />
                <FinishedTable />
              </div>
            )}

            {selectedCategory === 'Consultation' && selectedSubcategory && selectedRoom && (
              <div className="flex flex-col gap-4">
                <OnProgressSection />
                {visibleCubicles.length === 0 ? (
                  <div className="bg-white border-2 border-orange-100 rounded-3xl p-8 text-center">
                    <i className="bx bx-info-circle text-4xl text-orange-400 mb-2 block"></i>
                    <p className="text-gray-600 font-medium">No cubicles configured for {selectedSubcategory}</p>
                    <p className="text-gray-400 text-sm mt-1">Please check the cubicle database configuration</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-3">
                    {visibleCubicles.map(cubicle => <CubicleCard key={cubicle.id} cubicle={cubicle} />)}
                  </div>
                )}
                <WithDoctorSection />
                <FinishedTable />
              </div>
            )}

            {selectedCategory && selectedCategory !== 'Consultation' && !selectedRoom && (
              <div className="flex flex-col gap-4">
                <OnProgressSection />
                {visibleCubicles.length === 0 ? (
                  <div className="bg-white border-2 border-orange-100 rounded-3xl p-8 text-center">
                    <i className="bx bx-info-circle text-4xl text-orange-400 mb-2 block"></i>
                    <p className="text-gray-600 font-medium">No cubicles configured for {selectedCategory}</p>
                    <p className="text-gray-400 text-sm mt-1">Please check the cubicle database configuration</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {visibleCubicles.map(cubicle => <CubicleCard key={cubicle.id} cubicle={cubicle} />)}
                  </div>
                )}
                <WithDoctorSection />
                <FinishedTable />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}