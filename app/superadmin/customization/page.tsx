/**
 * @fileoverview Kiosk Customization and Hardware Management page for SuperAdmin.
 *
 * Configures outpatient touchscreen service catalog, bilingual descriptions, Boxicons,
 * patient cohort eligibility, live kiosk terminal presence detection, and thermal printer hardware.
 *
 * @module app/superadmin/customization/page
 */

'use client';

import React, { useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Service } from '@/types/Services';
import { resolveServiceIcon } from '@/constants/icons';
import { useRequireAuth } from '@/app/superadmin/hooks/useRequireAuth';
import { useIdleTimeout } from '@/app/superadmin/hooks/useIdleTimeout';
import { SuperAdminPageSkeleton } from '@/app/superadmin/components/SuperAdminPageSkeleton';
import { CUSTOMIZATION_TEXTS } from '@/app/superadmin/customization/constants/customizationTexts';
import { CUSTOMIZATION_STYLES } from '@/app/superadmin/customization/constants/customizationStyles';
import { SUPERADMIN_STYLES } from '@/app/superadmin/constants/superadminStyles';
import { DeleteServiceModal } from '@/app/superadmin/customization/components/DeleteServiceModal';
import { ServiceModal } from '@/app/superadmin/customization/components/ServiceModal';
import { HardwarePrinterConfigCard } from '@/app/superadmin/customization/components/HardwarePrinterConfigCard';
import { KioskDetectionCard } from '@/app/superadmin/customization/components/KioskDetectionCard';

/**
 * Inner content component synchronized with URL search parameters (?tab=services | hardware).
 */
