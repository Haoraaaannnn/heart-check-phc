'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Service } from '@/types/Services';
import { getTimestamp } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

interface Props {
  service: Service;
  patientNum: string;
}

export default function QueuePrintContent({ service, patientNum }: Props) {
  const router = useRouter();
  
  // Guard to prevent React Strict Mode from double-printing
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    const serviceName = service?.label_en || 'Service';
    /*const location = service?.label_fil || 'Waiting Area';*/
    
    // Fetch the patient record from database
    const fetchAndLogPatientRecord = async () => {
      try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

        const { data: patientRecord, error } = await supabase
          .from('patients')
          .select()
          .eq('patientNum', patientNum)
          .gte('created_at', startOfDay)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error) throw error;

        console.log(`${getTimestamp()} 📋 [QUEUE PRINT PAGE] Loaded:`, { id: patientRecord?.id, created_at: patientRecord?.created_at, patientNum: patientRecord?.patientNum, phoneNum: patientRecord?.phoneNum, service: patientRecord?.service });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.log(`${getTimestamp()} 📋 [QUEUE PRINT PAGE] Loaded - PatientNum: ${patientNum}, Service: ${serviceName} (DB Fetch Note: ${errorMessage})`);
      }
    };

    fetchAndLogPatientRecord();
    console.log(`${getTimestamp()} 🞨 [PRINT JOB INITIATED] Preparing to send ticket to printer - Queue: ${patientNum}, Service: ${serviceName}, Cubicle: ${location}`);

    // Call the print API
    const printTicket = async () => {
      try {
        console.log(`${getTimestamp()} 📋 [PRINT API CALL] Sending print request - Queue: ${patientNum}`);
        const response = await fetch('/api/print-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queueNumber: patientNum,
            serviceName: serviceName,
            cubicle: location
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          console.log(`${getTimestamp()} ✅ [PRINT SUCCESS] Ticket successfully printed - Queue: ${patientNum}`);
        } else {
          console.warn(`${getTimestamp()} ⚠️ [PRINT WARNING] Print API returned error status - Status: ${response.status}, Message: ${data.error || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`${getTimestamp()} ❌ [PRINT FETCH ERROR] Failed to call print API:`, errorMessage);
      }
    };

    printTicket();
  }, [patientNum, service?.label_en, service?.label_fil]); // Removed router from dependencies here


  // ==========================================
  // EFFECT 2: UI REDIRECT (Handles Strict Mode safely)
  // ==========================================
  useEffect(() => {
    // Delay 5 seconds for user to see the queue number, then redirect
    const redirectTimer = setTimeout(() => {
      console.log(`${getTimestamp()} ⏱️ [REDIRECT TIMER] 5 second timeout completed - Redirecting back to kiosk services.`);
      router.push('/kiosk/kiosk-services');
    }, 5000); 

    // If Strict Mode unmounts, this clears the timer. 
    // When it remounts, the timer will safely recreate itself!
    return () => clearTimeout(redirectTimer);
  }, [router]);


return (
    // Only the white card is returned! No outer background divs.
    <div className="w-full max-w-lg md:max-w-3xl lg:max-w-4xl bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl p-6 md:p-10 flex flex-col items-center justify-center gap-4">
      
      {/* Service Information Section */}
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {service?.label_fil && (
          <div className="text-3xl sm:text-4xl md:text-5xl font-baloo font-black text-[#1a2530] leading-tight shrink-0">
            {service.label_fil}
          </div>
        )}
        
        <div className="text-sm sm:text-base md:text-lg font-baloo font-bold text-gray-600 px-6 py-2 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100 shrink-0">
          {service?.label_en || 'Consultation'}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-gray-200 my-2 shrink-0"></div>

      {/* Queue Number Section */}
      <div className="flex flex-col items-center justify-center w-full">
        <div className="text-sm sm:text-base md:text-lg font-baloo font-bold text-gray-500 mb-2 shrink-0">
          Your Queue Number
        </div>
        
        {/* 
          Using clamp(min, viewport-size, max) to ensure the text shrinks dynamically
          if the screen isn't tall enough, but maxes out at 180px on large displays.
        */}
        <div className="text-[clamp(60px,15vh,120px)] font-baloo font-black text-[#1a2530] leading-[0.85] tracking-tight text-center py-2 shrink-0">
          {patientNum}
        </div>
      </div>

    </div>
  );
}