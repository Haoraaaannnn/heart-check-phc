'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface Cubicle {
  id: number;
  cubicleNum: string;
  category: string;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  patientId?: string;
  service?: string;
  timeOccupied?: Date;
  estimatedEndTime?: Date;
}

interface CubicleRecord {
  id: number;
  cubicleNum: string;
  category: string;
}

interface PatientRecord {
  id: number;
  patientNum: string;
  service: string;
  status: string;
  cubicleNum: string | null;
  consult_start: string | null;
  created_at: string;
}

export default function CubiclesPage() {
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Fetch cubicle data from database
  const fetchCubicleData = async () => {
    try {
      setLoading(true);

      // Fetch all cubicles
      const { data: cubicleData, error: cubicleError } = await supabase
        .from('cubicle')
        .select('*')
        .order('id', { ascending: true });

      if (cubicleError) {
        console.error('Error fetching cubicles:', cubicleError);
        setCubicles([]);
        return;
      }

      // Fetch current patients with cubicle assignments
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id, patientNum, service, status, cubicleNum, consult_start, created_at')
        .in('status', ['On Progress', 'Consulting', 'Serving'])
        .not('cubicleNum', 'is', null);

      if (patientError) {
        console.error('Error fetching patients:', patientError);
      }

      // Create cubicle status map
      const patientMap = new Map<string, PatientRecord>();
      if (patientData) {
        patientData.forEach(patient => {
          if (patient.cubicleNum) {
            patientMap.set(patient.cubicleNum, patient);
          }
        });
      }

      // Build cubicle status array
      const cubicleStatuses: Cubicle[] = [];

      if (cubicleData && cubicleData.length > 0) {
        cubicleData.forEach((cubicle: CubicleRecord, index: number) => {
          const patient = patientMap.get(cubicle.cubicleNum);
          let status: 'available' | 'occupied' | 'maintenance' | 'cleaning' = 'available';
          let patientId: string | undefined;
          let service: string | undefined;
          let timeOccupied: Date | undefined;
          let estimatedEndTime: Date | undefined;

          if (patient) {
            status = 'occupied';
            patientId = patient.patientNum;
            service = patient.service;
            timeOccupied = patient.consult_start ? new Date(patient.consult_start) : new Date(patient.created_at);

            // Estimate end time (assume average consultation time of 15-30 minutes)
            if (timeOccupied) {
              const avgConsultationTime = 20; // minutes
              estimatedEndTime = new Date(timeOccupied.getTime() + avgConsultationTime * 60000);
            }
          }

          cubicleStatuses.push({
            id: cubicle.id,
            cubicleNum: cubicle.cubicleNum,
            category: cubicle.category,
            status,
            patientId,
            service,
            timeOccupied,
            estimatedEndTime,
          });
        });
      } else {
        // No cubicles in database, show default empty state
        cubicleStatuses.push(
          { id: 1, cubicleNum: 'Cubicle 1', category: 'General', status: 'available' },
          { id: 2, cubicleNum: 'Cubicle 2', category: 'General', status: 'available' },
          { id: 3, cubicleNum: 'Cubicle 3', category: 'General', status: 'available' },
          { id: 4, cubicleNum: 'Cubicle 4', category: 'General', status: 'available' },
          { id: 5, cubicleNum: 'Cubicle 5', category: 'General', status: 'available' },
          { id: 6, cubicleNum: 'Cubicle 6', category: 'General', status: 'available' },
          { id: 7, cubicleNum: 'Cubicle 7', category: 'General', status: 'available' },
          { id: 8, cubicleNum: 'Cubicle 8', category: 'General', status: 'available' },
        );
      }

      setCubicles(cubicleStatuses);
    } catch (error) {
      console.error('Error fetching cubicle data:', error);
      setCubicles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCubicleData();

    // Update current time every minute for live updates
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Refresh cubicle data every 30 seconds
    const refreshTimer = setInterval(() => {
      fetchCubicleData();
    }, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(refreshTimer);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-300 text-green-800';
      case 'occupied': return 'bg-red-100 border-red-300 text-red-800';
      case 'maintenance': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'cleaning': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '✅';
      case 'occupied': return '👤';
      case 'maintenance': return '🔧';
      case 'cleaning': return '🧹';
      default: return '❓';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeRemaining = (endTime: Date) => {
    const remaining = Math.max(0, endTime.getTime() - currentTime.getTime());
    const minutes = Math.floor(remaining / 60000);
    return minutes > 0 ? `${minutes}m` : '<1m';
  };

  const stats = {
    total: cubicles.length,
    available: cubicles.filter(c => c.status === 'available').length,
    occupied: cubicles.filter(c => c.status === 'occupied').length,
    unavailable: cubicles.filter(c => c.status !== 'available' && c.status !== 'occupied').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading cubicle data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Live Cubicle Dashboard</h1>
          <p className="text-gray-600">Real-time status of examination cubicles</p>
          <p className="text-xs text-gray-400 mt-1">Last updated: {formatTime(currentTime)}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cubicles</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total || 0}</p>
              </div>
              <div className="text-2xl">🏥</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.available || 0}</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Occupied</p>
                <p className="text-2xl font-bold text-red-600">{stats.occupied || 0}</p>
              </div>
              <div className="text-2xl">👤</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unavailable</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.unavailable || 0}</p>
              </div>
              <div className="text-2xl">🔧</div>
            </div>
          </div>
        </div>

        {/* Cubicle Grid */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Cubicle Status</h2>
          {cubicles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No cubicles configured in the system.</p>
              <p className="text-sm text-gray-400 mt-2">Contact administrator to set up cubicles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {cubicles.map((cubicle) => (
                <div
                  key={cubicle.id}
                  className={`p-4 rounded-lg border-2 ${getStatusColor(cubicle.status)} transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{cubicle.cubicleNum}</h3>
                    <span className="text-xl">{getStatusIcon(cubicle.status)}</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 capitalize">{cubicle.category}</p>
                    <p className="text-sm capitalize font-medium">{cubicle.status}</p>

                    {cubicle.patientId && (
                      <p className="text-xs text-gray-600">Patient: {cubicle.patientId}</p>
                    )}

                    {cubicle.service && (
                      <p className="text-xs text-gray-600">Service: {cubicle.service}</p>
                    )}

                    {cubicle.timeOccupied && (
                      <p className="text-xs text-gray-600">
                        Since: {formatTime(cubicle.timeOccupied)}
                      </p>
                    )}

                    {cubicle.estimatedEndTime && cubicle.status === 'occupied' && (
                      <p className="text-xs text-gray-600">
                        Est. end: {formatTime(cubicle.estimatedEndTime)} ({getTimeRemaining(cubicle.estimatedEndTime)})
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Status Legend</h3>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <span>✅</span>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <span>👤</span>
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🔧</span>
              <span>Maintenance</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🧹</span>
              <span>Cleaning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}