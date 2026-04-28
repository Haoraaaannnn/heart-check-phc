'use client';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient, Cubicle } from '../types';

export function useMonitorData(category: string, subcategory: string | null, categoryParam: string, isRegistration: boolean = false) {
  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [registrationPatients, setRegistrationPatients] = useState<Patient[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const announcementQueue = useRef<{ patient: Patient; message: string }[]>([]);
  const isPlayingRef = useRef(false);
  const announcedCubiclePatients = useRef<Map<string, Set<number>>>(new Map());
  
  const isTableLayoutService = (category === 'Consultation' && subcategory) || category === 'OPD Screening';

  const speak = async (text: string, patientId: number, times: number = 3) => {
    return new Promise<void>((resolve) => {
      let count = 0;
      const audio = new Audio();
      
      const playNext = async () => {
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
          if (!response.ok) { resolve(); return; }
          const arrayBuffer = await response.arrayBuffer();
          const audioBlob = new Blob([arrayBuffer], { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          audio.src = audioUrl;
          audio.play();
          audio.onended = () => {
            count++;
            if (count < times) {
              setTimeout(playNext, 1);
            } else {
              URL.revokeObjectURL(audioUrl);
              resolve();
            }
          };
        } catch {
          resolve();
        }
      };
      
      playNext();
    });
  };

  const processQueue = async () => {
    if (isPlayingRef.current) return;
    if (announcementQueue.current.length === 0) return;
    
    isPlayingRef.current = true;
    const item = announcementQueue.current.shift();
    if (item) {
      await speak(item.message, item.patient.id, 3);
    }
    isPlayingRef.current = false;
    processQueue();
  };

  const queueAnnouncement = (patient: Patient, cubicleNum: string) => {
    const cubicleAnnounced = announcedCubiclePatients.current.get(cubicleNum);
    
    if (!cubicleAnnounced || cubicleAnnounced.size === 0) {
      if (!announcedCubiclePatients.current.has(cubicleNum)) {
        announcedCubiclePatients.current.set(cubicleNum, new Set());
      }
      announcedCubiclePatients.current.get(cubicleNum)?.add(patient.id);
      
      const num = patient.patientNum;
      const letter = num.charAt(0);
      const digits = parseInt(num.slice(1), 10).toString();
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
      
      const message = `Number ${letter} ${digits}, Number ${letter} ${digits}, proceed to ${announcement}`;
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
    
    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }
    
    const { data, error } = await query
      .order('room', { ascending: true })
      .order('cubicleNum', { ascending: true });
    
    if (!error && data) {
      setCubicles(data);
    }
  };

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
      setAssignedPatients(data);
      
      if (isTableLayoutService) {
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
            new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
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
      } else {
        if (data.length > 0) {
          const topPatient = data[0];
          const topCubicle = topPatient.cubicleNum || 'default';
          if (!announcedCubiclePatients.current.has(topCubicle) || 
              announcedCubiclePatients.current.get(topCubicle)?.size === 0) {
            if (!announcedCubiclePatients.current.has(topCubicle)) {
              announcedCubiclePatients.current.set(topCubicle, new Set());
            }
            announcedCubiclePatients.current.get(topCubicle)?.add(topPatient.id);
            
            const num = topPatient.patientNum;
            const letter = num.charAt(0);
            const digits = parseInt(num.slice(1), 10).toString();
            const roomMatch = topPatient.cubicleNum?.match(/R(\d+)/);
            let announcement = '';
            if (roomMatch) {
              announcement = `Room ${roomMatch[1]}`;
            } else {
              announcement = topPatient.cubicleNum || '';
            }
            const message = `Number ${letter} ${digits}, Number ${letter} ${digits}, proceed to ${announcement}`;
            announcementQueue.current.push({ patient: topPatient, message });
            processQueue();
          }
        }
      }
    }
  };

  const fetchRegistrationPatients = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .in('service', ['Consultation', 'OPD Screening'])
      .in('status', ['On Progress', 'Waiting'])   
      .not('counter', 'is', null)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())
      .order('counter', { ascending: true })
      .order('created_at', { ascending: true });  

    if (!error && data) {
      setRegistrationPatients(data);
    }
  };

  const setupRegistrationSubscription = (onUpdate: () => void) => {
    const channel = supabase
      .channel('registration-monitor')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'patients',
        filter: `service=in.("Consultation","OPD Screening")`
      }, () => {
        onUpdate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

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
  };
}