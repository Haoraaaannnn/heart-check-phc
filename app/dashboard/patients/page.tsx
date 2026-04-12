'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

interface PatientStats {
  totalToday: number;
  inQueue: number;
  servedToday: number;
  avgWaitTime: number;
}

interface RecentPatient {
  id: string;
  patientNum: string;
  service: string;
  status: string;
  createdAt: string;
  waitTime?: number;
}

interface AnalyticsData {
  daily_summary?: Array<{
    visit_date: string;
    total_patients: number;
    avg_wait_registration: number;
    avg_wait_consultation: number;
    avg_total_time: number;
  }>;
  hourly_pattern?: Array<{
    hour: number;
    avg_patients: number;
    avg_wait_consultation: number;
    time_label: string;
  }>;
  bottleneck_analysis?: {
    bottleneck_stage: string;
    avg_wait_registration_min: number;
    avg_wait_consultation_min: number;
    system_status: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PatientsPage() {
  const [stats, setStats] = useState<PatientStats>({
    totalToday: 0,
    inQueue: 0,
    servedToday: 0,
    avgWaitTime: 0,
  });

  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<{ name: string; value: number }[]>([]);
  const [hourlyData, setHourlyData] = useState<{ hour: string; patients: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch from Python backend analytics API
      const response = await fetch('http://localhost:8000/api/dashboard-data');
      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }
      const analyticsData: AnalyticsData = await response.json();

      // Process analytics data
      if (analyticsData.daily_summary && analyticsData.daily_summary.length > 0) {
        const todayData = analyticsData.daily_summary[analyticsData.daily_summary.length - 1];
        setStats({
          totalToday: todayData.total_patients || 0,
          inQueue: 0, // Will be calculated from patient data
          servedToday: todayData.total_patients || 0,
          avgWaitTime: Math.round((todayData.avg_wait_registration + todayData.avg_wait_consultation) / 2) || 0,
        });
      }

      // Process hourly data
      if (analyticsData.hourly_pattern && analyticsData.hourly_pattern.length > 0) {
        const formattedHourly = analyticsData.hourly_pattern.map(item => ({
          hour: item.time_label.split('–')[0],
          patients: item.avg_patients || 0,
        }));
        setHourlyData(formattedHourly);
      } else {
        // Default hourly data if no analytics available
        setHourlyData([
          { hour: '08:00', patients: 0 },
          { hour: '09:00', patients: 0 },
          { hour: '10:00', patients: 0 },
          { hour: '11:00', patients: 0 },
          { hour: '12:00', patients: 0 },
          { hour: '13:00', patients: 0 },
          { hour: '14:00', patients: 0 },
          { hour: '15:00', patients: 0 },
        ]);
      }

    } catch (analyticsError) {
      console.warn('Analytics API not available, using fallback data:', analyticsError);
      // Fallback to basic stats if analytics API fails
      setStats({
        totalToday: 0,
        inQueue: 0,
        servedToday: 0,
        avgWaitTime: 0,
      });
      setHourlyData([
        { hour: '08:00', patients: 0 },
        { hour: '09:00', patients: 0 },
        { hour: '10:00', patients: 0 },
        { hour: '11:00', patients: 0 },
        { hour: '12:00', patients: 0 },
        { hour: '13:00', patients: 0 },
        { hour: '14:00', patients: 0 },
        { hour: '15:00', patients: 0 },
      ]);
    }
  };

