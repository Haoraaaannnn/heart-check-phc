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
import { sortCubiclePatients } from '@/app/monitor/lib/sortCubiclePatients';


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
    activeCall,
  } = useMonitorData(category, subcategory, categoryParam, isRegistration, started);

  useRealtimeSubscription(`monitor-${categoryParam}`, category, () => {
    if (isRegistration) {
      fetchRegistrationPatients();
    } else {
      fetchCubicles();
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

      const interval = setInterval(() => {
        fetchCubicles();
        fetchPatients();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [category, subcategory, isRegistration]);

  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, [setCurrentTime]);

  const getPairedData = () => {
    const cubicleList = [...new Set(cubicles.map(c => c.cubicleNum))];
    const pairs: {
      patient: any;
      cubicle: string;
      nextPatient?: any;
      waitingCount?: number;
    }[] = [];
    
    for (const cubicleNum of cubicleList) {
      const cubiclePatients = sortCubiclePatients(
        assignedPatients.filter(p => p.cubicleNum === cubicleNum)
      );
      pairs.push({
        cubicle: cubicleNum,
        patient: cubiclePatients[0] || null,
        nextPatient: cubiclePatients[1] || null,
        waitingCount: Math.max(0, cubiclePatients.length - 1),
      });
    }

    const knownCubicles = new Set(cubicleList);
    const orphanPatients = assignedPatients.filter(p => p.cubicleNum && !knownCubicles.has(p.cubicleNum));
    const orphanCubicles = [...new Set(orphanPatients.map(p => p.cubicleNum!))];
    for (const cubicleNum of orphanCubicles) {
      const cubiclePatients = sortCubiclePatients(
        orphanPatients.filter(p => p.cubicleNum === cubicleNum)
      );
      pairs.push({
        cubicle: cubicleNum,
        patient: cubiclePatients[0] || null,
        nextPatient: cubiclePatients[1] || null,
        waitingCount: Math.max(0, cubiclePatients.length - 1),
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
            activeCall={activeCall}
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
          activeCall={activeCall}
        />
      </main>
      <Footer />
    </div>
  );
}
