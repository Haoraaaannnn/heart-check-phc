import { exec } from 'child_process';
import { getTimestamp } from './logger';
import { supabase } from './supabase';

export const sendToPrinter = async (patientNum: string, serviceName: string, cubicle: string) => {
    return new Promise(async (resolve, reject) => {
    // Fetch patient record from database
    try {
      const { data: patientRecord } = await supabase.from('patients').select().eq('patientNum', patientNum).single();
      
      // ESC/POS Formatting Codes
      const ESC = '\\x1b';
      const GS = '\\x1d';
      const CENTER = `${ESC}a\\x01`;
      const LEFT = `${ESC}a\\x00`;
      const BOLD_ON = `${ESC}E\\x01`;
      const BOLD_OFF = `${ESC}E\\x00`;
      const BIG_FONT = `${GS}!\\x11`; // Double width + Double height
      const NORMAL_FONT = `${ESC}!\\x00`;

      const date = new Date().toLocaleDateString();
      const time = new Date().toLocaleTimeString();

      // The Receipt Layout
      const ticket = `
${CENTER}${BOLD_ON}HEART CHECK PHC${BOLD_OFF}
--------------------------------
${LEFT}${NORMAL_FONT}Date: ${date}
Time: ${time}
Service: ${serviceName}
Location: ${cubicle || 'Waiting Area'}

${CENTER}${BIG_FONT}${patientNum}${NORMAL_FONT}

${CENTER}Please wait for your number.
--------------------------------
\\n\\n\\n\\n\\n
      `;

      // Send directly to the Xprinter on Ubuntu
      exec(`echo -e "${ticket}" > /dev/usb/lp2`, (error) => {
          if (error) {
              console.error(`${getTimestamp()} [EXEC PRINT ERROR] Failed to execute print command:`, { id: patientRecord?.id, created_at: patientRecord?.created_at, patientNum: patientRecord?.patientNum, phoneNum: patientRecord?.phoneNum, service: patientRecord?.service, error: error.message });
              reject(error);
          } else {
              console.log(`${getTimestamp()} [EXEC PRINT SUCCESS] Print command executed:`, { id: patientRecord?.id, created_at: patientRecord?.created_at, patientNum: patientRecord?.patientNum, phoneNum: patientRecord?.phoneNum, service: patientRecord?.service });
              resolve(true);
          }
      });
    } catch (err) {
      console.error(`${getTimestamp()} [EXEC PRINT ERROR] Failed to fetch patient record - PatientNum: ${patientNum}, Error:`, err);
      reject(err);
    }
  });
};