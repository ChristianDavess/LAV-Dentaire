'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, DollarSign, FileText } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Treatment } from '@/types';

interface TreatmentsTableProps {
  treatments: Treatment[];
  onEdit: (treatment: Treatment) => void;
  onUpdatePayment: (treatmentId: string, status: string, amountPaid: number) => void;
}

export function TreatmentsTable({ treatments, onEdit, onUpdatePayment }: TreatmentsTableProps) {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [paymentData, setPaymentData] = useState({
    status: '',
    amountPaid: 0,
  });

  const handlePaymentUpdate = () => {
    if (selectedTreatment) {
      onUpdatePayment(selectedTreatment.id, paymentData.status, paymentData.amountPaid);
      setPaymentDialogOpen(false);
      setSelectedTreatment(null);
    }
  };

  const openPaymentDialog = (treatment: Treatment) => {
    setSelectedTreatment(treatment);
    setPaymentData({
      status: treatment.payment_status,
      amountPaid: treatment.amount_paid || 0,
    });
    setPaymentDialogOpen(true);
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="secondary">Paid</Badge>;
      case 'partial':
        return <Badge variant="outline">Partial</Badge>;
      case 'pending':
        return <Badge variant="default">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Procedures</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {treatments.map((treatment) => (
              <TableRow key={treatment.id}>
                <TableCell>{formatDate(treatment.treatment_date)}</TableCell>
                <TableCell className="font-medium">
                  {treatment.patient?.first_name} {treatment.patient?.last_name}
                </TableCell>
                <TableCell>
                  {treatment.procedures?.length || 0} procedure(s)
                  {treatment.tooth_numbers && treatment.tooth_numbers.length > 0 && (
                    <span className="text-xs text-muted-foreground block">
                      Teeth: {treatment.tooth_numbers.join(', ')}
                    </span>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(treatment.total_amount || 0)}</TableCell>
                <TableCell>{formatCurrency(treatment.amount_paid || 0)}</TableCell>
                <TableCell>{getPaymentBadge(treatment.payment_status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(treatment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openPaymentDialog(treatment)}
                    >
                      <DollarSign className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {treatments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No treatments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment</DialogTitle>
            <DialogDescription>
              Update payment status and amount for this treatment
            </DialogDescription>
          </DialogHeader>
          {selectedTreatment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Patient:</strong> {selectedTreatment.patient?.first_name} {selectedTreatment.patient?.last_name}
                </p>
                <p className="text-sm">
                  <strong>Total Amount:</strong> {formatCurrency(selectedTreatment.total_amount || 0)}
                </p>
                <p className="text-sm">
                  <strong>Balance:</strong> {formatCurrency((selectedTreatment.total_amount || 0) - (selectedTreatment.amount_paid || 0))}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Payment Status</Label>
                <Select
                  value={paymentData.status}
                  onValueChange={(value) => setPaymentData({ ...paymentData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount Paid (₱)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentData.amountPaid}
                  onChange={(e) => setPaymentData({ ...paymentData, amountPaid: parseFloat(e.target.value) || 0 })}
                  max={selectedTreatment.total_amount || 0}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaymentUpdate}>
              Update Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}