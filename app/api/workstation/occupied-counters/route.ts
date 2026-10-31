/**
 * @fileoverview Registration Counter Occupancy and Service Scope Discovery API.
 *
 * Returns real-time status of all physical registration counters including:
 * - Administrative activation (active)
 * - Temporary staff break holds (on_break)
 * - Live staff occupancy (occupied by user in user_counters)
 * - Designated clinical service scopes (derived from user_services and counter configuration)
 *
 * Security & Data Privacy:
 * - Omits patient and auth secrets; returns sanitized station operational metadata only.
 * - Employs no-cache headers to prevent stale station routing.
 *
 * @module app/api/workstation/occupied-counters/route
 */

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/facilityHelpers';

export async function GET() {
  try {
    const [countersResult, userCountersResult, userServicesResult, servicesCatalogResult] = await Promise.all([
      supabaseAdmin
        .from('counters')
        .select('counter_number, label, active, on_break')
        .eq('active', true)
        .order('counter_number', { ascending: true }),
      supabaseAdmin
        .from('user_counters')
        .select('counter, user_id, users(id, username)'),
      supabaseAdmin
        .from('user_services')
        .select('user_id, service'),
      supabaseAdmin
        .from('services')
        .select('label_en, key'),
    ]);

    if (countersResult.error) {
      return NextResponse.json({ error: countersResult.error.message }, { status: 500 });
    }

    // Map user_id to assigned clinical services
    const userServicesMap = new Map<number, Set<string>>();
    for (const row of userServicesResult.data ?? []) {
      if (!userServicesMap.has(row.user_id)) {
        userServicesMap.set(row.user_id, new Set());
      }
      if (row.service && typeof row.service === 'string') {
        userServicesMap.get(row.user_id)!.add(row.service.trim());
      }
    }

    // Map counter_number to active staff users and combined services
    const counterMap = new Map<
      number,
      { users: { userId: number; username: string }[]; services: Set<string> }
    >();

    for (const row of userCountersResult.data ?? []) {
      if (!counterMap.has(row.counter)) {
        counterMap.set(row.counter, { users: [], services: new Set() });
      }
      const userObj = row.users as { id?: number; username?: string } | null;
      counterMap.get(row.counter)!.users.push({
        userId: row.user_id,
        username: userObj?.username || `staff-${row.user_id}`,
      });

      const userSvcs = userServicesMap.get(row.user_id);
      if (userSvcs) {
        for (const s of userSvcs) {
          counterMap.get(row.counter)!.services.add(s);
        }
      }
    }

    const availableServices = servicesCatalogResult.data ?? [];

    const counters = (countersResult.data ?? []).map(c => {
      const station = counterMap.get(c.counter_number);
      const isOccupied = Boolean(station && station.users.length > 0);
      const services = station ? Array.from(station.services) : [];

      // If counter label specifies a known service and services list is empty, honor label
      if (services.length === 0 && c.label) {
        const labelLower = c.label.toLowerCase();
        for (const s of availableServices) {
          if (s.label_en && labelLower.includes(s.label_en.toLowerCase())) {
            services.push(s.label_en);
          } else if (s.key && labelLower.includes(s.key.toLowerCase())) {
            services.push(s.label_en);
          }
        }
        if (services.length === 0) {
          if (labelLower.includes('opd') || labelLower.includes('screening')) {
            services.push('OPD Screening');
          } else if (labelLower.includes('consultation')) {
            services.push('Consultation');
          }
        }
      }

      return {
        counter_number: c.counter_number,
        label: c.label || `Counter ${c.counter_number}`,
        active: Boolean(c.active),
        on_break: Boolean(c.on_break),
        occupied: isOccupied,
        services,
        occupiedBy: station ? station.users : [],
      };
    });

    return NextResponse.json(
      { counters },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve occupied counters.' },
      { status: 500 }
    );
  }
}
