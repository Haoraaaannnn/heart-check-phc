'use server';

export async function sendSMS(phoneNum: string, patientNum: string, cubicleNum: string) {
  let formatted = String(phoneNum);
  if (formatted.startsWith('0')) {
    formatted = '+63' + formatted.slice(1);
  }

  const roomMatch = cubicleNum.match(/R(\d+)/);
  const cubicleMatch = cubicleNum.match(/C(\d+)$/);
  const roomNum = roomMatch ? roomMatch[1] : '';
  const cNum = cubicleMatch ? cubicleMatch[1] : '';
  const cubicleSpoken = roomNum && cNum ? `Room ${roomNum}, Cubicle ${cNum}` : cubicleNum;

  const message = `Heart Check PHC: Ang iyong numerong ${patientNum} ay susunod na, hintayin nalang na matawag ang iyong numero. Salamat!`;

  if (!process.env.UNISMS_API_KEY) {
    console.error('UNISMS_API_KEY not set');
    return { error: 'SMS not configured' };
  }

  const credentials = Buffer.from(`${process.env.UNISMS_API_KEY}:`).toString('base64');

  const response = await fetch('https://unismsapi.com/api/sms', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient: formatted,
      content: message,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('UniSMS error:', err);
    return { error: err };
  }

  const data = await response.json();
  console.log('SMS sent:', data);
  return data;
}