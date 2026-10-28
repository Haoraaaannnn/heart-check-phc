'use client';

/**
 * @fileoverview Dynamic department, service, and custom multi-service queue monitor page (/monitor/[category]).
 *
 * Renders real-time patient queue visualization for waiting areas and clinic hallways.
 * Supports standard single-service queues and custom multi-service monitors.
 * Enforces zero scrolling and fluid viewport height adaptability across all monitor
 * screen sizes (Full HD, 4K, 720p, laptops, and tablets).
 *
 * @module app/monitor/[category]/page
 */

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Header } from '@/app/monitor/components/Header';
import { Footer } from '@/app/monitor/components/Footer';
import { PairedLayout } from '@/app/monitor/components/PairedLayout';
import { TableLayout } from '@/app/monitor/components/TableLayout';
import { StartScreen } from '@/app/monitor/components/StartScreen';
import { RegistrationLayout } from '@/app/monitor/components/RegistrationLayout';
import { CustomMonitorLayout } from '@/app/monitor/components/CustomMonitorLayout';
import { useMonitorData } from '@/app/monitor/hooks/useMonitorData';
import { useCustomMonitorData } from '@/app/monitor/hooks/useCustomMonitorData';
import { useRealtimeSubscription } from '@/app/monitor/hooks/useRealtimeSubscription';
import { MONITOR_STYLES } from '@/app/monitor/constants/monitorStyles';
import { sortCubiclePatients } from '@/app/monitor/lib/sortCubiclePatients';

/**
 * Formats a clean, readable monitor display title from the selected services list.
 * @param services - Array of selected service strings.
 * @returns Human-readable monitor title.
 */
function formatMonitorTitle(services: string[]): string {
  if (services.length === 0) return 'Queue Monitor';
  if (services.length === 1) {
    const s = services[0];
    return s.includes('-') ? s.replace('-', ' - ') : s;
  }

  const parsed = services.map(s => {
    const [base, sub] = s.includes('-') ? s.split('-') : [s, null];
    return { base: base.trim(), sub: sub ? sub.trim() : null };
  });

  const uniqueBases = [...new Set(parsed.map(p => p.base))];
  if (uniqueBases.length === 1) {
    const subs = parsed.map(p => p.sub).filter(Boolean);
    if (subs.length > 1) {
      return `${uniqueBases[0]} (${subs.join(' & ')})`;
    }
    if (subs.length === 1) {
      return `${uniqueBases[0]} - ${subs[0]}`;
    }
    return uniqueBases[0];
  }

  const formatted = services.map(s => s.replace('-', ' - '));
  if (formatted.length <= 3) {
    return formatted.join(' • ');
  }
  return `${formatted.slice(0, 3).join(' • ')} +${formatted.length - 3} More`;
}

/**
 * Custom multi-service monitor view handling multiple stations and services simultaneously.
 */
function CustomCategoryMonitor() {
  const searchParams = useSearchParams();
  const servicesParam = searchParams.get('services') || '';
  const services = useMemo(() => {
    return servicesParam.split(',').map(s => decodeURIComponent(s.trim())).filter(Boolean);
  }, [servicesParam]);

  const [started, setStarted] = useState(false);
  const { serviceQueues, currentTime } = useCustomMonitorData(services, started);

  const monitorTitle = useMemo(() => formatMonitorTitle(services), [services]);
  const displaySubtitle = services.length > 1 ? `${services.length} Services Monitored` : null;

  if (!started) {
    return (
      <StartScreen
        category={monitorTitle}
        subcategory={displaySubtitle}
        onStart={() => setStarted(true)}
      />
    );
  }

  return (
    <div className={MONITOR_STYLES.viewport.container}>
      <Header title={monitorTitle} currentTime={currentTime} />
      <main className={MONITOR_STYLES.viewport.main}>
        <CustomMonitorLayout serviceQueues={serviceQueues} />
      </main>
      <Footer />
    </div>
  );
}

/**
 * Standard single-service monitor view for individual departments or registration intake.
 */
function StandardCategoryMonitor({ categoryParam }: { categoryParam: string }) {
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
  }, [isRegistration, setupRegistrationSubscription, fetchRegistrationPatients]);

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
  }, [category, subcategory, isRegistration, fetchRegistrationPatients, fetchCubicles, fetchPatients]);

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
      upcomingPatients?: any[];
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
        upcomingPatients: cubiclePatients.slice(1, 5),
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
        upcomingPatients: cubiclePatients.slice(1, 5),
        waitingCount: Math.max(0, cubiclePatients.length - 1),
      });
    }

    const unassignedPatients = assignedPatients.filter(p => !p.cubicleNum);
    if (unassignedPatients.length > 0 && pairs.length === 0) {
      const cubiclePatients = sortCubiclePatients(unassignedPatients);
      pairs.push({
        cubicle: category,
        patient: cubiclePatients[0] || null,
        nextPatient: cubiclePatients[1] || null,
        upcomingPatients: cubiclePatients.slice(1, 5),
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

/**
 * Root dynamic monitor route component (/monitor/[category]).
 */
export default function CategoryMonitorPage() {
  const params = useParams();
  const categoryParam = decodeURIComponent(params.category as string);

  if (categoryParam === 'Custom') {
    return (
      <Suspense fallback={
        <div className={MONITOR_STYLES.viewport.container}>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#cc3535] rounded-full animate-spin" />
          </div>
        </div>
      }>
        <CustomCategoryMonitor />
      </Suspense>
    );
  }

  return <StandardCategoryMonitor categoryParam={categoryParam} />;
}
