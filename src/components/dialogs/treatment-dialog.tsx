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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { TOOTH_NUMBERS } from '@/lib/constants';
import type { Treatment, Patient, Appointment, Procedure } from '@/types';

interface TreatmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment: Treatment | null;
  patients: Patient[];
  appointments: Appointment[];
  procedures: Procedure[];
  onSuccess: () => void;
}

interface SelectedProcedure {
  procedureId: string;
  quantity: number;
  price: number;
}

export function TreatmentDialog({
  open,
  onOpenChange,
  treatment,
  patients,
  appointments,
  procedures,
  onSuccess,
}: TreatmentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    appointment_id: '',
    treatment_date: new Date().toISOString().split('T')[0],
    tooth_numbers: [] as string[],
    notes: '',
  });
  const [selectedProcedures, setSelectedProcedures] = useState<SelectedProcedure[]>([]);
  const [isWalkIn, setIsWalkIn] = useState(true);

  useEffect(() => {
    if (treatment) {
      setFormData({
        patient_id: treatment.patient_id,
        appointment_id: treatment.appointment_id || '',
        treatment_date: treatment.treatment_date,
        tooth_numbers: treatment.tooth_numbers || [],
        notes: treatment.notes || '',
      });
      // Load existing procedures if editing
      if (treatment.procedures) {
        setSelectedProcedures(treatment.procedures.map(p => ({
          procedureId: p.procedure_id,
          quantity: p.quantity,
          price: p.unit_price,
        })));
      }
    } else {
      resetForm();
    }
  }, [treatment]);

  const resetForm = () => {
    setFormData({
      patient_id: '',
      appointment_id: '',
      treatment_date: new Date().toISOString().split('T')[0],
      tooth_numbers: [],
      notes: '',
    });
    setSelectedProcedures([]);
    setIsWalkIn(true);
  };

  const toggleProcedure = (procedure: Procedure) => {
    const existing = selectedProcedures.find(p => p.procedureId === procedure.id);
    if (existing) {
      setSelectedProcedures(selectedProcedures.filter(p => p.procedureId !== procedure.id));
    } else {
      setSelectedProcedures([...selectedProcedures, {
        procedureId: procedure.id,
        quantity: 1,
        price: procedure.price,
      }]);
    }
  };

  const updateProcedureQuantity = (procedureId: string, quantity: number) => {
    setSelectedProcedures(selectedProcedures.map(p =>
      p.procedureId === procedureId ? { ...p, quantity } : p
    ));
  };

  const toggleToothNumber = (tooth: string) => {
    if (formData.tooth_numbers.includes(tooth)) {
      setFormData({
        ...formData,
        tooth_numbers: formData.tooth_numbers.filter(t => t !== tooth),
      });
    } else {
      setFormData({
        ...formData,
        tooth_numbers: [...formData.tooth_numbers, tooth],
      });
    }
  };

  const calculateTotal = () => {
    return selectedProcedures.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id) {
      toast({
        title: 'Error',
        description: 'Please select a patient',
        variant: 'destructive',
      });
      return;
    }

    if (selectedProcedures.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one procedure',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const totalAmount = calculateTotal();
      
      if (treatment) {
        // Update existing treatment
        const { error: treatmentError } = await supabase
          .from('treatments')
          .update({
            ...formData,
            total_amount: totalAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', treatment.id);

        if (treatmentError) throw treatmentError;

        // Delete existing procedures and re-insert
        await supabase
          .from('treatment_procedures')
          .delete()
          .eq('treatment_id', treatment.id);

        const proceduresToInsert = selectedProcedures.map(p => ({
          treatment_id: treatment.id,
          procedure_id: p.procedureId,
          quantity: p.quantity,
          unit_price: p.price,
          subtotal: p.price * p.quantity,
        }));

        const { error: proceduresError } = await supabase
          .from('treatment_procedures')
          .insert(proceduresToInsert);

        if (proceduresError) throw proceduresError;

        toast({
          title: 'Success',
          description: 'Treatment has been updated.',
        });
      } else {
        // Create new treatment
        const { data: newTreatment, error: treatmentError } = await supabase
          .from('treatments')
          .insert([{
            ...formData,
            appointment_id: !isWalkIn ? formData.appointment_id : null,
            total_amount: totalAmount,
            payment_status: 'pending',
            amount_paid: 0,
          }])
          .select()
          .single();

        if (treatmentError) throw treatmentError;

        // Insert procedures
        const proceduresToInsert = selectedProcedures.map(p => ({
          treatment_id: newTreatment.id,
          procedure_id: p.procedureId,
          quantity: p.quantity,
          unit_price: p.price,
          subtotal: p.price * p.quantity,
        }));

        const { error: proceduresError } = await supabase
          .from('treatment_procedures')
          .insert(proceduresToInsert);

        if (proceduresError) throw proceduresError;

        // Mark appointment as completed if linked
        if (!isWalkIn && formData.appointment_id) {
          await supabase
            .from('appointments')
            .update({ status: 'completed' })
            .eq('id', formData.appointment_id);
        }

        toast({
          title: 'Success',
          description: 'Treatment has been recorded.',
        });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save treatment.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Group procedures by category
  const proceduresByCategory = procedures.reduce((acc, proc) => {
    if (!acc[proc.category]) {
      acc[proc.category] = [];
    }
    acc[proc.category].push(proc);
    return acc;
  }, {} as Record<string, Procedure[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {treatment ? 'Edit Treatment' : 'Record New Treatment'}
          </DialogTitle>
          <DialogDescription>
            {treatment 
              ? 'Update the treatment details below.'
              : 'Fill in the details to record a new treatment.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-4">
              {/* Patient Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="patient">Patient *</Label>
                  <Select
                    value={formData.patient_id}
                    onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                    disabled={!!treatment}
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

                <div>
                  <Label htmlFor="date">Treatment Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.treatment_date}
                    onChange={(e) => setFormData({ ...formData, treatment_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Walk-in or Appointment */}
              {!treatment && (
                <div className="space-y-2">
                  <Label>Treatment Type</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={isWalkIn}
                        onChange={() => setIsWalkIn(true)}
                      />
                      <span>Walk-in Patient</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={!isWalkIn}
                        onChange={() => setIsWalkIn(false)}
                      />
                      <span>Scheduled Appointment</span>
                    </label>
                  </div>
                </div>
              )}

              {!isWalkIn && (
                <div>
                  <Label htmlFor="appointment">Appointment</Label>
                  <Select
                    value={formData.appointment_id}
                    onValueChange={(value) => setFormData({ ...formData, appointment_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an appointment" />
                    </SelectTrigger>
                    <SelectContent>
                      {appointments
                        .filter(a => a.patient_id === formData.patient_id)
                        .map((appointment) => (
                          <SelectItem key={appointment.id} value={appointment.id}>
                            {appointment.appointment_date} at {appointment.appointment_time}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Tooth Numbers */}
              <div>
                <Label>Tooth Numbers (Optional)</Label>
                <div className="mt-2 p-4 border rounded-lg">
                  <div className="grid grid-cols-8 gap-2">
                    {TOOTH_NUMBERS.map((tooth) => (
                      <label
                        key={tooth}
                        className="flex items-center justify-center p-2 border rounded cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={formData.tooth_numbers.includes(tooth)}
                          onChange={() => toggleToothNumber(tooth)}
                          className="mr-1"
                        />
                        <span className="text-sm">{tooth}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Procedures */}
              <div>
                <Label>Procedures *</Label>
                <div className="mt-2 space-y-4">
                  {Object.entries(proceduresByCategory).map(([category, procs]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{category}</h4>
                      <div className="space-y-2">
                        {procs.map((procedure) => {
                          const selected = selectedProcedures.find(p => p.procedureId === procedure.id);
                          return (
                            <div key={procedure.id} className="flex items-center justify-between">
                              <label className="flex items-center gap-2">
                                <Checkbox
                                  checked={!!selected}
                                  onCheckedChange={() => toggleProcedure(procedure)}
                                />
                                <span className="text-sm">{procedure.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {formatCurrency(procedure.price)}
                                </span>
                              </label>
                              {selected && (
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`qty-${procedure.id}`} className="text-sm">Qty:</Label>
                                  <Input
                                    id={`qty-${procedure.id}`}
                                    type="number"
                                    min="1"
                                    value={selected.quantity}
                                    onChange={(e) => updateProcedureQuantity(procedure.id, parseInt(e.target.value) || 1)}
                                    className="w-16 h-8"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>

              {/* Total */}
              {selectedProcedures.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-xl font-bold">{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
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
              {treatment ? 'Update' : 'Record'} Treatment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}