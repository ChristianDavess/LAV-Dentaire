'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface TimeSlotPickerProps {
  selectedDate: string | null
  duration: number
  selectedTime: string | null
  onTimeSelect: (time: string) => void
  className?: string
}

interface AvailabilityResponse {
  date: string
  duration: number
  availableSlots: string[]
  businessHours: {
    start: string
    end: string
    slotDuration: number
    breakDuration: number
  }
  totalSlots: number
}

export default function TimeSlotPicker({
  selectedDate,
  duration,
  selectedTime,
  onTimeSelect,
  className
}: TimeSlotPickerProps) {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedDate) {
      setAvailability(null)
      return
    }

    const fetchAvailability = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/appointments/availability?date=${selectedDate}&duration=${duration}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch availability')
        }

        const data = await response.json()
        setAvailability(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load time slots')
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [selectedDate, duration])

  const formatTime = (time: string) => {
    return format(parseISO(`2000-01-01T${time}`), 'h:mm a')
  }

  const groupSlotsByHour = (slots: string[]) => {
    const groups: { [key: string]: string[] } = {}

    slots.forEach(slot => {
      const hour = parseInt(slot.split(':')[0])
      const period = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'

      if (!groups[period]) {
        groups[period] = []
      }
      groups[period].push(slot)
    })

    return groups
  }

  if (!selectedDate) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Select Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please select a date first to see available time slots.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Select Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Select Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!availability || availability.availableSlots.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Select Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No available time slots for the selected date and duration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const groupedSlots = groupSlotsByHour(availability.availableSlots)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Select Time
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Duration: {duration} minutes</span>
          <Badge variant="outline">
            {availability.totalSlots} slots available
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedSlots).map(([period, slots]) => (
          <div key={period} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">{period}</h4>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={selectedTime === time ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onTimeSelect(time)}
                  className="text-xs"
                >
                  {formatTime(time)}
                </Button>
              ))}
            </div>
          </div>
        ))}

        {availability.businessHours && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <p>
              Business hours: {formatTime(availability.businessHours.start)} - {formatTime(availability.businessHours.end)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}