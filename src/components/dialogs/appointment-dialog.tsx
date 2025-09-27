'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Appointment, Patient } from '@/types';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  patients: Patient[];
  onSuccess: () => void;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  appointment,
  patients,
  onSuccess,
}: AppointmentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        patient_id: appointment.patient_id,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        notes: appointment.notes || '',
      });
    } else {
      setFormData({
        patient_id: '',
        appointment_date: '',
        appointment_time: '',
        notes: '',
      });
    }
  }, [appointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    try {
      if (appointment) {
        // Update existing appointment
        const { error } = await supabase
          .from('appointments')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appointment.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Appointment has been rescheduled.',
        });
      } else {
        // Create new appointment
        const { error } = await supabase
          .from('appointments')
          .insert([{
            ...formData,
            status: 'scheduled',
          }]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Appointment has been scheduled.',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save appointment.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Reschedule Appointment' : 'Schedule New Appointment'}
          </DialogTitle>
          <DialogDescription>
            {appointment 
              ? 'Update the appointment details below.'
              : 'Fill in the details to schedule a new appointment.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="patient" className="text-right">
                Patient
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.patient_id}
                  onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                  disabled={!!appointment}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                className="col-span-3"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                id="time"
                type="time"
                className="col-span-3"
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                className="col-span-3"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {appointment ? 'Update' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}