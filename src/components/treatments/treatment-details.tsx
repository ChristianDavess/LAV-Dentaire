'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User, Calendar, Clock, DollarSign, FileText, Receipt, Edit, Stethoscope, Phone, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils/cost-calculations'

interface Patient {
  id: string
  patient_id: string
  first_name: string
  last_name: string
  phone?: string
  email?: string
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  reason?: string
}

interface Procedure {
  id: string
  name: string
  description?: string
}

interface TreatmentProcedure {
  id: string
  procedure_id: string
  quantity: number
  cost_per_unit: number
  total_cost: number
  tooth_number?: string
  notes?: string
  procedures: Procedure
}

interface Treatment {
  id: string
  patient_id: string
  appointment_id?: string
  treatment_date: string
  total_cost: number
  payment_status: 'pending' | 'partial' | 'paid'
  notes?: string
  created_at: string
  updated_at: string
  patients: Patient
  appointments?: Appointment
  treatment_procedures: TreatmentProcedure[]
}

interface TreatmentDetailsProps {
  treatment: Treatment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (treatment: Treatment) => void
  onGenerateInvoice?: (treatment: Treatment) => void
}

export default function TreatmentDetails({
  treatment,
  open,
  onOpenChange,
  onEdit,
  onGenerateInvoice
}: TreatmentDetailsProps) {
  if (!treatment) return null

  const getPaymentStatusBadge = (status: Treatment['payment_status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="secondary">Fully Paid</Badge>
      case 'partial':
        return <Badge variant="outline">Partially Paid</Badge>
      case 'pending':
        return <Badge variant="destructive">Payment Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentStatusColor = (status: Treatment['payment_status']) => {
    switch (status) {
      case 'paid':
        return 'text-green-600'
      case 'partial':
        return 'text-yellow-600'
      case 'pending':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Treatment Details
          </DialogTitle>
          <DialogDescription>
            Complete treatment information for {treatment.patients.first_name} {treatment.patients.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Summary */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">
                      {treatment.patients.first_name} {treatment.patients.last_name}
                    </h3>
                    <Badge variant="outline">{treatment.patients.patient_id}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(treatment.treatment_date), 'PPPP')}</span>
                    </div>
                    {treatment.appointments && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{treatment.appointments.appointment_time}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    <span className="text-2xl font-bold">
                      {formatCurrency(treatment.total_cost)}
                    </span>
                  </div>
                  {getPaymentStatusBadge(treatment.payment_status)}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Patient Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Full Name</div>
                  <div>{treatment.patients.first_name} {treatment.patients.last_name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Patient ID</div>
                  <div>{treatment.patients.patient_id}</div>
                </div>
                {treatment.patients.phone && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {treatment.patients.phone}
                    </div>
                  </div>
                )}
                {treatment.patients.email && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {treatment.patients.email}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Treatment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Treatment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Treatment Date</div>
                  <div>{format(new Date(treatment.treatment_date), 'PPP')}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Procedures Count</div>
                  <div>{treatment.treatment_procedures.length} procedures</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Payment Status</div>
                  <div className={getPaymentStatusColor(treatment.payment_status)}>
                    {treatment.payment_status.charAt(0).toUpperCase() + treatment.payment_status.slice(1)}
                  </div>
                </div>
              </div>

              {treatment.appointments && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Related Appointment</div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(treatment.appointments.appointment_date), 'PPP')}</span>
                    <span>at {treatment.appointments.appointment_time}</span>
                    {treatment.appointments.reason && (
                      <>
                        <span>•</span>
                        <span className="text-muted-foreground">{treatment.appointments.reason}</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {treatment.notes && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Treatment Notes</div>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {treatment.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Procedures Performed */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Procedures Performed</CardTitle>
              <CardDescription>
                Detailed breakdown of all procedures in this treatment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Procedure</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Cost per Unit</TableHead>
                    <TableHead className="text-center">Tooth</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treatment.treatment_procedures.map((tp) => (
                    <TableRow key={tp.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{tp.procedures.name}</div>
                          {tp.procedures.description && (
                            <div className="text-xs text-muted-foreground">
                              {tp.procedures.description}
                            </div>
                          )}
                          {tp.notes && (
                            <div className="text-xs text-muted-foreground italic">
                              Note: {tp.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {tp.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(tp.cost_per_unit)}
                      </TableCell>
                      <TableCell className="text-center">
                        {tp.tooth_number || '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(tp.total_cost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Treatment Cost:</span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(treatment.total_cost)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Record Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div>{format(new Date(treatment.created_at), 'PPpp')}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Updated</div>
                  <div>{format(new Date(treatment.updated_at), 'PPpp')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            {onGenerateInvoice && (
              <Button
                variant="outline"
                onClick={() => onGenerateInvoice(treatment)}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Generate Invoice
              </Button>
            )}
            {onEdit && (
              <Button
                onClick={() => {
                  onEdit(treatment)
                  onOpenChange(false)
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Treatment
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}