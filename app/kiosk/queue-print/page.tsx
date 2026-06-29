

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Service } from '@/types/Services';
import QueuePrintContent from '@/app/kiosk/queue-print/components/QueuePrintContent';

interface Props {
  searchParams: Promise<{ patientNum?: string; serviceId?: string }>;
}

export default async function QueuePrintPage({ searchParams }: Props) {
  const { patientNum = '---', serviceId } = await searchParams;
  const supabase = await createClient();

  let service: Service | null = null;

  if (serviceId) {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('id', parseInt(serviceId, 10))
      .single();
    service = data;
  }

  if (!service) notFound();

  return <QueuePrintContent service={service} patientNum={patientNum} />;
}
