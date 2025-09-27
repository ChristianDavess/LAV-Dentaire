'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppointmentsTable } from '@/components/tables/appointments-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar } from 'lucide-react';
import { AppointmentDialog } from '@/components/dialogs/appointment-dialog';
import type { Appointment, Patient } from '@/types';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      // Fetch appointments with patient data
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(first_name, last_name, email, mobile_no)
        `)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: true });
      
      setAppointments(appointmentsData as unknown as Appointment[] || []);

      // Fetch approved patients for scheduling
      const { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .eq('registration_status', 'approved')
        .order('first_name', { ascending: true });
      
      setPatients(patientsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = () => {
    setSelectedAppointment(null);
    setDialogOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const handleCancel = async (appointmentId: string, reason: string) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('appointments')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason
      })
      .eq('id', appointmentId);
    
    if (!error) {
      await fetchData();
    }
  };

  const handleNotify = async (appointmentId: string) => {
    // Send notification email to patient
    try {
      const response = await fetch('/api/appointments/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });

      if (response.ok) {
        const supabase = createClient();
        await supabase
          .from('appointments')
          .update({ 
            notification_sent: true,
            notification_sent_at: new Date().toISOString()
          })
          .eq('id', appointmentId);
        
        await fetchData();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Appointments</h2>
          <p className="text-muted-foreground">Manage patient appointments and schedules</p>
        </div>
        <Button onClick={handleSchedule}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Appointment Schedule</CardTitle>
              <CardDescription>View and manage all appointments</CardDescription>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <AppointmentsTable
            appointments={appointments}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onNotify={handleNotify}
          />
        </CardContent>
      </Card>

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={selectedAppointment}
        patients={patients}
        onSuccess={fetchData}
      />
    </div>
  );
}