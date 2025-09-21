'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Search, Filter, Calendar, RefreshCw, AlertCircle, FileText, User, Clock, DollarSign, Eye, Receipt } from 'lucide-react'
import { format, subDays, addDays } from 'date-fns'
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
  updated_at: string
  patients: Patient
  appointments?: Appointment
  treatment_procedures: TreatmentProcedure[]
}

interface TreatmentListProps {
  onEdit?: (treatment: Treatment) => void
  onViewDetails?: (treatment: Treatment) => void
  onGenerateInvoice?: (treatment: Treatment) => void
  refreshTrigger?: number
  className?: string
}

export default function TreatmentList({
  onEdit,
  onViewDetails,
  onGenerateInvoice,
  refreshTrigger,
  className
}: TreatmentListProps) {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('month')

  const fetchTreatments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const today = new Date()
      let startDate: string | undefined
      let endDate: string | undefined

      switch (dateRange) {
        case 'today':
          startDate = format(today, 'yyyy-MM-dd')
          endDate = format(today, 'yyyy-MM-dd')
          break
        case 'week':
          startDate = format(subDays(today, 7), 'yyyy-MM-dd')
          endDate = format(today, 'yyyy-MM-dd')
          break
        case 'month':
          startDate = format(subDays(today, 30), 'yyyy-MM-dd')
          endDate = format(today, 'yyyy-MM-dd')
          break
        case 'quarter':
          startDate = format(subDays(today, 90), 'yyyy-MM-dd')
          endDate = format(today, 'yyyy-MM-dd')
          break
        case 'year':
          startDate = format(subDays(today, 365), 'yyyy-MM-dd')
          endDate = format(today, 'yyyy-MM-dd')
          break
      }

      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (paymentStatusFilter !== 'all') params.append('payment_status', paymentStatusFilter)
      params.append('limit', '100')

      const response = await fetch(`/api/treatments?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch treatments')
      }

      const data = await response.json()
      setTreatments(data.treatments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load treatments')
    } finally {
      setLoading(false)
    }
  }, [paymentStatusFilter, dateRange])

  useEffect(() => {
    fetchTreatments()
  }, [fetchTreatments, refreshTrigger])

  const filteredTreatments = treatments.filter(treatment => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    const patientName = `${treatment.patients.first_name} ${treatment.patients.last_name}`.toLowerCase()
    const patientId = treatment.patients.patient_id.toLowerCase()
    const notes = treatment.notes?.toLowerCase() || ''
    const procedures = treatment.treatment_procedures.map(tp => tp.procedures.name.toLowerCase()).join(' ')

    return (
      patientName.includes(searchLower) ||
      patientId.includes(searchLower) ||
      notes.includes(searchLower) ||
      procedures.includes(searchLower)
    )
  })

  const refreshData = () => {
    fetchTreatments()
  }

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'today': return 'Today'
      case 'week': return 'Last 7 days'
      case 'month': return 'Last 30 days'
      case 'quarter': return 'Last 3 months'
      case 'year': return 'Last year'
      default: return 'All'
    }
  }

  const getPaymentStatusBadge = (status: Treatment['payment_status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="secondary">Paid</Badge>
      case 'partial':
        return <Badge variant="outline">Partial</Badge>
      case 'pending':
        return <Badge variant="destructive">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusCounts = () => {
    return filteredTreatments.reduce((acc, treatment) => {
      acc[treatment.payment_status] = (acc[treatment.payment_status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  const getTotalRevenue = () => {
    return filteredTreatments
      .filter(t => t.payment_status === 'paid')
      .reduce((total, treatment) => total + treatment.total_cost, 0)
  }

  const statusCounts = getStatusCounts()
  const totalRevenue = getTotalRevenue()

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Treatment History
            </CardTitle>
            <CardDescription>
              {getDateRangeLabel()} • {filteredTreatments.length} treatments
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search patients, procedures, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 days</SelectItem>
              <SelectItem value="month">Last 30 days</SelectItem>
              <SelectItem value="quarter">Last 3 months</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredTreatments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary">
              <DollarSign className="h-3 w-3 mr-1" />
              Revenue: {formatCurrency(totalRevenue)}
            </Badge>
            <Badge variant="secondary">
              {statusCounts.paid || 0} Paid
            </Badge>
            <Badge variant="outline">
              {statusCounts.partial || 0} Partial
            </Badge>
            <Badge variant="outline">
              {statusCounts.pending || 0} Pending
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : filteredTreatments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No treatments found</h3>
            <p className="text-muted-foreground">
              {searchTerm || paymentStatusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No treatments recorded for the selected time period.'}
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {filteredTreatments.map((treatment) => (
              <AccordionItem
                key={treatment.id}
                value={treatment.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-3">
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">
                            {treatment.patients.first_name} {treatment.patients.last_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {treatment.patients.patient_id}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(treatment.treatment_date), 'PPP')}</span>
                          <span>•</span>
                          <span>{treatment.treatment_procedures.length} procedures</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="font-medium">
                        {formatCurrency(treatment.total_cost)}
                      </Badge>
                      {getPaymentStatusBadge(treatment.payment_status)}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  {/* Treatment Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Treatment Details</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Date: {format(new Date(treatment.treatment_date), 'PPP')}</div>
                        {treatment.appointments && (
                          <div>
                            Appointment: {format(new Date(treatment.appointments.appointment_date), 'PPP')}
                            at {treatment.appointments.appointment_time}
                          </div>
                        )}
                        <div>Total Cost: {formatCurrency(treatment.total_cost)}</div>
                        <div>Payment: {getPaymentStatusBadge(treatment.payment_status)}</div>
                      </div>
                    </div>
                    {treatment.notes && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Notes</h4>
                        <p className="text-sm text-muted-foreground">{treatment.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Procedures */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Procedures Performed</h4>
                    <div className="space-y-2">
                      {treatment.treatment_procedures.map((tp) => (
                        <div key={tp.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{tp.procedures.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Quantity: {tp.quantity} × {formatCurrency(tp.cost_per_unit)}
                              {tp.tooth_number && ` • Tooth: ${tp.tooth_number}`}
                            </div>
                            {tp.notes && (
                              <div className="text-xs text-muted-foreground">{tp.notes}</div>
                            )}
                          </div>
                          <Badge variant="outline">
                            {formatCurrency(tp.total_cost)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {onViewDetails && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(treatment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(treatment)}
                      >
                        Edit
                      </Button>
                    )}
                    {onGenerateInvoice && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onGenerateInvoice(treatment)}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        Invoice
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}