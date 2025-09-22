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
import { Search, Filter, Calendar, RefreshCw, AlertCircle, FileText, User, Clock, Receipt, Eye, CreditCard } from 'lucide-react'
import { format, subDays, addDays } from 'date-fns'
import { formatCurrency } from '@/lib/utils/cost-calculations'
import { TreatmentWithDetails } from '@/types/database'

interface TreatmentListProps {
  onEdit?: (treatment: TreatmentWithDetails) => void
  onViewDetails?: (treatment: TreatmentWithDetails) => void
  onGenerateInvoice?: (treatment: TreatmentWithDetails) => void
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
  const [treatments, setTreatments] = useState<TreatmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [treatmentStatusFilter, setTreatmentStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')

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
        case 'upcoming':
          startDate = format(today, 'yyyy-MM-dd')
          endDate = format(addDays(today, 90), 'yyyy-MM-dd') // Next 3 months
          break
        case 'week':
          startDate = format(subDays(today, 7), 'yyyy-MM-dd')
          endDate = format(addDays(today, 7), 'yyyy-MM-dd') // Past week + next week
          break
        case 'month':
          startDate = format(subDays(today, 30), 'yyyy-MM-dd')
          endDate = format(addDays(today, 30), 'yyyy-MM-dd') // Past month + next month
          break
        case 'past_month':
          startDate = format(subDays(today, 30), 'yyyy-MM-dd')
          endDate = format(today, 'yyyy-MM-dd')
          break
        case 'past_quarter':
          startDate = format(subDays(today, 90), 'yyyy-MM-dd')
          endDate = format(today, 'yyyy-MM-dd')
          break
        case 'all':
        default:
          // Show all treatments (past 1 year to future 1 year)
          startDate = format(subDays(today, 365), 'yyyy-MM-dd')
          endDate = format(addDays(today, 365), 'yyyy-MM-dd')
          break
      }

      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      if (paymentStatusFilter !== 'all') params.append('payment_status', paymentStatusFilter)
      if (treatmentStatusFilter !== 'all') params.append('treatment_status', treatmentStatusFilter)
      params.append('limit', '200') // Increased to show more treatments

