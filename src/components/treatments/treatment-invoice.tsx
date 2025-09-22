'use client'

import { forwardRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Printer, Download } from 'lucide-react'
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
  patients: Patient
  appointments?: Appointment
  treatment_procedures: TreatmentProcedure[]
}

interface TreatmentInvoiceProps {
  treatment: Treatment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const InvoiceContent = forwardRef<HTMLDivElement, { treatment: Treatment }>(
  ({ treatment }, ref) => {
    const today = new Date()
    const invoiceNumber = `INV-${format(today, 'yyyyMMdd')}-${treatment.id.slice(-6).toUpperCase()}`

    return (
      <div ref={ref} className="bg-white p-8 text-black">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-lg font-semibold text-primary mb-2">LAV Dentaire</h1>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Professional Dental Services</div>
              <div>📧 info@lavdentaire.com</div>
              <div>📞 +63 XXX XXX XXXX</div>
              <div>📍 [Clinic Address]</div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold mb-2">INVOICE</h2>
            <div className="text-sm space-y-1">
              <div><strong>Invoice #:</strong> {invoiceNumber}</div>
              <div><strong>Date:</strong> {format(today, 'PPP')}</div>
              <div><strong>Treatment Date:</strong> {format(new Date(treatment.treatment_date), 'PPP')}</div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Patient Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Bill To:</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="font-semibold text-lg">
              {treatment.patients.first_name} {treatment.patients.last_name}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Patient ID: {treatment.patients.patient_id}
            </div>
            {treatment.patients.phone && (
              <div className="text-sm text-gray-600">
                Phone: {treatment.patients.phone}
              </div>
            )}
            {treatment.patients.email && (
              <div className="text-sm text-gray-600">
                Email: {treatment.patients.email}
              </div>
            )}
          </div>
        </div>

        {/* Treatment Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Treatment Details:</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50%]">Procedure</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-center">Tooth</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treatment.treatment_procedures.map((tp, index) => (
                <TableRow key={tp.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tp.procedures.name}</div>
                      {tp.procedures.description && (
                        <div className="text-xs text-gray-500 mt-1">
                          {tp.procedures.description}
                        </div>
                      )}
                      {tp.notes && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          Note: {tp.notes}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{tp.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(tp.cost_per_unit)}</TableCell>
                  <TableCell className="text-center">{tp.tooth_number || '—'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(tp.total_cost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(treatment.total_cost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>₱0.00</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(treatment.total_cost)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Payment Status:</h3>
          <div className="flex items-center gap-2">
            <span>Status:</span>
            <Badge
              variant={
                treatment.payment_status === 'paid' ? 'secondary' :
                treatment.payment_status === 'partial' ? 'outline' : 'destructive'
              }
            >
              {treatment.payment_status.charAt(0).toUpperCase() + treatment.payment_status.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Additional Notes */}
        {treatment.notes && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Treatment Notes:</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm">
              {treatment.notes}
            </div>
          </div>
        )}

        {/* Footer */}
        <Separator className="my-6" />
        <div className="text-center text-sm text-gray-500 space-y-1">
          <div>Thank you for choosing LAV Dentaire!</div>
          <div>For any questions regarding this invoice, please contact us at info@lavdentaire.com</div>
          <div className="mt-4 text-xs">
            Generated on {format(today, 'PPpp')} • Invoice #{invoiceNumber}
          </div>
        </div>
      </div>
    )
  }
)

InvoiceContent.displayName = 'InvoiceContent'

export default function TreatmentInvoice({
  treatment,
  open,
  onOpenChange
}: TreatmentInvoiceProps) {
  if (!treatment) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // In a real application, you might want to generate a PDF here
    // For now, we'll just trigger the print dialog
    handlePrint()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible">
        <DialogHeader className="print:hidden">
          <DialogTitle>Treatment Invoice</DialogTitle>
          <DialogDescription>
            Invoice for treatment provided to {treatment.patients.first_name} {treatment.patients.last_name}
          </DialogDescription>
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>

        <InvoiceContent treatment={treatment} />
      </DialogContent>

      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:max-w-none {
            max-width: none !important;
          }
          .print\\:max-h-none {
            max-height: none !important;
          }
          .print\\:overflow-visible {
            overflow: visible !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </Dialog>
  )
}