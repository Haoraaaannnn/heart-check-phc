/** @fileoverview Compatibility factory returning the single configured browser Supabase client. */
import { supabase } from '@/lib/supabase';

/** @returns The shared cookie client, with consistent refresh and session-cookie configuration. */
export function createClient() { return supabase; }