      const response = await fetch(`/api/treatments?${params.toString()}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch treatments')
      }

      const data = await response.json()
      setTreatments(data.data?.treatments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load treatments')
    } finally {
      setLoading(false)
    }
  }, [paymentStatusFilter, treatmentStatusFilter, dateRange])

  useEffect(() => {
    fetchTreatments()
  }, [fetchTreatments, refreshTrigger])

  const sortedAndFilteredTreatments = treatments
    .filter(treatment => {
    const today = new Date()
    const tDate = new Date(treatment.treatment_date)
    const isToday = format(tDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    const isFuture = tDate > today
    const isPast = tDate < today

    // Filter by treatment status
    if (treatmentStatusFilter !== 'all') {
      switch (treatmentStatusFilter) {
        case 'upcoming':
          if (!isFuture) return false
          break
        case 'completed':
          if (!isPast) return false
          break
        case 'today':
          if (!isToday) return false
          break
      }
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const patientName = `${treatment.patients?.first_name} ${treatment.patients?.last_name}`.toLowerCase()
      const patientId = treatment.patients?.patient_id?.toLowerCase() || ''
      const notes = treatment.notes?.toLowerCase() || ''
      const procedures = treatment.treatment_procedures?.map(tp => tp.procedure?.name?.toLowerCase()).join(' ') || ''

      if (!(
        patientName.includes(searchLower) ||
        patientId.includes(searchLower) ||
        notes.includes(searchLower) ||
        procedures.includes(searchLower)
      )) {
        return false
      }
    }

    return true
    })
    .sort((a, b) => {
      const today = new Date()
      const dateA = new Date(a.treatment_date)
      const dateB = new Date(b.treatment_date)

      const isToday_A = format(dateA, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      const isToday_B = format(dateB, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      const isFuture_A = dateA > today
      const isFuture_B = dateB > today

      // Priority order: Today -> Future (ascending) -> Past (descending)

      // Both today
      if (isToday_A && isToday_B) return 0

      // One is today, prioritize today
      if (isToday_A && !isToday_B) return -1
      if (!isToday_A && isToday_B) return 1

      // Both future, sort ascending (earliest first)
      if (isFuture_A && isFuture_B) return dateA.getTime() - dateB.getTime()

      // One future, one past - future comes first
      if (isFuture_A && !isFuture_B) return -1
      if (!isFuture_A && isFuture_B) return 1

      // Both past, sort descending (most recent first)
      return dateB.getTime() - dateA.getTime()
    })

  const refreshData = () => {
    fetchTreatments()
  }

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'today': return 'Today'
      case 'upcoming': return 'Upcoming (Next 3 months)'
      case 'week': return 'This week (±7 days)'
      case 'month': return 'This month (±30 days)'
      case 'past_month': return 'Past 30 days'
      case 'past_quarter': return 'Past 3 months'
      case 'all': return 'All treatments'
      default: return 'All'
    }
  }

  const getPaymentStatusBadge = (status: TreatmentWithDetails['payment_status']) => {
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

  const getTreatmentStatusBadge = (treatmentDate: string, treatmentStatus?: string) => {
    const today = new Date()
    const tDate = new Date(treatmentDate)
    const isPast = tDate < today
    const isToday = format(tDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    const isFuture = tDate > today

    // Use explicit status if available, otherwise infer from date
    if (treatmentStatus) {
      switch (treatmentStatus) {
        case 'completed':
          return <Badge variant="default">Completed</Badge>
        case 'scheduled':
          return <Badge variant="secondary">Scheduled</Badge>
        case 'cancelled':
          return <Badge variant="destructive">Cancelled</Badge>
        default:
          return <Badge variant="outline">{treatmentStatus}</Badge>
      }
    }

    // Infer status from date if no explicit status
    if (isToday) {
      return <Badge variant="default">Today</Badge>
    } else if (isFuture) {
      return <Badge variant="secondary">Scheduled</Badge>
    } else {
      return <Badge variant="outline">Completed</Badge>
    }
  }

  const getTreatmentDateStyle = (treatmentDate: string) => {
    const today = new Date()
    const tDate = new Date(treatmentDate)
    const isToday = format(tDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
    const isFuture = tDate > today
    const isOverdue = tDate < today && format(tDate, 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd')

    if (isToday) return 'text-primary font-semibold'
    if (isFuture) return 'text-primary'
    if (isOverdue) return 'text-muted-foreground'
    return ''
  }

  const getStatusCounts = () => {
    const today = new Date()

    return sortedAndFilteredTreatments.reduce((acc, treatment) => {
      // Payment status counts
      acc[treatment.payment_status] = (acc[treatment.payment_status] || 0) + 1

      // Treatment timing counts
      const tDate = new Date(treatment.treatment_date)
      const isToday = format(tDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
      const isFuture = tDate > today
      const isPast = tDate < today

      if (isToday) {
        acc.today = (acc.today || 0) + 1
      } else if (isFuture) {
        acc.upcoming = (acc.upcoming || 0) + 1
      } else if (isPast) {
        acc.completed = (acc.completed || 0) + 1
      }

      return acc
    }, {} as Record<string, number>)
  }

  const getTotalRevenue = () => {
    const totalValue = sortedAndFilteredTreatments.reduce((total, treatment) => total + treatment.total_cost, 0)
    const paidRevenue = sortedAndFilteredTreatments
      .filter(t => t.payment_status === 'paid')
      .reduce((total, treatment) => total + treatment.total_cost, 0)
    const partialRevenue = sortedAndFilteredTreatments
      .filter(t => t.payment_status === 'partial')
      .reduce((total, treatment) => total + (treatment.total_cost * 0.5), 0) // Assume 50% for partial

    return {
      totalValue,
      paidRevenue,
      partialRevenue,
      collectedRevenue: paidRevenue + partialRevenue
    }
  }

  const statusCounts = getStatusCounts()
  const revenueData = getTotalRevenue()

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-base font-semibold">
              <FileText className="h-4 w-4" />
              Treatment History
            </CardTitle>
            <CardDescription>
              {getDateRangeLabel()} • {sortedAndFilteredTreatments.length} treatments
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

          <Select value={treatmentStatusFilter} onValueChange={setTreatmentStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="today">Today</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <CreditCard className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Payment" />
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
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="past_month">Past Month</SelectItem>
              <SelectItem value="past_quarter">Past Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {sortedAndFilteredTreatments.length > 0 && (
          <div className="space-y-3 pt-4">
            {/* Revenue Summary */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Financial Summary</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Total Value: {formatCurrency(revenueData.totalValue)}
                </Badge>
                <Badge variant="secondary">
                  Collected: {formatCurrency(revenueData.collectedRevenue)}
                </Badge>
                <Badge variant="outline">
                  Outstanding: {formatCurrency(revenueData.totalValue - revenueData.collectedRevenue)}
                </Badge>
              </div>
            </div>

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
        ) : sortedAndFilteredTreatments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base font-semibold mb-2">No treatments found</h3>
            <p className="text-muted-foreground">
              {searchTerm || paymentStatusFilter !== 'all' || treatmentStatusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No treatments recorded for the selected time period.'}
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {sortedAndFilteredTreatments.map((treatment) => (
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
                            {treatment.patients?.first_name} {treatment.patients?.last_name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {treatment.patients?.patient_id}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-4 w-4" />
                          <span className={getTreatmentDateStyle(treatment.treatment_date)}>
                            {format(new Date(treatment.treatment_date), 'PPP')}
                          </span>
                          <span>•</span>
                          <span>{treatment.treatment_procedures?.length || 0} procedures</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getTreatmentStatusBadge(treatment.treatment_date, undefined)}
                      <Badge variant="default" className="font-semibold">
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
                      <h4 className="text-sm font-semibold">Treatment Details</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className={getTreatmentDateStyle(treatment.treatment_date)}>
                          Date: {format(new Date(treatment.treatment_date), 'PPP')}
                          {getTreatmentStatusBadge(treatment.treatment_date, undefined)}
                        </div>
                        {treatment.appointment && (
                          <div>
                            Appointment: {format(new Date(treatment.appointment.appointment_date), 'PPP')}
                            at {treatment.appointment.appointment_time}
                          </div>
                        )}
                        <div>Total Cost: {formatCurrency(treatment.total_cost)}</div>
                        <div>Payment: {getPaymentStatusBadge(treatment.payment_status)}</div>
                      </div>
                    </div>
                    {treatment.notes && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Notes</h4>
                        <p className="text-sm text-muted-foreground">{treatment.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Procedures */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Procedures Performed</h4>
                    <div className="space-y-2">
                      {treatment.treatment_procedures?.map((tp) => (
                        <div key={tp.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold">{tp.procedure?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              Quantity: {tp.quantity} × {formatCurrency(tp.cost_per_unit ?? 0)}
                              {tp.tooth_number && ` • Tooth: ${tp.tooth_number}`}
                            </div>
                            {tp.notes && (
                              <div className="text-xs text-muted-foreground">{tp.notes}</div>
                            )}
                          </div>
                          <Badge variant="outline">
                            {formatCurrency(tp.total_cost ?? 0)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2 border-t">
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