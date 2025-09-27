'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { AppointmentCalendar } from '@/components/dashboard/appointment-calendar';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todaysAppointments: 0,
    monthlyRevenue: 0,
    pendingRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const supabase = createClient();
    
    try {
      // Fetch total patients (approved only)
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('registration_status', 'approved');

      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today)
        .eq('status', 'scheduled');

      // Fetch pending registrations
      const { count: pendingCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('registration_status', 'pending');

      // Fetch monthly revenue
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const { data: treatments } = await supabase
        .from('treatments')
        .select('total_amount')
        .gte('treatment_date', firstDayOfMonth.toISOString())
        .eq('payment_status', 'paid');

      const monthlyRevenue = treatments?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0;

      setStats({
        totalPatients: patientsCount || 0,
        todaysAppointments: appointmentsCount || 0,
        monthlyRevenue,
        pendingRegistrations: pendingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back to LAV Dentaire</p>
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivities />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentCalendar />
        </CardContent>
      </Card>
    </div>
  );
}