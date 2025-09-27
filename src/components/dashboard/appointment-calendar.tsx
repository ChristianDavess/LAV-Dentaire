'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/utils';
import type { Appointment } from '@/types';

export function AppointmentCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchAppointments(selectedDate);
    }
  }, [selectedDate]);

  const fetchAppointments = async (date: Date) => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      const dateStr = date.toISOString().split('T')[0];
      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(first_name, last_name, email)
        `)
        .eq('appointment_date', dateStr)
        .order('appointment_time', { ascending: true });
      
      setAppointments(data as unknown as Appointment[] || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
        />
      </div>
      
      <div>
        <h3 className="font-semibold mb-4">
          Appointments for {selectedDate?.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </h3>
        
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading appointments...</p>
        ) : appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="space-y-1">
                  <p className="font-medium">
                    {appointment.patient?.first_name} {appointment.patient?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(appointment.appointment_time)}
                  </p>
                </div>
                <Badge
                  variant={
                    appointment.status === 'scheduled' ? 'default' :
                    appointment.status === 'completed' ? 'secondary' :
                    appointment.status === 'cancelled' ? 'destructive' :
                    'outline'
                  }
                >
                  {appointment.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No appointments scheduled for this day.</p>
        )}
      </div>
    </div>
  );
}