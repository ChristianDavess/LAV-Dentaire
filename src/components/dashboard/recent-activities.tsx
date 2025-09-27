'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Calendar, FileText, CheckCircle, XCircle } from 'lucide-react';

interface Activity {
  id: string;
  type: 'registration' | 'appointment' | 'treatment' | 'approval' | 'denial';
  message: string;
  timestamp: string;
  icon: any;
  color: string;
}

export function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    const supabase = createClient();
    const activities: Activity[] = [];
    
    try {
      // Fetch recent patient registrations
      const { data: patients } = await supabase
        .from('patients')
        .select('id, first_name, last_name, created_at, registration_status')
        .order('created_at', { ascending: false })
        .limit(5);
      
      patients?.forEach((patient) => {
        activities.push({
          id: `patient-${patient.id}`,
          type: 'registration',
          message: `New patient registration: ${patient.first_name} ${patient.last_name}`,
          timestamp: patient.created_at,
          icon: UserPlus,
          color: 'text-blue-600',
        });
      });

      // Fetch recent appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          created_at,
          patient:patients(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      appointments?.forEach((appointment: any) => {
        activities.push({
          id: `appointment-${appointment.id}`,
          type: 'appointment',
          message: `Appointment scheduled for ${appointment.patient?.first_name} ${appointment.patient?.last_name}`,
          timestamp: appointment.created_at,
          icon: Calendar,
          color: 'text-green-600',
        });
      });

      // Fetch recent treatments
      const { data: treatments } = await supabase
        .from('treatments')
        .select(`
          id,
          treatment_date,
          created_at,
          patient:patients(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      treatments?.forEach((treatment: any) => {
        activities.push({
          id: `treatment-${treatment.id}`,
          type: 'treatment',
          message: `Treatment recorded for ${treatment.patient?.first_name} ${treatment.patient?.last_name}`,
          timestamp: treatment.created_at,
          icon: FileText,
          color: 'text-purple-600',
        });
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(activities.slice(0, 10));
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return <div>Loading activities...</div>;
  }

  return (
    <ScrollArea className="h-[350px]">
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm">{activity.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}