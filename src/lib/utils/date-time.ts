import { format, parseISO, addMinutes, isValid, startOfDay, endOfDay } from 'date-fns'

/**
 * Format time string to 12-hour format
 * @param time - Time in "HH:mm:ss" or "HH:mm" format
 * @returns Formatted time like "2:30 PM"
 */
export function formatTime(time: string): string {
  try {
    // Handle both "HH:mm:ss" and "HH:mm" formats
    const timeWithSeconds = time.includes(':') && time.split(':').length === 2
      ? `${time}:00`
      : time

    const parsedTime = parseISO(`2000-01-01T${timeWithSeconds}`)

    if (!isValid(parsedTime)) {
      return time // Return original if parsing fails
    }

    return format(parsedTime, 'h:mm a')
  } catch (error) {
    return time // Return original if any error occurs
  }
}

/**
 * Format date string to readable format
 * @param date - Date in "YYYY-MM-DD" format
 * @returns Formatted date like "Jan 15, 2024"
 */
export function formatDate(date: string): string {
  try {
    const parsedDate = parseISO(date)

    if (!isValid(parsedDate)) {
      return date // Return original if parsing fails
    }

    return format(parsedDate, 'MMM dd, yyyy')
  } catch (error) {
    return date // Return original if any error occurs
  }
}

/**
 * Format date to full readable format
 * @param date - Date string or Date object
 * @returns Formatted date like "Monday, January 15, 2024"
 */
export function formatDateFull(date: string | Date): string {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date

    if (!isValid(parsedDate)) {
      return typeof date === 'string' ? date : date.toString()
    }

    return format(parsedDate, 'PPPP')
  } catch (error) {
    return typeof date === 'string' ? date : date.toString()
  }
}

/**
 * Format date for HTML input fields
 * @param date - Date object
 * @returns Date string in "YYYY-MM-DD" format
 */
export function formatDateForInput(date: Date): string {
  try {
    if (!isValid(date)) {
      return ''
    }

    return format(date, 'yyyy-MM-dd')
  } catch (error) {
    return ''
  }
}

/**
 * Calculate end time from start time and duration
 * @param startTime - Start time in "HH:mm:ss" or "HH:mm" format
 * @param durationMinutes - Duration in minutes
 * @returns End time in same format as input
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  try {
    // Handle both "HH:mm:ss" and "HH:mm" formats
    const timeWithSeconds = startTime.includes(':') && startTime.split(':').length === 2
      ? `${startTime}:00`
      : startTime

    const startDateTime = parseISO(`2000-01-01T${timeWithSeconds}`)

    if (!isValid(startDateTime)) {
      return startTime // Return original if parsing fails
    }

    const endDateTime = addMinutes(startDateTime, durationMinutes)

    // Return in same format as input
    const formatString = startTime.split(':').length === 2 ? 'HH:mm' : 'HH:mm:ss'
    return format(endDateTime, formatString)
  } catch (error) {
    return startTime // Return original if any error occurs
  }
}

/**
 * Format date and time together
 * @param date - Date in "YYYY-MM-DD" format
 * @param time - Time in "HH:mm:ss" or "HH:mm" format
 * @returns Formatted datetime like "Jan 15, 2024 at 2:30 PM"
 */
export function formatDateTime(date: string, time: string): string {
  try {
    const formattedDate = formatDate(date)
    const formattedTime = formatTime(time)
    return `${formattedDate} at ${formattedTime}`
  } catch (error) {
    return `${date} ${time}`
  }
}

/**
 * Check if a date is today
 * @param date - Date string in "YYYY-MM-DD" format
 * @returns True if the date is today
 */
export function isToday(date: string): boolean {
  try {
    const parsedDate = parseISO(date)
    const today = new Date()

    if (!isValid(parsedDate)) {
      return false
    }

    return format(parsedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  } catch (error) {
    return false
  }
}

/**
 * Get time duration in readable format
 * @param minutes - Duration in minutes
 * @returns Formatted duration like "1h 30m" or "45m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

/**
 * Create date range for API queries
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Object with formatted start and end dates
 */
export function createDateRange(startDate: Date, endDate: Date) {
  return {
    start_date: formatDateForInput(startOfDay(startDate)),
    end_date: formatDateForInput(endOfDay(endDate))
  }
}

/**
 * Parse appointment slot time for comparison
 * @param time - Time in "HH:mm" format
 * @returns Minutes since midnight
 */
export function parseTimeToMinutes(time: string): number {
  try {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  } catch (error) {
    return 0
  }
}

/**
 * Convert minutes to time string
 * @param minutes - Minutes since midnight
 * @returns Time in "HH:mm" format
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Validate date string format
 * @param date - Date string to validate
 * @returns True if date is in valid YYYY-MM-DD format
 */
export function isValidDateString(date: string): boolean {
  try {
    const regex = /^\d{4}-\d{2}-\d{2}$/
    if (!regex.test(date)) {
      return false
    }

    const parsedDate = parseISO(date)
    return isValid(parsedDate)
  } catch (error) {
    return false
  }
}

/**
 * Validate time string format
 * @param time - Time string to validate
 * @returns True if time is in valid HH:mm or HH:mm:ss format
 */
export function isValidTimeString(time: string): boolean {
  try {
    const regex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/
    return regex.test(time)
  } catch (error) {
    return false
  }
}