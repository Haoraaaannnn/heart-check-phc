/** @fileoverview Server-validated physician selection using Superadmin service flags and bounded roster loading. */
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';
import { redirect } from 'next/navigation';
import CubicleCardsGrid from './components/CubicleCardsGrid';
import CubicleHeader from './components/CubicleHeader';
import { CubicleLayoutStyle, CubicleLayoutClasses } from './constants/cubicleLayout';
import { requiresDoctorSelection, parseDoctorSelectionService } from '@/app/kiosk/lib/doctorSelection';
import { loadDoctorOptions } from '@/app/kiosk/lib/loadDoctorOptions';

/** Selected service and triage metadata supplied by the preceding kiosk screens. */
interface KioskCubicleSelectionPageProps {
  searchParams: Promise<{ serviceId?: string; type?: string; subcategory?: string }>;
}

/**
 * Uses Superadmin's saved picker setting for every service, including OPD Screening and renamed services.
 * @param props - Service, patient type and selected age category.
 * @returns Name-only physician choices with internal cubicle links preserved for assignment.
 * @remarks The directory client remains server-only; no credentials or account fields reach the kiosk.
 */
export default async function KioskCubicleSelectionPage({ searchParams }: KioskCubicleSelectionPageProps) {
  const { serviceId, type, subcategory } = await searchParams;
  if (!serviceId || !/^[1-9]\d*$/.test(serviceId)) redirect('/kiosk/pages/kiosk-services');
  const db = await createClient();
  const signal = AbortSignal.timeout(12_000);
  const { data, error } = await db.from('services').select('label_en,requires_cubicle')
    .eq('id', serviceId).abortSignal(signal).maybeSingle();
  if (error) throw new Error('Unable to load the selected service. Please try again.');
  if (!data) redirect('/kiosk/pages/kiosk-services');
  const service = parseDoctorSelectionService(data);
  if (!service) throw new Error('The selected service is unavailable. Please ask staff for assistance.');
  if (!requiresDoctorSelection(service)) {
    const params = new URLSearchParams({ serviceId });
    if (type) params.set('type', type);
    if (subcategory) params.set('subcategory', subcategory);
    redirect(`/kiosk/pages/sms-input?${params}`);
  }
  const cubicles = await loadDoctorOptions({ db, directory: supabaseAdmin, service: service.label_en, subcategory, signal });
  return <div className={CubicleLayoutClasses.container} style={CubicleLayoutStyle.container}>
    <div className={CubicleLayoutClasses.contentWrapper} style={CubicleLayoutStyle.contentWrapper}>
      <header className={CubicleLayoutClasses.headerWrapper} style={CubicleLayoutStyle.headerWrapper}><CubicleHeader /></header>
      {cubicles.length ? <CubicleCardsGrid cubicles={cubicles} serviceId={serviceId} patientType={type} subcategory={subcategory} />
        : <p role="status" className="p-6 text-center text-xl text-slate-600">No doctors are available for this category yet. Please go back or ask staff for assistance.</p>}
    </div>
  </div>;
}