function CustomizationContent() {
  const checking = useRequireAuth();
  useIdleTimeout();

  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const tab: 'services' | 'hardware' = urlTab === 'hardware' ? 'hardware' : 'services';

  const handleTabChange = (newTab: 'services' | 'hardware') => {
    router.push(`/superadmin/customization?tab=${newTab}`);
  };

  const supabase = useMemo(() => createClient(), []);
  const S = CUSTOMIZATION_STYLES;
  const B = SUPERADMIN_STYLES.buttons;
  const T = CUSTOMIZATION_TEXTS;

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Service modal dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Deletion modal state
  const [deletingService, setDeletingService] = useState<Service | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('services')
      .select('*')
      .order('display_order', { ascending: true });

    if (err) {
      setError(err.message);
    } else {
      setServices((data as Service[]) || []);
      setError(null);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadServices();

    const channel = supabase
      .channel('customization-page-services')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'services' },
        () => {
          void loadServices();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, loadServices]);

  function startCreate() {
    setEditingId('new');
    setEditingService(null);
    setIsModalOpen(true);
  }

  function startEdit(service: Service) {
    setEditingId(service.id);
    setEditingService(service);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setEditingService(null);
  }

  function requestDelete(service: Service) {
    setDeleteError(null);
    setDeletingService(service);
  }

  async function handleConfirmDelete() {
    if (!deletingService) return;

    setDeleteLoading(true);
    setDeleteError(null);

    const { error: delErr } = await supabase.from('services').delete().eq('id', deletingService.id);
    if (delErr) {
      setDeleteError(delErr.message);
      setDeleteLoading(false);
    } else {
      try {
        const { data: cubiclesToDelete } = await supabase
          .from('cubicle')
          .select('id')
          .eq('category', deletingService.label_en);

        if (cubiclesToDelete && cubiclesToDelete.length > 0) {
          const cubicleIds = cubiclesToDelete.map((c: { id: number }) => c.id);
          await supabase.from('user_cubicles').delete().in('cubicle_id', cubicleIds);
          await supabase.from('cubicle').delete().eq('category', deletingService.label_en);
        }

        await supabase.from('user_services').delete().eq('service', deletingService.label_en);
        await supabase.from('user_rooms').delete().eq('service', deletingService.label_en);
      } catch (cascadeErr) {
        console.error('Cascading cleanup of cubicles failed:', cascadeErr);
      }

      try {
        const { data: settingData } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'queue_prefix_map')
          .maybeSingle();

        if (settingData?.value) {
          const parsed = JSON.parse(settingData.value);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(
              (r: { service: string }) => r.service !== deletingService.label_en
            );
            await supabase
              .from('app_settings')
              .update({ value: JSON.stringify(filtered) })
              .eq('key', 'queue_prefix_map');
          }
        }
      } catch {
        // Non-critical fallback
      }

      setDeleteLoading(false);
      setDeletingService(null);
      loadServices();
    }
  }

  function handleCancelDelete() {
    if (deleteLoading) return;
    setDeletingService(null);
    setDeleteError(null);
  }

  const nextDisplayOrder = services.length
    ? Math.max(...services.map((s) => s.display_order)) + 1
    : 0;

  if (checking) {
    return <SuperAdminPageSkeleton />;
  }

  return (
    <div className={SUPERADMIN_STYLES.layout.page}>
      {/* Tab Switcher: Services vs Hardware & Terminals */}
      <div className={SUPERADMIN_STYLES.tabs.container}>
        <button
          type="button"
          onClick={() => handleTabChange('services')}
          className={`${SUPERADMIN_STYLES.tabs.tab} ${
            tab === 'services'
              ? SUPERADMIN_STYLES.tabs.tabActive
              : SUPERADMIN_STYLES.tabs.tabIdle
          }`}
        >
          <i className="bx bx-slider-alt text-base" aria-hidden="true" />
          <span>Kiosk Services</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('hardware')}
          className={`${SUPERADMIN_STYLES.tabs.tab} ${
            tab === 'hardware'
              ? SUPERADMIN_STYLES.tabs.tabActive
              : SUPERADMIN_STYLES.tabs.tabIdle
          }`}
        >
          <i className="bx bx-printer text-base" aria-hidden="true" />
          <span>Hardware & Terminals</span>
        </button>
      </div>

      {/* Header Banner Card */}
      <div className={SUPERADMIN_STYLES.banner.root}>
        <div className={SUPERADMIN_STYLES.banner.titleSection}>
          <h1 className={SUPERADMIN_STYLES.banner.heading}>
            {tab === 'services' ? T.header.pageTitle : 'Kiosk Hardware & Terminals'}
          </h1>
          <p className={SUPERADMIN_STYLES.banner.subheading}>
            {tab === 'services'
              ? T.header.pageDescription
              : 'Live detection of outpatient touchscreen terminals, active screen status, and receipt printer hardware configuration.'}
          </p>
        </div>

        {tab === 'services' && (
          <button type="button" onClick={startCreate} className={B.primary}>
            <i className="bx bx-plus text-base" aria-hidden="true" />
            <span>{T.header.addServiceButton}</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <i className="bx bx-error-circle text-lg shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* View 1: Kiosk Services Catalog */}
      {tab === 'services' && (
        <div className={S.tableContainer}>
          {loading ? (
            <div className="animate-pulse">
              <table className={S.table}>
                <thead className={S.thead}>
                  <tr>
                    <th className={S.th}><div className="h-3 w-10 bg-slate-200 dark:bg-[#2e2e2e] rounded-md" /></th>
                    <th className={S.th}><div className="h-3 w-28 bg-slate-200 dark:bg-[#2e2e2e] rounded-md" /></th>
                    <th className={S.th}><div className="h-3 w-20 bg-slate-200 dark:bg-[#2e2e2e] rounded-md" /></th>
                    <th className={S.th}><div className="h-3 w-20 bg-slate-200 dark:bg-[#2e2e2e] rounded-md" /></th>
                    <th className={S.th}><div className="h-3 w-12 bg-slate-200 dark:bg-[#2e2e2e] rounded-md" /></th>
                    <th className={`${S.th} text-right`}><div className="h-3 w-14 bg-slate-200 dark:bg-[#2e2e2e] rounded-md ml-auto" /></th>
                  </tr>
                </thead>
                <tbody className={S.tbody}>
                  {['s-1', 's-2', 's-3', 's-4', 's-5'].map((key) => (
                    <tr key={key} className={S.tr}>
                      <td className={S.td}><div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#242424]" /></td>
                      <td className={S.td}>
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-36 bg-slate-100 dark:bg-[#242424] rounded-md" />
                          <div className="h-2.5 w-24 bg-slate-100 dark:bg-[#242424] rounded-md" />
                        </div>
                      </td>
                      <td className={S.td}><div className="h-5 w-16 bg-slate-100 dark:bg-[#242424] rounded-md" /></td>
                      <td className={S.td}><div className="h-5 w-20 bg-slate-100 dark:bg-[#242424] rounded-md" /></td>
                      <td className={S.td}><div className="h-3.5 w-8 bg-slate-100 dark:bg-[#242424] rounded-md" /></td>
                      <td className={`${S.td} text-right`}>
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-6 w-14 bg-slate-100 dark:bg-[#242424] rounded-lg" />
                          <div className="h-6 w-14 bg-slate-100 dark:bg-[#242424] rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <table className={S.table}>
              <thead className={S.thead}>
                <tr>
                  <th className={S.th}>{T.table.colIcon}</th>
                  <th className={S.th}>{T.table.colLabels}</th>
                  <th className={S.th}>{T.table.colPatientType}</th>
                  <th className={S.th}>{T.table.colQueueTicket}</th>
                  <th className={S.th}>{T.table.colCapabilities}</th>
                  <th className={S.th}>{T.table.colOrder}</th>
                  <th className={`${S.th} text-right`}>{T.table.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => {
                  const iconClass = resolveServiceIcon(service);
                  const prefixDisplay = service.queue_prefix?.trim().toUpperCase();
                  const padLen = service.queue_pad_length ?? 3;
                  const sampleNum = prefixDisplay
                    ? `${prefixDisplay}${String(1).padStart(padLen, '0')}`
                    : null;

                  return (
                    <tr key={service.id} className={S.tr}>
                      <td className={S.td}>
                        <div className="text-[#a8071a] dark:text-[#f87171] flex items-center justify-center text-2xl shrink-0">
                          <i className={`bx ${iconClass}`} aria-hidden="true" />
                        </div>
                      </td>
                      <td className={S.td}>
                        <div className="font-semibold text-slate-900 dark:text-[#f5f5f5] whitespace-normal break-words">
                          {service.label_en}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-[#a3a3a3] italic whitespace-normal break-words">
                          {service.label_fil}
                        </div>
                      </td>
                      <td className={S.td}>
                        <span
                          className={
                            service.patient_type === 'both'
                              ? S.patientTypeBoth
                              : service.patient_type === 'new'
                              ? S.patientTypeNew
                              : S.patientTypeOld
                          }
                        >
                          {service.patient_type}
                        </span>
                      </td>
                      <td className={S.td}>
                        {sampleNum ? (
                          <div>
                            <span className={S.tableTicketBadge}>
                              <i className="bx bx-receipt text-xs" aria-hidden="true" />
                              <span>{sampleNum}</span>
                            </span>
                            <div className="text-[10px] text-slate-400 dark:text-[#737373] mt-0.5 font-mono">
                              {prefixDisplay} + {padLen}d
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-[#737373] italic">
                            {T.table.noPrefixFallback}
                          </span>
                        )}
                      </td>
                      <td className={S.td}>
                        <div className={S.badgeContainer}>
                          {service.requires_registration && (
                            <span className={S.badgeRegistration}>
                              <i className="bx bx-id-card text-xs" aria-hidden="true" />
                              <span>{T.table.badgeRegistration}</span>
                            </span>
                          )}
                          {service.has_subcategories && (
                            <span className={S.badgeSubcategories}>
                              <i className="bx bx-group text-xs" aria-hidden="true" />
                              <span>{T.table.badgeSubcategories}</span>
                            </span>
                          )}
                          {service.requires_cubicle && (
                            <span className={S.badgeCubicles}>
                              <i className="bx bx-door-open text-xs" aria-hidden="true" />
                              <span>{T.table.badgeCubicles}</span>
                            </span>
                          )}
                          {service.requires_nurse && (
                            <span className={S.badgeNurse}>
                              <i className="bx bx-clipboard text-xs" aria-hidden="true" />
                              <span>{T.table.badgeNurse}</span>
                            </span>
                          )}
                          {service.show_on_monitor !== false && (
                            <span className={S.badgeMonitor}>
                              <i className="bx bx-tv text-xs" aria-hidden="true" />
                              <span>{T.table.badgeMonitor}</span>
                            </span>
                          )}
                          {service.auto_assign && (
                            <span className={S.badgeAutoAssign}>
                              <i className="bx bx-shuffle text-xs" aria-hidden="true" />
                              <span>{T.table.badgeAutoAssign}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={S.td}>
                        <span className="font-mono text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-[#242424] text-slate-700 dark:text-[#a3a3a3] rounded-md">
                          #{service.display_order}
                        </span>
                      </td>
                      <td className={`${S.td} text-right`}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(service)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#a8071a] dark:text-[#f87171] hover:bg-[#a8071a]/10 dark:hover:bg-[#a8071a]/20 transition cursor-pointer flex items-center gap-1"
                          >
                            <i className="bx bx-edit-alt text-sm" aria-hidden="true" />
                            <span>{T.table.editButton}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(service)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 transition cursor-pointer flex items-center gap-1"
                          >
                            <i className="bx bx-trash text-sm" aria-hidden="true" />
                            <span>{T.table.deleteButton}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {services.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-xs text-slate-400">
                      {T.table.emptyTitle}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* View 2: Hardware & Terminals (Live Detection + Printer Config) */}
      {tab === 'hardware' && (
        <div className="space-y-6">
          <KioskDetectionCard />
          <HardwarePrinterConfigCard />
        </div>
      )}

      {/* Service Add / Edit Modal Dialog */}
      <ServiceModal
        isOpen={isModalOpen}
        editingId={editingId}
        service={editingService}
        nextDisplayOrder={nextDisplayOrder}
        onClose={closeModal}
        onSaved={loadServices}
      />

      {/* Service Deletion Confirmation Modal */}
      <DeleteServiceModal
        service={deletingService}
        loading={deleteLoading}
        error={deleteError}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

/**
 * SuperAdmin Kiosk Customization and Hardware page root wrapped in Suspense.
 */
export default function AdminServicePage() {
  return (
    <Suspense fallback={<SuperAdminPageSkeleton />}>
      <CustomizationContent />
    </Suspense>
  );
}