  const fetchPatientData = async () => {
    try {
      setError(null);

      // Fetch today's patients
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id, patientNum, service, status, created_at, consult_start')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay)
        .order('created_at', { ascending: false })
        .limit(20);

      if (patientError) {
        throw patientError;
      }

      // Process patient data
      let inQueueCount = 0;
      let servedCount = 0;
      const serviceCount: Record<string, number> = {};
      const recentPatientsList: RecentPatient[] = [];

      if (patientData) {
        patientData.forEach((patient) => {
          const currentStatus = patient.status ? patient.status.toLowerCase().trim() : '';

          // Count queue and served
          if (['pending', 'waiting', 'assigned'].includes(currentStatus)) {
            inQueueCount++;
          } else if (['completed', 'done', 'served'].includes(currentStatus)) {
            servedCount++;
          }

          // Count services
          const serviceName = patient.service || 'General';
          serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;

          // Add to recent patients
          recentPatientsList.push({
            id: patient.id.toString(),
            patientNum: patient.patientNum,
            service: serviceName,
            status: patient.status || 'Unknown',
            createdAt: new Date(patient.created_at).toLocaleString(),
            waitTime: patient.consult_start ?
              Math.round((new Date(patient.consult_start).getTime() - new Date(patient.created_at).getTime()) / 60000) :
              undefined,
          });
        });

        // Update stats with real patient data
        setStats(prev => ({
          ...prev,
          inQueue: inQueueCount,
          servedToday: servedCount,
          totalToday: inQueueCount + servedCount,
        }));

        // Process service distribution
        const serviceDist = Object.entries(serviceCount).map(([name, value]) => ({
          name,
          value,
        }));
        setServiceDistribution(serviceDist.length > 0 ? serviceDist : [
          { name: 'No Data', value: 1 }
        ]);

        setRecentPatients(recentPatientsList);
      } else {
        // No patient data
        setStats(prev => ({
          ...prev,
          inQueue: 0,
          servedToday: 0,
          totalToday: 0,
        }));
        setServiceDistribution([{ name: 'No Data', value: 1 }]);
        setRecentPatients([]);
      }

    } catch (err) {
      console.error('Error fetching patient data:', err);
      setError('Failed to load patient data');
      // Set default empty state
      setStats({
        totalToday: 0,
        inQueue: 0,
        servedToday: 0,
        avgWaitTime: 0,
      });
      setServiceDistribution([{ name: 'No Data', value: 1 }]);
      setRecentPatients([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAnalyticsData(), fetchPatientData()]);
      setLoading(false);
    };

    loadData();

    // Refresh data every 30 seconds
    const refreshTimer = setInterval(() => {
      fetchPatientData();
    }, 30000);

    return () => clearInterval(refreshTimer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in queue':
      case 'waiting':
      case 'pending':
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'in service':
      case 'on progress':
      case 'consulting':
      case 'serving':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
      case 'done':
      case 'served':
        return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading patient data...</p>
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Patient Dashboard</h1>
          <p className="text-gray-600">Patient statistics and queue management overview</p>
          {error && (
            <p className="text-sm text-red-600 mt-2">⚠️ {error}</p>
          )}
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalToday}</p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Queue</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inQueue}</p>
              </div>
              <div className="text-2xl">⏳</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Served Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.servedToday}</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Wait Time</p>
                <p className="text-2xl font-bold text-red-600">{stats.avgWaitTime}m</p>
              </div>
              <div className="text-2xl">⏱️</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Service Distribution */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Service Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Hourly Patient Flow */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Hourly Patient Flow</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="patients" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Patients */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Patients</h2>
          {recentPatients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No patients registered today.</p>
              <p className="text-sm text-gray-400 mt-2">Patient data will appear here as registrations occur.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Patient #</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Service</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Time</th>
                    <th className="text-left py-2 px-4 font-medium text-gray-700">Wait Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPatients.map((patient) => (
                    <tr key={patient.id} className="border-b border-gray-100">
                      <td className="py-2 px-4 font-medium">{patient.patientNum}</td>
                      <td className="py-2 px-4">{patient.service}</td>
                      <td className="py-2 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-600">{patient.createdAt}</td>
                      <td className="py-2 px-4">
                        {patient.waitTime !== undefined ? `${patient.waitTime}m` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Add New Patient
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Export Report
            </button>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
              Manage Queue
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}