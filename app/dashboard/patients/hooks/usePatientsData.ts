import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PatientStats, RecentPatient, AllRecentPatient } from '@/types/Types';

export function usePatientData(
  setStats: React.Dispatch<React.SetStateAction<PatientStats>>
) {
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [allRecentPatients, setAllRecentPatients] = useState<AllRecentPatient[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<{ name: string; value: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPatientData = async () => {
    try {
      setError(null);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: todayPatientData, error: todayError } = await supabase
        .from('patients')
        .select('id, patientNum, service, status, created_at, consult_start')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: allPatientData } = await supabase
        .from('patients')
        .select('id, patientNum, service, status, created_at, consult_start')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

      if (todayError) throw todayError;

      let inQueueCount = 0;
      let inServiceCount = 0;
      let servedCount = 0;
      const serviceCount: Record<string, number> = {};
      const recentPatientsList: RecentPatient[] = [];

      if (todayPatientData) {
        todayPatientData.forEach((patient) => {
          const currentStatus = patient.status?.toLowerCase().trim() ?? '';

          if (['pending', 'waiting', 'assigned'].includes(currentStatus)) {
            inQueueCount++;
          } else if (['on progress', 'serving', 'consulting'].includes(currentStatus)) {
            inServiceCount++;
          } else if (['completed', 'done', 'served'].includes(currentStatus)) {
            servedCount++;
          }

          const serviceName = patient.service || 'General';
          serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;

          recentPatientsList.push({
            id: patient.id.toString(),
            patientNum: patient.patientNum,
            service: serviceName,
            status: patient.status || 'Unknown',
            createdAt: new Date(patient.created_at).toLocaleString(),
            waitTime: patient.consult_start
              ? Math.round(
                  (new Date(patient.consult_start).getTime() - new Date(patient.created_at).getTime()) / 60000
                )
              : undefined,
          });
        });

        setStats((prev) => ({
          ...prev,
          inQueue: inQueueCount,
          inService: inServiceCount,
          servedToday: servedCount,
          totalToday: inQueueCount + inServiceCount + servedCount,
        }));

        const serviceDist = Object.entries(serviceCount).map(([name, value]) => ({ name, value }));
        setServiceDistribution(serviceDist);
        setRecentPatients(recentPatientsList);
      } else {
        setStats((prev) => ({ ...prev, inQueue: 0, inService: 0, servedToday: 0, totalToday: 0 }));
        setServiceDistribution([]);
        setRecentPatients([]);
      }

      if (allPatientData?.length) {
        setAllRecentPatients(
          allPatientData.map((patient) => ({
            id: patient.id.toString(),
            patientNum: patient.patientNum,
            service: patient.service || 'General',
            status: patient.status || 'Unknown',
            createdAt: new Date(patient.created_at).toLocaleString(),
            createdAtDate: new Date(patient.created_at),
            waitTime: patient.consult_start
              ? Math.round(
                  (new Date(patient.consult_start).getTime() - new Date(patient.created_at).getTime()) / 60000
                )
              : undefined,
          }))
        );
      } else {
        setAllRecentPatients([]);
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError('Failed to load patient data');
      setStats({ totalToday: 0, inQueue: 0, inService: 0, servedToday: 0, avgWaitTime: 0 });
      setServiceDistribution([]);
      setRecentPatients([]);
      setAllRecentPatients([]);
    }
  };

  return { recentPatients, allRecentPatients, serviceDistribution, error, fetchPatientData };
}