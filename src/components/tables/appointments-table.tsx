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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, Edit, X, Bell, CheckCircle } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import type { Appointment } from '@/types';

interface AppointmentsTableProps {
  appointments: Appointment[];
  onEdit: (appointment: Appointment) => void;
  onCancel: (appointmentId: string, reason: string) => void;
  onNotify: (appointmentId: string) => void;
}

export function AppointmentsTable({ 
  appointments, 
  onEdit, 
  onCancel,
  onNotify 
}: AppointmentsTableProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancel = () => {
    if (selectedAppointment && cancelReason) {
      onCancel(selectedAppointment.id, cancelReason);
      setCancelDialogOpen(false);
      setCancelReason('');
      setSelectedAppointment(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge>Scheduled</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'no-show':
        return <Badge variant="outline">No Show</Badge>;
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
              <TableHead>Patient</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notification</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">
                  {appointment.patient?.first_name} {appointment.patient?.last_name}
                </TableCell>
                <TableCell>{formatDate(appointment.appointment_date)}</TableCell>
                <TableCell>{formatTime(appointment.appointment_time)}</TableCell>
                <TableCell>{appointment.patient?.mobile_no}</TableCell>
                <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                <TableCell>
                  {appointment.notification_sent ? (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Sent
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">
                      Not sent
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {appointment.status === 'scheduled' && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit(appointment)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Reschedule
                          </DropdownMenuItem>
                          {!appointment.notification_sent && (
                            <DropdownMenuItem onClick={() => onNotify(appointment.id)}>
                              <Bell className="mr-2 h-4 w-4" />
                              Send Notification
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedAppointment(appointment);
                              setCancelDialogOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No appointments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this appointment.
              The patient will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Cancellation Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Appointment
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancel} 
              disabled={!cancelReason}
            >
              Cancel Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}