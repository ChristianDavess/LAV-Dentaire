'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TreatmentsTable } from '@/components/tables/treatments-table';
import { TreatmentDialog } from '@/components/dialogs/treatment-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import type { Treatment, Patient, Appointment, Procedure } from '@/types';

export default function TreatmentsPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      // Fetch treatments with patient and procedure data
      const { data: treatmentsData } = await supabase
        .from('treatments')
        .select(`
          *,
          patient:patients(first_name, last_name, email),
          appointment:appointments(appointment_date, appointment_time),
          procedures:treatment_procedures(
            *,
            procedure:procedures(name, category, price)
          )
        `)
        .order('treatment_date', { ascending: false });
      
      setTreatments(treatmentsData as unknown as Treatment[] || []);

      // Fetch approved patients
      const { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .eq('registration_status', 'approved')
        .order('first_name', { ascending: true });
      
      setPatients(patientsData || []);

      // Fetch scheduled appointments without treatments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(first_name, last_name)
        `)
        .eq('status', 'scheduled')
        .order('appointment_date', { ascending: true });
      
      setAppointments(appointmentsData as unknown as Appointment[] || []);

      // Fetch all procedures
      const { data: proceduresData } = await supabase
        .from('procedures')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      setProcedures(proceduresData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewTreatment = () => {
    setSelectedTreatment(null);
    setDialogOpen(true);
  };

  const handleEdit = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setDialogOpen(true);
  };

  const handleUpdatePayment = async (treatmentId: string, status: string, amountPaid: number) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('treatments')
      .update({ 
        payment_status: status,
        amount_paid: amountPaid,
        updated_at: new Date().toISOString()
      })
      .eq('id', treatmentId);
    
    if (!error) {
      await fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalRevenue = treatments
    .filter(t => t.payment_status === 'paid')
    .reduce((sum, t) => sum + (t.total_amount || 0), 0);

  const pendingRevenue = treatments
    .filter(t => t.payment_status !== 'paid')
    .reduce((sum, t) => sum + ((t.total_amount || 0) - (t.amount_paid || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Treatments</h2>
          <p className="text-muted-foreground">Manage patient treatments and procedures</p>
        </div>
        <Button onClick={handleNewTreatment}>
          <Plus className="mr-2 h-4 w-4" />
          New Treatment
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Treatments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treatments.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Paid treatments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{pendingRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Treatment Records</CardTitle>
          <CardDescription>View and manage all patient treatments</CardDescription>
        </CardHeader>
        <CardContent>
          <TreatmentsTable
            treatments={treatments}
            onEdit={handleEdit}
            onUpdatePayment={handleUpdatePayment}
          />
        </CardContent>
      </Card>

      <TreatmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        treatment={selectedTreatment}
        patients={patients}
        appointments={appointments}
        procedures={procedures}
        onSuccess={fetchData}
      />
    </div>
  );
}