'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PatientsTable } from '@/components/tables/patients-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from 'lucide-react';
import type { Patient } from '@/types';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pendingPatients, setPendingPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('approved');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      // Fetch approved patients
      const { data: approvedData } = await supabase
        .from('patients')
        .select('*')
        .eq('registration_status', 'approved')
        .order('created_at', { ascending: false });
      
      setPatients(approvedData || []);

      // Fetch pending patients
      const { data: pendingData } = await supabase
        .from('patients')
        .select('*')
        .eq('registration_status', 'pending')
        .order('created_at', { ascending: false });
      
      setPendingPatients(pendingData || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (patientId: string) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('patients')
      .update({ 
        registration_status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', patientId);
    
    if (!error) {
      await fetchPatients();
    }
  };

  const handleDeny = async (patientId: string, reason: string) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('patients')
      .update({ 
        registration_status: 'denied',
        denied_at: new Date().toISOString(),
        denial_reason: reason
      })
      .eq('id', patientId);
    
    if (!error) {
      await fetchPatients();
    }
  };

  const filteredPatients = patients.filter(patient =>
    `${patient.first_name} ${patient.last_name} ${patient.email}`.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const filteredPending = pendingPatients.filter(patient =>
    `${patient.first_name} ${patient.last_name} ${patient.email}`.toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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
        <h2 className="text-3xl font-bold tracking-tight">Patients</h2>
        <p className="text-muted-foreground">Manage patient registrations and records</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Patient Records</CardTitle>
              <CardDescription>View and manage all patient information</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="approved">
                Approved ({patients.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({pendingPatients.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="approved">
              <PatientsTable 
                patients={filteredPatients}
                type="approved"
              />
            </TabsContent>
            
            <TabsContent value="pending">
              <PatientsTable 
                patients={filteredPending}
                type="pending"
                onApprove={handleApprove}
                onDeny={handleDeny}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}