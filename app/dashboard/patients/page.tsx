'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PatientMetricCard from '@/components/reusables/patientMetricCard';
import PatientHeaderCard from '@/components/reusables/patientHeaderCard';
import AnalyticsMetricCards from '@/components/reusables/analyticsMetricCards';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { textDark, textLight } from '@/constants/themes';

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

interface AllRecentPatient extends RecentPatient {
  createdAtDate: Date;
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
const PATIENTS_PER_PAGE = 20;

export default function PatientsPage() {
  const [stats, setStats] = useState<PatientStats>({
    totalToday: 0,
    inQueue: 0,
    servedToday: 0,
    avgWaitTime: 0,
  });

  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [allRecentPatients, setAllRecentPatients] = useState<AllRecentPatient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
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

      // Fetch today's patients for stats
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const { data: todayPatientData, error: todayError } = await supabase
        .from('patients')
        .select('id, patientNum, service, status, created_at, consult_start')
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch all recent patients (last 30 days) for the recent patients table
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data: allPatientData, error: allError } = await supabase
        .from('patients')
        .select('id, patientNum, service, status, created_at, consult_start')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

      if (todayError) {
        throw todayError;
      }

      // Process today's patients for stats
      let inQueueCount = 0;
      let servedCount = 0;
      const serviceCount: Record<string, number> = {};
      const recentPatientsList: RecentPatient[] = [];

      if (todayPatientData) {
        todayPatientData.forEach((patient) => {
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

          // Add to recent patients for display
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

      // Process all recent patients for the paginated table
      if (allPatientData && allPatientData.length > 0) {
        const allPatientsList: AllRecentPatient[] = allPatientData.map((patient) => {
          const serviceName = patient.service || 'General';
          return {
            id: patient.id.toString(),
            patientNum: patient.patientNum,
            service: serviceName,
            status: patient.status || 'Unknown',
            createdAt: new Date(patient.created_at).toLocaleString(),
            createdAtDate: new Date(patient.created_at),
            waitTime: patient.consult_start ?
              Math.round((new Date(patient.consult_start).getTime() - new Date(patient.created_at).getTime()) / 60000) :
              undefined,
          };
        });
        setAllRecentPatients(allPatientsList);
        setCurrentPage(1);
      } else {
        setAllRecentPatients([]);
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
      setAllRecentPatients([]);
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
      <div className="min-h-screen">
        <div className="px-8 py-6">
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

  // Pagination calculations
  const totalPages = Math.ceil(allRecentPatients.length / PATIENTS_PER_PAGE);
  const startIdx = (currentPage - 1) * PATIENTS_PER_PAGE;
  const endIdx = startIdx + PATIENTS_PER_PAGE;
  const paginatedPatients = allRecentPatients.slice(startIdx, endIdx);

  return (
    <div className="min-h-screen">

      <div className="px-8 py-6 mx-auto max-w-10xl flex flex-col gap-6">
        <div className="mb-2">
          <h1 className={`text-3xl font-bold text-gray-800 dark:text-gray-200`}>Patient Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Patient statistics and queue management overview</p>
          {error && (
            <p className="text-sm text-red-600 mt-2">⚠️ {error}</p>
          )}
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <PatientMetricCard>
            <PatientHeaderCard>Total Today</PatientHeaderCard>
            <span className="text-5xl font-extrabold text-blue-600 self-end">{stats.totalToday}</span>
          </PatientMetricCard>

          <PatientMetricCard>
            <PatientHeaderCard>In Queue</PatientHeaderCard>
            <span className="text-5xl font-extrabold text-yellow-600 self-end">{stats.inQueue}</span>
          </PatientMetricCard>

          <PatientMetricCard>
            <PatientHeaderCard>Served Today</PatientHeaderCard>
            <span className="text-5xl font-extrabold text-green-600 self-end">{stats.servedToday}</span>
          </PatientMetricCard>

          <PatientMetricCard>
            <PatientHeaderCard>Avg Wait Time</PatientHeaderCard>
            <span className="text-4xl font-extrabold text-red-600 self-end">{stats.avgWaitTime}m</span>
          </PatientMetricCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Service Distribution */}
          <AnalyticsMetricCards>
            <h2 className={`text-xl font-extrabold mb-6 text-gray-800 dark:text-gray-200`}>Service Distribution</h2>
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
          </AnalyticsMetricCards>

          {/* Hourly Patient Flow */}
          <AnalyticsMetricCards>
            <h2 className={`text-xl font-extrabold mb-6 text-gray-800 dark:text-gray-200`}>Hourly Patient Flow</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="patients" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </AnalyticsMetricCards>
        </div>

        {/* Recent Patients with Pagination */}
        <AnalyticsMetricCards>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-xl font-extrabold text-gray-800 dark:text-gray-200`}>All Recent Patients</h2>
              <p className="text-sm text-gray-400 mt-1">Patients from the last 30 days</p>
            </div>
            <div className="text-xs text-gray-400 font-semibold">
              {allRecentPatients.length > 0 && (
                <span>Showing <span className="text-gray-700 dark:text-gray-300">{startIdx + 1}</span> to <span className="text-gray-700 dark:text-gray-300">{Math.min(endIdx, allRecentPatients.length)}</span> of <span className="text-gray-700 dark:text-gray-300">{allRecentPatients.length}</span> patients</span>
              )}
            </div>
          </div>

          {allRecentPatients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent patients found.</p>
              <p className="text-sm text-gray-400 mt-2">Patient data will appear here as registrations occur.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="pb-4 px-4 text-xs font-bold text-gray-400 tracking-wider uppercase">Patient #</th>
                      <th className="pb-4 px-4 text-xs font-bold text-gray-400 tracking-wider uppercase">Service</th>
                      <th className="pb-4 px-4 text-xs font-bold text-gray-400 tracking-wider uppercase">Status</th>
                      <th className="pb-4 px-4 text-xs font-bold text-gray-400 tracking-wider uppercase">Time</th>
                      <th className="pb-4 px-4 text-xs font-bold text-gray-400 tracking-wider uppercase">Wait Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPatients.map((patient) => (
                      <tr key={patient.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition">
                        <td className="py-4 px-4">
                          <span className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-extrabold px-3 py-1 rounded-lg text-sm">
                            {patient.patientNum || '---'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
                          {patient.service}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(patient.status)}`}>
                            {patient.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">
                          {patient.createdAt}
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
                          {patient.waitTime !== undefined ? `${patient.waitTime}m` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition ${
                        currentPage === page
                          ? 'bg-red-600 text-white'
                          : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </AnalyticsMetricCards>
      </div>
    </div>
  );
}