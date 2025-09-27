'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Phone, Calendar, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { medicalConditionLabels } from '@/types';
import type { Patient, Appointment, Treatment } from '@/types';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchPatientData(params.id as string);
    }
  }, [params.id]);

  const fetchPatientData = async (patientId: string) => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      // Fetch patient details
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();
      
      setPatient(patientData);

      // Fetch appointments
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false });
      
      setAppointments(appointmentsData || []);

      // Fetch treatments
      const { data: treatmentsData } = await supabase
        .from('treatments')
        .select(`
          *,
          appointment:appointments(appointment_date, appointment_time),
          procedures:treatment_procedures(
            *,
            procedure:procedures(name, category)
          )
        `)
        .eq('patient_id', patientId)
        .order('treatment_date', { ascending: false });
      
      setTreatments(treatmentsData as unknown as Treatment[] || []);
    } catch (error) {
      console.error('Error fetching patient data:', error);
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

  if (!patient) {
    return (
      <div className="text-center">
        <p>Patient not found</p>
        <Button onClick={() => router.push('/patients')} className="mt-4">
          Back to Patients
        </Button>
      </div>
    );
  }

  const getActiveMedicalConditions = () => {
    return Object.entries(medicalConditionLabels).filter(
      ([key]) => patient[key as keyof typeof patient] === true
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/patients')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {patient.first_name} {patient.last_name}
            </h2>
            <p className="text-muted-foreground">Patient Record</p>
          </div>
        </div>
        <Badge 
          variant={patient.registration_status === 'approved' ? 'default' : 'secondary'}
        >
          {patient.registration_status}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medical">Medical History</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="treatments">Treatments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{patient.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{patient.mobile_no || 'N/A'}</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Age:</strong> {patient.age} years old</p>
                  <p><strong>Sex:</strong> {patient.sex}</p>
                  <p><strong>Birthdate:</strong> {formatDate(patient.birthdate)}</p>
                  <p><strong>Blood Type:</strong> {patient.blood_type || 'N/A'}</p>
                  <p><strong>Occupation:</strong> {patient.occupation || 'N/A'}</p>
                  <p><strong>Address:</strong> {patient.address || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insurance & Emergency</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm space-y-1">
                  <p><strong>Dental Insurance:</strong> {patient.dental_insurance || 'None'}</p>
                  <p><strong>Home Phone:</strong> {patient.home_no || 'N/A'}</p>
                  <p><strong>Office Phone:</strong> {patient.office_no || 'N/A'}</p>
                </div>
                {patient.physician_name && (
                  <div className="pt-4 border-t">
                    <p className="font-semibold text-sm mb-1">Primary Physician</p>
                    <div className="text-sm space-y-1">
                      <p>{patient.physician_name}</p>
                      {patient.specialty && <p>Specialty: {patient.specialty}</p>}
                      {patient.office_number && <p>Phone: {patient.office_number}</p>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Registration Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p><strong>Registered:</strong> {formatDate(patient.created_at)}</p>
                {patient.approved_at && (
                  <p><strong>Approved:</strong> {formatDate(patient.approved_at)}</p>
                )}
                <p><strong>Consent Signed:</strong> {patient.informed_consent_signed ? 'Yes' : 'No'}</p>
                {patient.consent_signed_date && (
                  <p><strong>Consent Date:</strong> {formatDate(patient.consent_signed_date)}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Conditions</CardTitle>
              <CardDescription>Active medical conditions and allergies</CardDescription>
            </CardHeader>
            <CardContent>
              {getActiveMedicalConditions().length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {getActiveMedicalConditions().map(([key, label]) => (
                    <Badge key={key} variant="secondary">
                      {label}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No medical conditions reported</p>
              )}
              
              {patient.allergic_to && patient.allergic_to.length > 0 && (
                <div className="mt-4">
                  <p className="font-semibold text-sm mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergic_to.map((allergy: string) => (
                      <Badge key={allergy} variant="destructive">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {patient.taking_medications && patient.medications_list && (
                <div className="mt-4">
                  <p className="font-semibold text-sm mb-1">Current Medications</p>
                  <p className="text-sm">{patient.medications_list}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dental History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm space-y-1">
                <p><strong>Previous Dentist:</strong> {patient.previous_dentist || 'None'}</p>
                <p><strong>Last Visit:</strong> {patient.last_dental_visit ? formatDate(patient.last_dental_visit) : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {patient.sex === 'female' && (
            <Card>
              <CardHeader>
                <CardTitle>Women's Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p><strong>Pregnant:</strong> {patient.is_pregnant ? 'Yes' : 'No'}</p>
                  <p><strong>Nursing:</strong> {patient.is_nursing ? 'Yes' : 'No'}</p>
                  <p><strong>Birth Control:</strong> {patient.taking_birth_control ? 'Yes' : 'No'}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="appointments">
          <Card>
            <CardHeader>
              <CardTitle>Appointment History</CardTitle>
              <CardDescription>All appointments for this patient</CardDescription>
            </CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {formatDate(appointment.appointment_date)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.appointment_time}
                          </p>
                        </div>
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
                <p className="text-sm text-muted-foreground">No appointments found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="treatments">
          <Card>
            <CardHeader>
              <CardTitle>Treatment History</CardTitle>
              <CardDescription>All treatments and procedures</CardDescription>
            </CardHeader>
            <CardContent>
              {treatments.length > 0 ? (
                <div className="space-y-3">
                  {treatments.map((treatment) => (
                    <div
                      key={treatment.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {formatDate(treatment.treatment_date)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Total: ₱{treatment.total_amount?.toLocaleString() || '0'}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            treatment.payment_status === 'paid' ? 'secondary' :
                            treatment.payment_status === 'partial' ? 'outline' :
                            'default'
                          }
                        >
                          {treatment.payment_status}
                        </Badge>
                      </div>
                      {treatment.notes && (
                        <p className="text-sm text-muted-foreground">{treatment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No treatments found</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}