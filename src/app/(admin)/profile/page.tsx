'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, User, Calendar, Shield, Activity, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AdminProfile {
  id: string;
  email: string;
  username: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface ActivityStats {
  totalPatients: number;
  totalAppointments: number;
  totalTreatments: number;
  todayAppointments: number;
  weekAppointments: number;
  pendingRegistrations: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [stats, setStats] = useState<ActivityStats>({
    totalPatients: 0,
    totalAppointments: 0,
    totalTreatments: 0,
    todayAppointments: 0,
    weekAppointments: 0,
    pendingRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get admin profile
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setProfile({
          id: user.id,
          email: user.email || '',
          username: adminData?.username || 'admin',
          created_at: adminData?.created_at || user.created_at,
          last_sign_in_at: user.last_sign_in_at,
        });
      }

      // Fetch activity statistics
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      // Total patients
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('registration_status', 'approved');

      // Total appointments
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true });

      // Today's appointments
      const { count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today)
        .eq('status', 'scheduled');

      // Week's appointments
      const { count: weekCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('appointment_date', weekAgo.toISOString().split('T')[0])
        .eq('status', 'scheduled');

      // Total treatments
      const { count: treatmentsCount } = await supabase
        .from('treatments')
        .select('*', { count: 'exact', head: true });

      // Pending registrations
      const { count: pendingCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .eq('registration_status', 'pending');

      setStats({
        totalPatients: patientsCount || 0,
        totalAppointments: appointmentsCount || 0,
        totalTreatments: treatmentsCount || 0,
        todayAppointments: todayCount || 0,
        weekAppointments: weekCount || 0,
        pendingRegistrations: pendingCount || 0,
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
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
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">Your admin account information and activity</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Admin Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" />
                <AvatarFallback className="text-2xl">
                  {profile?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="mt-4 text-xl font-semibold">{profile?.username}</h3>
              <Badge variant="secondary" className="mt-2">
                <Shield className="mr-1 h-3 w-3" />
                Administrator
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Admin Account</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Joined {profile?.created_at ? formatDate(profile.created_at) : 'N/A'}
                </span>
              </div>
              {profile?.last_sign_in_at && (
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Last login: {new Date(profile.last_sign_in_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>Your administrative activity and system statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="stats">
              <TabsList>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              </TabsList>
              
              <TabsContent value="stats" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Patients</p>
                    <p className="text-2xl font-bold">{stats.totalPatients}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Appointments</p>
                    <p className="text-2xl font-bold">{stats.totalAppointments}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Treatments</p>
                    <p className="text-2xl font-bold">{stats.totalTreatments}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Pending Registrations</p>
                    <p className="text-2xl font-bold">{stats.pendingRegistrations}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">This Week</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Today's Appointments</p>
                      <p className="text-xl font-bold">{stats.todayAppointments}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Week's Appointments</p>
                      <p className="text-xl font-bold">{stats.weekAppointments}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm">System Administrator</p>
                      <p className="text-xs text-muted-foreground">Full access to all system features</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>As an administrator, you have access to:</p>
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      <li>Patient registration management</li>
                      <li>Appointment scheduling and notifications</li>
                      <li>Treatment recording and billing</li>
                      <li>Procedure management and pricing</li>
                      <li>System settings and configuration</li>
                      <li>Analytics and reporting</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => window.location.href = '/patients'}>
              <Users className="h-5 w-5 mb-2" />
              <span className="text-xs">View Patients</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => window.location.href = '/appointments'}>
              <Calendar className="h-5 w-5 mb-2" />
              <span className="text-xs">Appointments</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => window.location.href = '/treatments'}>
              <FileText className="h-5 w-5 mb-2" />
              <span className="text-xs">Treatments</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col py-4" onClick={() => window.location.href = '/settings'}>
              <Settings className="h-5 w-5 mb-2" />
              <span className="text-xs">Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { Users, Settings, FileText } from 'lucide-react';