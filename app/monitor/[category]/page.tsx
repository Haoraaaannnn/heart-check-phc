'use client';

/**
 * @fileoverview Dynamic department and service queue monitor page (/monitor/[category]).
 *
 * Renders real-time patient queue visualization for waiting areas and clinic hallways.
 * Enforces zero scrolling and fluid viewport height adaptability across all monitor
 * screen sizes (Full HD, 4K, 720p, laptops, and tablets).
 *
 * @module app/monitor/[category]/page
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Header } from '@/app/monitor/components/Header';
import { Footer } from '@/app/monitor/components/Footer';
import { PairedLayout } from '@/app/monitor/components/PairedLayout';
import { TableLayout } from '@/app/monitor/components/TableLayout';
import { StartScreen } from '@/app/monitor/components/StartScreen';
import { RegistrationLayout } from '@/app/monitor/components/RegistrationLayout';
import { useMonitorData } from '@/app/monitor/hooks/useMonitorData';
import { useRealtimeSubscription } from '@/app/monitor/hooks/useRealtimeSubscription';
import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';


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
    cubicleDoctorMap,
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
      <div className={MONITOR_STYLES.viewport.container}>
        <Header title="Registration" currentTime={currentTime} />
        <main className={MONITOR_STYLES.viewport.main}>
          <RegistrationLayout patients={registrationPatients} />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isTableLayoutService) {
    return (
      <div className={MONITOR_STYLES.viewport.container}>
        <Header title={displayTitle} currentTime={currentTime} />
        <main className={MONITOR_STYLES.viewport.main}>
          <PairedLayout
            title={displayTitle}
            pairedData={getPairedData()}
            formatCubicleDisplay={formatCubicleDisplay}
            cubicleDoctorMap={cubicleDoctorMap}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={MONITOR_STYLES.viewport.container}>
      <Header title={displayTitle} currentTime={currentTime} />
      <main className={MONITOR_STYLES.viewport.main}>
        <TableLayout
          title={displayTitle}
          cubicles={cubicles}
          assignedPatients={assignedPatients}
          formatCubicleDisplay={formatCubicleDisplay}
          cubicleDoctorMap={cubicleDoctorMap}
        />
      </main>
      <Footer />
    </div>
  );
}