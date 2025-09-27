'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Eye, Check, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Patient } from '@/types';

interface PatientsTableProps {
  patients: Patient[];
  type: 'approved' | 'pending';
  onApprove?: (patientId: string) => void;
  onDeny?: (patientId: string, reason: string) => void;
}

export function PatientsTable({ patients, type, onApprove, onDeny }: PatientsTableProps) {
  const router = useRouter();
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [denyReason, setDenyReason] = useState('');

  const handleView = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  const handleDeny = () => {
    if (selectedPatient && onDeny && denyReason) {
      onDeny(selectedPatient.id, denyReason);
      setDenyDialogOpen(false);
      setDenyReason('');
      setSelectedPatient(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Age/Sex</TableHead>
              <TableHead>Registration Date</TableHead>
              {type === 'pending' && <TableHead>Status</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient.id}>
                <TableCell className="font-medium">
                  {patient.first_name} {patient.last_name}
                </TableCell>
                <TableCell>{patient.email}</TableCell>
                <TableCell>{patient.mobile_no || 'N/A'}</TableCell>
                <TableCell>{patient.age} / {patient.sex}</TableCell>
                <TableCell>{formatDate(patient.created_at)}</TableCell>
                {type === 'pending' && (
                  <TableCell>
                    <Badge variant="secondary">Pending</Badge>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleView(patient.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {type === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onApprove?.(patient.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setDenyDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {patients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No patients found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for denying this registration.
              The patient will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Reason for Denial</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for denial..."
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeny} disabled={!denyReason}>
              Deny Registration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}