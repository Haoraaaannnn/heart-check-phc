'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PairedLayout } from '../components/PairedLayout';
import { TableLayout } from '../components/TableLayout';
import { StartScreen } from '../components/StartScreen';
import { RegistrationLayout } from '../components/RegistrationLayout';
import { useMonitorData } from '../hooks/useMonitorData';
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

export default function CategoryMonitorPage() {
  const router = useRouter();
  const params = useParams();
  const categoryParam = decodeURIComponent(params.category as string);
  
  const [category, subcategory] = categoryParam.includes('-') 
    ? categoryParam.split('-') 
    : [categoryParam, null];
  
  const [started, setStarted] = useState(false);

  const isRegistration = category === 'Registration';
  
  const {
    assignedPatients,
    cubicles,
    currentTime,
    setCurrentTime,
    fetchCubicles,
    fetchPatients,
    fetchRegistrationPatients,
    registrationPatients,
    formatCubicleDisplay,
    isTableLayoutService,
    setupRegistrationSubscription,
  } = useMonitorData(category, subcategory, categoryParam, isRegistration);

  useRealtimeSubscription(`monitor-${categoryParam}`, category, () => {
    if (isRegistration) {
      fetchRegistrationPatients();
    } else {
      fetchPatients();
    }
  });

  useEffect(() => {
    if (isRegistration) {
      const cleanup = setupRegistrationSubscription(() => {
        fetchRegistrationPatients();
      });
      return cleanup;
    }
  }, [isRegistration]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace('/login'); return; }
    };
    checkSession();
    
    if (isRegistration) {
      fetchRegistrationPatients();

      const interval = setInterval(() => {
        fetchRegistrationPatients();
      }, 3000);
      return () => clearInterval(interval);
    } else {
      fetchCubicles();
      fetchPatients();
    }
    
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const getPairedData = () => {
    const cubicleList = [...new Set(cubicles.map(c => c.cubicleNum))];
    const maxLength = Math.max(assignedPatients.length, cubicleList.length);
    const pairs: { patient: any; cubicle: string }[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      pairs.push({
        patient: assignedPatients[i] || null,
        cubicle: cubicleList[i] || (cubicleList.length > 0 ? cubicleList[i % cubicleList.length] : '')
      });
    }
    return pairs;
  };

  const displayTitle = subcategory ? `${category} - ${subcategory}` : category;

  if (!started) {
    return <StartScreen category={category} subcategory={subcategory} onStart={() => setStarted(true)} />;
  }

  if (isRegistration) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <Header title="Registration" currentTime={currentTime} />
        <RegistrationLayout patients={registrationPatients} />
        <div className="bg-gray-100 border-t border-gray-200 px-12 py-6 flex items-center justify-between fixed bottom-0 left-0 right-0">
          <p className="text-gray-500 text-xl">Pumunta po sa nababakang computer.</p>
          <p className="text-gray-500 text-xl">Pumuntahan ang mga datos na distansya.</p>
        </div>
      </div>
    );
  }

  if (!isTableLayoutService) {
    return (
      <div className="min-h-screen bg-white font-sans">
        <Header title={displayTitle} currentTime={currentTime} />
        <PairedLayout
          title={displayTitle}
          pairedData={getPairedData()}
          formatCubicleDisplay={formatCubicleDisplay}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header title={displayTitle} currentTime={currentTime} />
      <TableLayout
        title={displayTitle}
        cubicles={cubicles}
        assignedPatients={assignedPatients}
        formatCubicleDisplay={formatCubicleDisplay}
      />
      <Footer />
    </div>
  );
}