/**
 * @fileoverview Custom React hook for fetching and computing clinical cubicle heatmap metrics.
 *
 * Computes patient processing speed, idle intervals, room utilization percentages, and
 * hourly throughput distributions across the operational day for each examination unit.
 *
 * @module app/dashboard/pages/cubicles/hooks/useCubicleHeatmapData
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  HeatmapViewMode,
  HeatmapRowData,
  HeatmapCellData,
  HeatmapHourlySummary,
  HeatmapDayKpis,
  SpeedRating,
  IdleRating,
  HeatmapPatientItem,
  CubicleStatus,
} from '@/app/dashboard/pages/cubicles/types/cubicle';
import {
  OPERATIONAL_HOURS,
  HEATMAP_SPEED_THRESHOLDS,
  HEATMAP_IDLE_THRESHOLDS,
  CUBICLES_REFRESH_INTERVAL_MS,
} from '@/app/dashboard/pages/cubicles/constants/cubicles';

/** Default fallback duration in minutes when consultation completion is unrecorded. */
const FALLBACK_CONSULT_MINUTES = 15;

/**
 * Safely parses string timestamps into Date instances.
 *
 * @param timestamp - ISO or SQL formatted timestamp string.
 * @returns Valid Date instance or null if unparseable.
 */
function parseTimestamp(timestamp: string | null | undefined): Date | null {
  if (!timestamp) return null;
  const normalized =
    timestamp.includes(' ') && !timestamp.includes('T')
      ? timestamp.replace(' ', 'T')
      : timestamp;
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats a Date object into local YYYY-MM-DD string.
 *
 * @param date - Date object.
 * @returns ISO date string in YYYY-MM-DD format.
 */
function formatIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats an hour string (e.g. "08:00") into a human-readable 12-hour format (e.g. "8:00 AM").
 *
 * @param hourStr - Hour in HH:00 format.
 * @returns Formatted 12-hour string.
 */
function format12Hour(hourStr: string): string {
  const [hourNumStr] = hourStr.split(':');
  const hourNum = parseInt(hourNumStr, 10);
  const period = hourNum >= 12 ? 'PM' : 'AM';
  const displayHour = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${displayHour}:00 ${period}`;
}

/**
 * Evaluates patient processing speed rating based on average consultation minutes.
 *
 * @param patientsCount - Number of consultations.
 * @param avgMinutes - Average minutes per consultation.
 * @returns Categorical speed rating.
 */
function computeSpeedRating(patientsCount: number, avgMinutes: number): SpeedRating {
  if (patientsCount === 0 || avgMinutes <= 0) return 'inactive';
  if (avgMinutes < HEATMAP_SPEED_THRESHOLDS.fastMax) return 'fast';
  if (avgMinutes <= HEATMAP_SPEED_THRESHOLDS.optimalMax) return 'optimal';
  if (avgMinutes <= HEATMAP_SPEED_THRESHOLDS.moderateMax) return 'moderate';
  return 'slow';
}

/**
 * Evaluates cubicle idle downtime rating based on unoccupied minutes.
 *
 * @param patientsCount - Number of consultations.
 * @param idleMinutes - Unoccupied minutes within the 60-minute window.
 * @returns Categorical idle rating.
 */
function computeIdleRating(patientsCount: number, idleMinutes: number): IdleRating {
  if (patientsCount === 0 && idleMinutes >= 55) return 'dormant';
  if (idleMinutes < HEATMAP_IDLE_THRESHOLDS.continuousMax) return 'continuous';
  if (idleMinutes <= HEATMAP_IDLE_THRESHOLDS.lowIdleMax) return 'low-idle';
  if (idleMinutes <= HEATMAP_IDLE_THRESHOLDS.moderateIdleMax) return 'moderate-idle';
  if (idleMinutes <= HEATMAP_IDLE_THRESHOLDS.highIdleMax) return 'high-idle';
  return 'dormant';
}

/**
 * Hook managing data synchronization, operational metrics aggregation, and cell selection
 * for the Cubicles Heatmap component.
 *
 * @returns State properties and handlers for the heatmap visualization.
 */
export function useCubicleHeatmapData() {
  const todayIso = useMemo(() => formatIsoDate(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [viewMode, setViewMode] = useState<HeatmapViewMode>('speed');
  const [availableDates, setAvailableDates] = useState<string[]>([todayIso]);
  const [selectedCell, setSelectedCell] = useState<HeatmapCellData | null>(null);
  const [rows, setRows] = useState<HeatmapRowData[]>([]);
  const [hourlySummaries, setHourlySummaries] = useState<HeatmapHourlySummary[]>([]);
  const [kpis, setKpis] = useState<HeatmapDayKpis>({
    selectedDate: todayIso,
    totalPatientsServed: 0,
    facilityAvgSpeedMinutes: 0,
    facilityAvgIdleMinutes: 0,
    facilityUtilizationPercent: 0,
    peakHour: null,
    peakHourCount: 0,
    mostActiveCubicle: null,
    mostActiveCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const isLive = selectedDate === todayIso;

  /**
   * Fetches distinct dates with patient records to populate the date selector.
   */
  const fetchAvailableDates = useCallback(async () => {
    try {
      const { data, error: queryErr } = await supabase
        .from('patients')
        .select('created_at, consult_start')
        .not('created_at', 'is', null)
        .order('created_at', { ascending: false })
        .limit(300);

      if (queryErr || !data) return;

      const dateSet = new Set<string>();
      dateSet.add(todayIso);

      data.forEach((row: any) => {
        const primaryTs = row.consult_start || row.created_at;
        const parsed = parseTimestamp(primaryTs);
        if (parsed) {
          dateSet.add(formatIsoDate(parsed));
        }
      });

      const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));
      setAvailableDates(sortedDates);
    } catch (err) {
      console.warn('Could not fetch available operational dates:', err);
    }
  }, [todayIso]);

  /**
   * Fetches cubicles, doctor assignments, and patient consultation records for the selected day,
   * then computes the heatmap cells matrix and summary KPIs.
   */
  const fetchHeatmapData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch all configured clinical examination cubicles
      const { data: cubicleData, error: cubicleErr } = await supabase
        .from('cubicle')
        .select('id, cubicleNum, category, doctorId')
        .order('id', { ascending: true });

      if (cubicleErr) throw cubicleErr;
      const cubiclesList = cubicleData || [];

      // 2. Fetch doctor names for assigned cubicles
      const doctorIds = Array.from(
        new Set(cubiclesList.map((c: any) => c.doctorId).filter(Boolean))
      ) as string[];

      const doctorNameMap: Record<string, string> = {};
      if (doctorIds.length > 0) {
        const { data: doctorsData } = await supabase
          .from('doctors')
          .select('id, full_name')
          .in('id', doctorIds);

        if (doctorsData) {
          doctorsData.forEach((d: any) => {
            doctorNameMap[d.id] = d.full_name;
          });
        }
      }

      // 3. Define the query window for the selected date
      const startOfDay = new Date(`${selectedDate}T00:00:00`).toISOString();
      const endOfDay = new Date(`${selectedDate}T23:59:59.999`).toISOString();

      // Fetch patients with cubicle assignments for the selected operational day
      const { data: patientsData, error: patientsErr } = await supabase
        .from('patients')
        .select(
          'id, patientNum, service, cubicleNum, status, created_at, consult_start, consult_end'
        )
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .not('cubicleNum', 'is', null);

      if (patientsErr) {
        console.warn('Error fetching patient consultation records:', patientsErr);
      }

      const rawPatients = patientsData || [];
      const now = new Date();
      const isSelectedDayToday = selectedDate === todayIso;

      // Group patients by normalized cubicle number
      const patientsByCubicle: Record<string, any[]> = {};
      rawPatients.forEach((p: any) => {
        const rawNum = (p.cubicleNum || '').trim();
        if (!rawNum) return;
        const key = rawNum.toLowerCase();
        if (!patientsByCubicle[key]) {
          patientsByCubicle[key] = [];
        }
        patientsByCubicle[key].push(p);
      });

      // 4. Build heatmap rows and cells for each cubicle across operational hours
      const computedRows: HeatmapRowData[] = [];
      const hourlyPatientsMap: Record<string, number> = {};
      const hourlyActiveMinutesMap: Record<string, number> = {};
      const hourlyActiveCubiclesMap: Record<string, number> = {};

      OPERATIONAL_HOURS.forEach((h) => {
        hourlyPatientsMap[h] = 0;
        hourlyActiveMinutesMap[h] = 0;
        hourlyActiveCubiclesMap[h] = 0;
      });

      let totalDayPatients = 0;
      let totalDayActiveMinutes = 0;
      let totalDayPossibleSlotMinutes = 0;
      let topCubicleName: string | null = null;
      let topCubicleCount = 0;

      cubiclesList.forEach((cubicle: any) => {
        const cubicleKey = cubicle.cubicleNum.trim().toLowerCase();
        const cubiclePatients = patientsByCubicle[cubicleKey] || [];
        const doctorName = cubicle.doctorId ? doctorNameMap[cubicle.doctorId] : undefined;

        const cells: Record<string, HeatmapCellData> = {};
        let cubicleTotalPatients = 0;
        let cubicleTotalActiveMinutes = 0;
        let cubicleEvaluatedSlots = 0;

        OPERATIONAL_HOURS.forEach((hourStr) => {
          const [hNumStr] = hourStr.split(':');
          const hNum = parseInt(hNumStr, 10);

          const slotStart = new Date(`${selectedDate}T${hourStr}:00`);
          const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
          const nextHourStr = `${String(hNum + 1).padStart(2, '0')}:00`;
          const timeSlotLabel = `${hourStr} - ${nextHourStr}`;
          const hourLabel = format12Hour(hourStr);

          const isUpcoming = isSelectedDayToday && slotStart > now;
          const isCurrentHour = isSelectedDayToday && now >= slotStart && now < slotEnd;

          // Find consultations intersecting this 60-minute window
          const slotPatientItems: HeatmapPatientItem[] = [];
          let slotActiveMinutes = 0;

          cubiclePatients.forEach((patient: any) => {
            const consultStart =
              parseTimestamp(patient.consult_start) || parseTimestamp(patient.created_at);
            if (!consultStart) return;

            let consultEnd = parseTimestamp(patient.consult_end);
            if (!consultEnd) {
              if (patient.status?.toLowerCase() === 'done') {
                consultEnd = new Date(
                  consultStart.getTime() + FALLBACK_CONSULT_MINUTES * 60000
                );
              } else if (isSelectedDayToday) {
                consultEnd = now < slotEnd ? now : slotEnd;
              } else {
                consultEnd = new Date(
                  consultStart.getTime() + FALLBACK_CONSULT_MINUTES * 60000
                );
              }
            }

            // Check if consultation intersects [slotStart, slotEnd]
            if (consultEnd > slotStart && consultStart < slotEnd) {
              const overlapStart = Math.max(consultStart.getTime(), slotStart.getTime());
              const overlapEnd = Math.min(consultEnd.getTime(), slotEnd.getTime());
              const overlapMinutes = Math.max(0, (overlapEnd - overlapStart) / 60000);

              const fullDuration = Math.max(
                1,
                Math.round((consultEnd.getTime() - consultStart.getTime()) / 60000)
              );

              slotActiveMinutes += overlapMinutes;
              slotPatientItems.push({
                id: patient.id,
                patientNum: patient.patientNum || `P-${patient.id}`,
                service: patient.service || 'General',
                consultStart: consultStart.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                consultEnd: patient.consult_end
                  ? consultEnd.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : null,
                durationMinutes: fullDuration,
                status: patient.status || 'Done',
              });
            }
          });

          // Cap active consultation minutes to the 60-minute slot limit
          const boundedActiveMinutes = Math.min(60, Math.round(slotActiveMinutes));
          const idleMinutes = isUpcoming ? 0 : Math.max(0, 60 - boundedActiveMinutes);
          const occupancyPercent = isUpcoming
            ? 0
            : Math.round((boundedActiveMinutes / 60) * 100);

          const patientsCount = slotPatientItems.length;
          const avgSpeedMinutes =
            patientsCount > 0
              ? parseFloat((boundedActiveMinutes / patientsCount).toFixed(1))
              : 0;

          const speedRating = computeSpeedRating(patientsCount, avgSpeedMinutes);
          const idleRating = computeIdleRating(patientsCount, idleMinutes);

          cells[hourStr] = {
            cubicleNum: cubicle.cubicleNum,
            hour: hourStr,
            hourLabel,
            timeSlotLabel,
            patientsCount,
            patients: slotPatientItems,
            totalActiveMinutes: boundedActiveMinutes,
            idleMinutes,
            occupancyPercent,
            avgSpeedMinutes,
            speedRating,
            idleRating,
            isUpcoming,
            isCurrentHour,
          };

          if (!isUpcoming) {
            cubicleTotalPatients += patientsCount;
            cubicleTotalActiveMinutes += boundedActiveMinutes;
            cubicleEvaluatedSlots += 1;

            hourlyPatientsMap[hourStr] += patientsCount;
            hourlyActiveMinutesMap[hourStr] += boundedActiveMinutes;
            if (patientsCount > 0) {
              hourlyActiveCubiclesMap[hourStr] += 1;
            }
          }
        });

        const dailyAvailableMinutes = cubicleEvaluatedSlots * 60;
        const dailyTotalIdleMinutes = Math.max(
          0,
          dailyAvailableMinutes - cubicleTotalActiveMinutes
        );
        const dailyOccupancyPercent =
          dailyAvailableMinutes > 0
            ? Math.round((cubicleTotalActiveMinutes / dailyAvailableMinutes) * 100)
            : 0;
        const dailyAvgSpeedMinutes =
          cubicleTotalPatients > 0
            ? parseFloat(
                (cubicleTotalActiveMinutes / cubicleTotalPatients).toFixed(1)
              )
            : 0;

        totalDayPatients += cubicleTotalPatients;
        totalDayActiveMinutes += cubicleTotalActiveMinutes;
        totalDayPossibleSlotMinutes += dailyAvailableMinutes;

        if (cubicleTotalPatients > topCubicleCount) {
          topCubicleCount = cubicleTotalPatients;
          topCubicleName = cubicle.cubicleNum;
        }

        computedRows.push({
          cubicleId: cubicle.id,
          cubicleNum: cubicle.cubicleNum,
          category: cubicle.category || 'General',
          assignedDoctor: doctorName,
          liveStatus: (cubiclePatients.some((p: any) =>
            ['on progress', 'consulting', 'serving'].includes(
              (p.status || '').toLowerCase()
            )
          )
            ? 'occupied'
            : 'available') as CubicleStatus,
          cells,
          dailyTotalPatients: cubicleTotalPatients,
          dailyAvgSpeedMinutes: dailyAvgSpeedMinutes,
          dailyTotalActiveMinutes: cubicleTotalActiveMinutes,
          dailyTotalIdleMinutes: dailyTotalIdleMinutes,
          dailyOccupancyPercent: dailyOccupancyPercent,
        });
      });

      // 5. Compute hourly summaries across all cubicles
      let peakHourStr: string | null = null;
      let peakHourCount = 0;

      const summaries: HeatmapHourlySummary[] = OPERATIONAL_HOURS.map((hourStr) => {
        const slotStart = new Date(`${selectedDate}T${hourStr}:00`);
        const isUpcoming = isSelectedDayToday && slotStart > now;
        const count = isUpcoming ? 0 : hourlyPatientsMap[hourStr] || 0;
        const activeMinutes = isUpcoming ? 0 : hourlyActiveMinutesMap[hourStr] || 0;
        const activeCubicles = isUpcoming ? 0 : hourlyActiveCubiclesMap[hourStr] || 0;

        const totalCapacity = cubiclesList.length * 60;
        const avgIdleMinutes = isUpcoming
          ? 0
          : cubiclesList.length > 0
          ? Math.round(Math.max(0, totalCapacity - activeMinutes) / cubiclesList.length)
          : 0;

        const avgOccupancyPercent =
          totalCapacity > 0 ? Math.round((activeMinutes / totalCapacity) * 100) : 0;
        const avgSpeedMinutes =
          count > 0 ? parseFloat((activeMinutes / count).toFixed(1)) : 0;

        if (count > peakHourCount) {
          peakHourCount = count;
          peakHourStr = hourStr;
        }

        return {
          hour: hourStr,
          hourLabel: format12Hour(hourStr),
          totalPatients: count,
          avgSpeedMinutes,
          avgIdleMinutes,
          avgOccupancyPercent,
          activeCubiclesCount: activeCubicles,
        };
      });

      // 6. Compute top-level facility KPIs
      const facilityAvgSpeed =
        totalDayPatients > 0
          ? parseFloat((totalDayActiveMinutes / totalDayPatients).toFixed(1))
          : 0;

      const facilityAvgIdle =
        totalDayPossibleSlotMinutes > 0 && cubiclesList.length > 0
          ? Math.round(
              (totalDayPossibleSlotMinutes - totalDayActiveMinutes) /
                (totalDayPossibleSlotMinutes / 60)
            )
          : 0;

      const facilityUtilization =
        totalDayPossibleSlotMinutes > 0
          ? Math.round((totalDayActiveMinutes / totalDayPossibleSlotMinutes) * 100)
          : 0;

      setRows(computedRows);
      setHourlySummaries(summaries);
      setKpis({
        selectedDate,
        totalPatientsServed: totalDayPatients,
        facilityAvgSpeedMinutes: facilityAvgSpeed,
        facilityAvgIdleMinutes: facilityAvgIdle,
        facilityUtilizationPercent: facilityUtilization,
        peakHour: peakHourStr ? format12Hour(peakHourStr) : null,
        peakHourCount,
        mostActiveCubicle: topCubicleName,
        mostActiveCount: topCubicleCount,
      });
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Heatmap data fetch failed:', err);
      setError(err.message || 'Failed to compute cubicle heatmap data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, todayIso]);

  // Initial fetch of available dates and heatmap calculations
  useEffect(() => {
    fetchAvailableDates();
  }, [fetchAvailableDates]);

  useEffect(() => {
    fetchHeatmapData();

    // Auto-refresh when looking at today's live operational queue
    if (isLive) {
      const interval = setInterval(() => {
        fetchHeatmapData();
      }, CUBICLES_REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [fetchHeatmapData, isLive]);

  return {
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    availableDates,
    selectedCell,
    setSelectedCell,
    rows,
    hourlySummaries,
    kpis,
    loading,
    error,
    isLive,
    lastUpdated,
    refresh: fetchHeatmapData,
  };
}
