/** @fileoverview Public queue monitor data and announcements excluding unavailable stations. */
'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient, Cubicle } from '@/types/Types';
import { formatTicketForSpeech } from '@/utils/formatTicketSpeech';
import { useMonitorCalls } from './useMonitorCalls';
import { playMonitorSpeech } from '../lib/playMonitorSpeech';

/** Loads monitor data and serializes automatic and manual calls after monitor activation. */
export function useMonitorData(category: string, subcategory: string | null, categoryParam: string, isRegistration: boolean = false, started = false) {
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [registrationPatients, setRegistrationPatients] = useState<Patient[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cubicleDoctorMap, setCubicleDoctorMap] = useState<Record<string, string>>({});
  const [monitorLayout, setMonitorLayout] = useState<string | null>(null);

  const announcementQueue = useRef<{ patient?: Patient; message: string; cubicle?: string | null; expiresAt?: string }[]>([]);
  const isPlayingRef = useRef(false);
  const announcedCubiclePatients = useRef<Map<string, Set<number>>>(new Map());
  const audioController = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!started) return;
    const controller = new AbortController();
    const announced = announcedCubiclePatients.current;
    audioController.current = controller;
    return () => { controller.abort(); announcementQueue.current = []; announced.clear(); };
  }, [started, category, subcategory]);

  useEffect(() => {
    const fetchLayout = () => {
      supabase
        .from('services')
        .select('monitor_layout')
        .eq('label_en', category)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.monitor_layout) {
            setMonitorLayout(data.monitor_layout);
          }
        });
    };

    fetchLayout();

    const channel = supabase
      .channel(`monitor-layout-sync-${category}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => {
          fetchLayout();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [category]);

  const isTableLayoutService = monitorLayout
    ? monitorLayout === 'table'
    : (category === 'Consultation' && subcategory) || category === 'OPD Screening';

  /** Plays automatic and staff-triggered messages through one monitor audio queue. */
  const processQueue = async () => {
    if (isPlayingRef.current || !audioController.current || audioController.current.signal.aborted) return;
    const controller = audioController.current;
    isPlayingRef.current = true;
    try {
      while (announcementQueue.current.length && !controller.signal.aborted) {
        const item = announcementQueue.current.shift()!;
        if (item.expiresAt && Date.parse(item.expiresAt) <= Date.now()) continue;
        const destination = item.patient?.cubicleNum ?? item.cubicle;
        if (destination) {
          const { data: station } = await supabase.from('cubicle').select('id')
            .eq('cubicleNum', destination).eq('on_break', false).maybeSingle();
          if (!station) continue;
        }
        try { await playMonitorSpeech(item.message, 3, controller.signal); }
        catch (error) { if (!controller.signal.aborted) console.warn('Monitor call playback failed:', error); }
      }
    } finally {
      isPlayingRef.current = false;
      if (announcementQueue.current.length && audioController.current !== controller) void processQueue();
    }
  };

  useMonitorCalls(category, subcategory, started && !isRegistration, call => {
    announcementQueue.current.push({ message: call.message, cubicle: call.cubicle, expiresAt: call.expiresAt });
    void processQueue();
  });

  const queueAnnouncement = (patient: Patient, cubicleNum: string) => {
    const cubicleAnnounced = announcedCubiclePatients.current.get(cubicleNum);
    
    if (!cubicleAnnounced || cubicleAnnounced.size === 0) {
      if (!announcedCubiclePatients.current.has(cubicleNum)) {
        announcedCubiclePatients.current.set(cubicleNum, new Set());
      }
      announcedCubiclePatients.current.get(cubicleNum)?.add(patient.id);
      
      const ticket = formatTicketForSpeech(patient.patientNum);
      const roomMatch = patient.cubicleNum?.match(/R(\d+)/);
      const cubicleMatch = patient.cubicleNum?.match(/C(\d+)$/);
      
      let announcement = '';
      if (roomMatch && cubicleMatch) {
        announcement = `Room ${roomMatch[1]}, Cubicle ${cubicleMatch[1]}`;
      } else {
        const otherRoomMatch = patient.cubicleNum?.match(/R(\d+)/);
        if (otherRoomMatch) {
          announcement = `Room ${otherRoomMatch[1]}`;
        } else {
          announcement = patient.cubicleNum || '';
        }
      }
      
      const message = `Number ${ticket}, Number ${ticket}, proceed to ${announcement}`;
      announcementQueue.current.push({ patient, message });
      processQueue();
    }
  };

  const formatCubicleDisplay = (cubicleNum: string): string => {
    const roomMatch = cubicleNum.match(/R(\d+)/);
    const cubicleMatch = cubicleNum.match(/C(\d+)$/);
    
    if (roomMatch && cubicleMatch) {
      return `Room ${roomMatch[1]}, Cubicle ${cubicleMatch[1]}`;
    }
    
    const onlyRoomMatch = cubicleNum.match(/R(\d+)/);
    if (onlyRoomMatch) {
      return `Room ${onlyRoomMatch[1]}`;
    }
    
    return cubicleNum;
  };

  const fetchCubicles = async () => {
    let query = supabase
      .from('cubicle')
      .select('*')
      .eq('category', category);

    query = query.eq('on_break', false);

    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }

    const { data, error } = await query
      .order('room', { ascending: true })
      .order('cubicleNum', { ascending: true });

    if (!error && data) {
      setCubicles(data);

      const doctorIds = [...new Set(data.map((c: Cubicle) => c.doctorId).filter(Boolean))] as string[];

      if (doctorIds.length === 0) {
        setCubicleDoctorMap({});
        return;
      }

      const { data: doctorsData } = await supabase
        .from('doctors')
        .select('id, full_name')
        .in('id', doctorIds);

      const nameById = new Map((doctorsData || []).map((d: any) => [d.id, d.full_name]));
      const map: Record<string, string> = {};
      data.forEach((c: Cubicle) => {
        if (c.doctorId && nameById.has(c.doctorId)) {
          map[c.cubicleNum] = nameById.get(c.doctorId)!;
        }
      });
      setCubicleDoctorMap(map);
    }
  };

  const patientsFetchId = useRef(0);
  const registrationFetchId = useRef(0);

  const fetchPatients = async () => {
    const requestId = ++patientsFetchId.current;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let query = supabase
      .from('patients')
      .select('*')
      .eq('service', category)
      .eq('status', 'Assigned')
      .not('cubicleNum', 'is', null)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }

    const { data: rawData, error } = await query.order('called_at', { ascending: true });
    const { data: available, error: availabilityError } = await supabase.from('cubicle')
      .select('cubicleNum').eq('category', category).eq('on_break', false);
    const availableNames = new Set((available ?? []).map(station => station.cubicleNum));
    const data = availabilityError ? [] : rawData?.filter(patient => availableNames.has(patient.cubicleNum));

    if (requestId !== patientsFetchId.current) return;

    if (!error && data) {
      setAssignedPatients(data);
      
      if (isTableLayoutService && started) {
        const patientsByCubicle = new Map<string, Patient[]>();
        for (const patient of data) {
          if (patient.cubicleNum) {
            if (!patientsByCubicle.has(patient.cubicleNum)) {
              patientsByCubicle.set(patient.cubicleNum, []);
            }
            patientsByCubicle.get(patient.cubicleNum)?.push(patient);
          }
        }
        
        for (const [cubicleNum, patients] of patientsByCubicle) {
          const sortedPatients = [...patients].sort((a, b) =>
          new Date(a.called_at || 0).getTime() - new Date(b.called_at || 0).getTime()
        );
          const topPatient = sortedPatients[0];
          if (topPatient) {
            queueAnnouncement(topPatient, cubicleNum);
          }
        }
        
        for (const [cubicleNum, announcedIds] of announcedCubiclePatients.current) {
          const currentPatientsInCubicle = patientsByCubicle.get(cubicleNum) || [];
          const currentIds = new Set(currentPatientsInCubicle.map(p => p.id));
          for (const id of announcedIds) {
            if (!currentIds.has(id)) {
              announcedCubiclePatients.current.get(cubicleNum)?.delete(id);
            }
          }
          if (announcedCubiclePatients.current.get(cubicleNum)?.size === 0) {
            announcedCubiclePatients.current.delete(cubicleNum);
          }
        }
      } else if (started) {
        if (data.length > 0) {
          const topPatient = data[0];
          const topCubicle = topPatient.cubicleNum || 'default';
          if (!announcedCubiclePatients.current.has(topCubicle) || 
              announcedCubiclePatients.current.get(topCubicle)?.size === 0) {
            if (!announcedCubiclePatients.current.has(topCubicle)) {
              announcedCubiclePatients.current.set(topCubicle, new Set());
            }
            announcedCubiclePatients.current.get(topCubicle)?.add(topPatient.id);
            
            const ticket = formatTicketForSpeech(topPatient.patientNum);
            const roomMatch = topPatient.cubicleNum?.match(/R(\d+)/);
            let announcement = '';
            if (roomMatch) {
              announcement = `Room ${roomMatch[1]}`;
            } else {
              announcement = topPatient.cubicleNum || '';
            }
            const message = `Number ${ticket}, Number ${ticket}, proceed to ${announcement}`;
            announcementQueue.current.push({ patient: topPatient, message });
            processQueue();
          }
        }
      }
    }
  };

  const fetchRegistrationPatients = async () => {
    const requestId = ++registrationFetchId.current;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Resolve services requiring registration desk intake
    const { data: svcData } = await supabase
      .from('services')
      .select('label_en, requires_registration');

    const regServices = (svcData || [])
      .filter((s: any) => s.requires_registration !== false)
      .map((s: any) => s.label_en);

    const serviceFilter = regServices.length > 0 ? regServices : ['Consultation', 'OPD Screening'];

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .in('service', serviceFilter)
      .in('status', ['On Progress', 'Waiting'])
      .not('counter', 'is', null)
      .is('reg_end', null)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('counter', { ascending: true })
      .order('created_at', { ascending: true });

    if (requestId !== registrationFetchId.current) return;
    if (!error && data) setRegistrationPatients(data);
  };

  const setupRegistrationSubscription = (onUpdate: () => void) => {
    const channel = supabase
      .channel('registration-monitor')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'patients'
      }, () => {
        onUpdate();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'services'
      }, () => {
        onUpdate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const availabilityRefresh = useRef<() => void>(() => {});
  useEffect(() => {
    availabilityRefresh.current = () => { void fetchCubicles(); void fetchPatients(); };
  });
  useEffect(() => {
    const timer = setInterval(() => availabilityRefresh.current(), 5000);
    const channel = supabase.channel(`monitor-station-breaks-${category}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cubicle' }, () => availabilityRefresh.current()).subscribe();
    return () => { clearInterval(timer); void supabase.removeChannel(channel); };
  }, [category]);

  return {
    assignedPatients,
    cubicles,
    registrationPatients,
    currentTime,
    setCurrentTime,
    fetchCubicles,
    fetchPatients,
    fetchRegistrationPatients,
    formatCubicleDisplay,
    isTableLayoutService,
    setupRegistrationSubscription,
    cubicleDoctorMap,
  };
}
