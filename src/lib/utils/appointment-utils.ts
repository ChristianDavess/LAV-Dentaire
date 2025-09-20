import { format, parseISO, addMinutes, isSameDay, isAfter, isBefore } from 'date-fns'

export interface AppointmentTime {
  date: string // YYYY-MM-DD
  time: string // HH:MM:SS
  duration: number // minutes
}

export interface TimeSlot {
  start: Date
  end: Date
  available: boolean
}

/**
 * Format time string to readable format
 */
export function formatTime(time: string): string {
  try {
    return format(parseISO(`2000-01-01T${time}`), 'h:mm a')
  } catch {
    return time
  }
}

/**
 * Format date string to readable format
 */
export function formatDate(date: string): string {
  try {
    return format(parseISO(date), 'MMM dd, yyyy')
  } catch {
    return date
  }
}

/**
 * Get end time for an appointment
 */
export function getEndTime(startTime: string, duration: number): string {
  try {
    const start = parseISO(`2000-01-01T${startTime}`)
    const end = addMinutes(start, duration)
    return format(end, 'h:mm a')
  } catch {
    return startTime
  }
}

/**
 * Check if two appointments conflict
 */
export function appointmentsConflict(
  apt1: AppointmentTime,
  apt2: AppointmentTime
): boolean {
  // Different dates can't conflict
  if (apt1.date !== apt2.date) {
    return false
  }

  try {
    const start1 = parseISO(`${apt1.date}T${apt1.time}`)
    const end1 = addMinutes(start1, apt1.duration)

    const start2 = parseISO(`${apt2.date}T${apt2.time}`)
    const end2 = addMinutes(start2, apt2.duration)

    // Check for any overlap
    return (
      (isAfter(start1, start2) && isBefore(start1, end2)) ||
      (isAfter(end1, start2) && isBefore(end1, end2)) ||
      (isBefore(start1, start2) && isAfter(end1, end2)) ||
      (start1.getTime() === start2.getTime())
    )
  } catch {
    return false
  }
}

/**
 * Generate time slots for a given date
 */
export function generateTimeSlots(
  date: string,
  existingAppointments: AppointmentTime[],
  businessHours: { start: string; end: string },
  slotDuration: number = 30,
  bufferMinutes: number = 15
): TimeSlot[] {
  const slots: TimeSlot[] = []

  try {
    const startTime = parseISO(`${date}T${businessHours.start}`)
    const endTime = parseISO(`${date}T${businessHours.end}`)

    let currentTime = new Date(startTime)

    while (currentTime < endTime) {
      const slotEnd = addMinutes(currentTime, slotDuration)

      if (slotEnd <= endTime) {
        const timeString = format(currentTime, 'HH:mm:ss')

        // Check if this slot conflicts with any existing appointment
        const hasConflict = existingAppointments.some(apt => {
          const appointmentStart = parseISO(`${apt.date}T${apt.time}`)
          const appointmentEnd = addMinutes(appointmentStart, apt.duration + bufferMinutes)
          const bufferedStart = addMinutes(appointmentStart, -bufferMinutes)

          return (
            (isAfter(currentTime, bufferedStart) && isBefore(currentTime, appointmentEnd)) ||
            (isAfter(slotEnd, bufferedStart) && isBefore(slotEnd, appointmentEnd)) ||
            (isBefore(currentTime, bufferedStart) && isAfter(slotEnd, appointmentEnd))
          )
        })

        slots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd),
          available: !hasConflict
        })
      }

      currentTime = addMinutes(currentTime, slotDuration)
    }
  } catch (error) {
    console.error('Error generating time slots:', error)
  }

  return slots
}

/**
 * Get appointment status color
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'blue'
    case 'completed':
      return 'green'
    case 'cancelled':
      return 'red'
    case 'no-show':
      return 'gray'
    default:
      return 'gray'
  }
}

/**
 * Get appointment status label
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case 'scheduled':
      return 'Scheduled'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    case 'no-show':
      return 'No Show'
    default:
      return status
  }
}

/**
 * Validate appointment time
 */
export function validateAppointmentTime(
  date: string,
  time: string,
  duration: number,
  businessHours: { start: string; end: string }
): { valid: boolean; error?: string } {
  try {
    const appointmentStart = parseISO(`${date}T${time}`)
    const appointmentEnd = addMinutes(appointmentStart, duration)

    const businessStart = parseISO(`${date}T${businessHours.start}`)
    const businessEnd = parseISO(`${date}T${businessHours.end}`)

    // Check if appointment is in the past
    const now = new Date()
    if (isBefore(appointmentStart, now)) {
      return { valid: false, error: 'Cannot schedule appointments in the past' }
    }

    // Check if appointment is within business hours
    if (isBefore(appointmentStart, businessStart)) {
      return { valid: false, error: 'Appointment starts before business hours' }
    }

    if (isAfter(appointmentEnd, businessEnd)) {
      return { valid: false, error: 'Appointment ends after business hours' }
    }

    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid date or time format' }
  }
}

/**
 * Get duration options for appointments
 */
export function getDurationOptions(): { value: number; label: string }[] {
  return [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3 hours' },
    { value: 240, label: '4 hours' }
  ]
}

/**
 * Calculate appointment statistics
 */
export function calculateAppointmentStats(appointments: any[]) {
  const total = appointments.length
  const scheduled = appointments.filter(apt => apt.status === 'scheduled').length
  const completed = appointments.filter(apt => apt.status === 'completed').length
  const cancelled = appointments.filter(apt => apt.status === 'cancelled').length
  const noShow = appointments.filter(apt => apt.status === 'no-show').length

  return {
    total,
    scheduled,
    completed,
    cancelled,
    noShow,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    noShowRate: total > 0 ? Math.round((noShow / total) * 100) : 0
  }
}

/**
 * Sort appointments by date and time
 */
export function sortAppointments(appointments: any[]): any[] {
  return [...appointments].sort((a, b) => {
    const dateComparison = a.appointment_date.localeCompare(b.appointment_date)
    if (dateComparison !== 0) return dateComparison
    return a.appointment_time.localeCompare(b.appointment_time)
  })
}

/**
 * Filter appointments by date range
 */
export function filterAppointmentsByDateRange(
  appointments: any[],
  startDate: string,
  endDate: string
): any[] {
  return appointments.filter(apt => {
    return apt.appointment_date >= startDate && apt.appointment_date <= endDate
  })
}

/**
 * Group appointments by date
 */
export function groupAppointmentsByDate(appointments: any[]): Record<string, any[]> {
  return appointments.reduce((groups, appointment) => {
    const date = appointment.appointment_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(appointment)
    return groups
  }, {} as Record<string, any[]>)
}