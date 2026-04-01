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
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: service?.bg_color || '#ffffff' }}
    >
      <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Main Card Container */}
        <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl bg-white rounded-2xl sm:rounded-3xl md:rounded-4xl lg:rounded-5xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 flex flex-col gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          
          {/* Service Information Section */}
          <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 md:gap-4">
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-baloo font-black text-gray-800 text-center">
              {service?.label_fil || 'Service'}
            </div>
            
            <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-baloo font-bold text-gray-600 px-3 sm:px-4 md:px-5 py-1 sm:py-2 md:py-3 bg-gray-100 rounded-lg sm:rounded-xl md:rounded-2xl">
              {service?.label_en || 'Service'}
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px sm:h-1 bg-gray-200"></div>

          {/* Queue Number Section */}
          <div className="flex flex-col items-center justify-center gap-2 sm:gap-3 md:gap-4">
            <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-baloo font-bold text-gray-600">
              Your Queue Number
            </div>
            
            <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[160px] 2xl:text-[180px] font-baloo font-black text-gray-800 leading-none">
              {patientNum}
            </div>
            
            <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-baloo text-gray-500 animate-pulse mt-2 sm:mt-4 md:mt-6">
              Please wait...
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}