/**
 * Validation utilities for common form fields and data formats
 */

/**
 * Validate email format
 * @param email - Email string to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validate phone number (supports various formats)
 * @param phone - Phone number string to validate
 * @returns True if phone number is valid
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')

  // Check if it's 10 digits (US) or 11 digits (with country code)
  return digitsOnly.length === 10 || digitsOnly.length === 11
}

/**
 * Format phone number to consistent display format
 * @param phone - Raw phone number string
 * @returns Formatted phone number like "(555) 123-4567"
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')

  if (digitsOnly.length === 10) {
    // Format as (XXX) XXX-XXXX
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`
  } else if (digitsOnly.length === 11 && digitsOnly[0] === '1') {
    // Format as +1 (XXX) XXX-XXXX
    return `+1 (${digitsOnly.slice(1, 4)}) ${digitsOnly.slice(4, 7)}-${digitsOnly.slice(7)}`
  }

  // Return original if format is not recognized
  return phone
}

/**
 * Validate date of birth (must be in the past and reasonable)
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns True if date of birth is valid
 */
export function isValidDateOfBirth(dateOfBirth: string): boolean {
  try {
    const date = new Date(dateOfBirth)
    const now = new Date()
    const minDate = new Date()
    minDate.setFullYear(now.getFullYear() - 150) // No one is older than 150

    return (
      date instanceof Date &&
      !isNaN(date.getTime()) &&
      date < now && // Must be in the past
      date > minDate // Must be reasonable
    )
  } catch {
    return false
  }
}

/**
 * Validate appointment time (must be during business hours)
 * @param time - Time string in HH:mm format
 * @param businessStart - Business start time (default: "08:00")
 * @param businessEnd - Business end time (default: "18:00")
 * @returns True if time is within business hours
 */
export function isValidAppointmentTime(
  time: string,
  businessStart: string = "08:00",
  businessEnd: string = "18:00"
): boolean {
  try {
    const [hours, minutes] = time.split(':').map(Number)
    const [startHours, startMinutes] = businessStart.split(':').map(Number)
    const [endHours, endMinutes] = businessEnd.split(':').map(Number)

    const timeInMinutes = hours * 60 + minutes
    const startInMinutes = startHours * 60 + startMinutes
    const endInMinutes = endHours * 60 + endMinutes

    return timeInMinutes >= startInMinutes && timeInMinutes <= endInMinutes
  } catch {
    return false
  }
}

/**
 * Validate password strength
 * @param password - Password string to validate
 * @returns Object with validation result and feedback
 */
export function validatePassword(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long')
  } else {
    score += 1
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter')
  } else {
    score += 1
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter')
  } else {
    score += 1
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number')
  } else {
    score += 1
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push('Password must contain at least one special character')
  } else {
    score += 1
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  }
}

/**
 * Validate patient ID format (P001, P002, etc.)
 * @param patientId - Patient ID string to validate
 * @returns True if patient ID is valid format
 */
export function isValidPatientId(patientId: string): boolean {
  const patientIdRegex = /^P\d{3,}$/
  return patientIdRegex.test(patientId)
}

/**
 * Validate medical procedure cost
 * @param cost - Cost value to validate
 * @returns True if cost is valid (positive number with max 2 decimal places)
 */
export function isValidCost(cost: number | string): boolean {
  const numericCost = typeof cost === 'string' ? parseFloat(cost) : cost

  return (
    !isNaN(numericCost) &&
    numericCost >= 0 &&
    Number.isFinite(numericCost) &&
    // Check for max 2 decimal places
    (numericCost * 100) % 1 === 0
  )
}

/**
 * Format cost for display
 * @param cost - Cost value to format
 * @returns Formatted cost string like "$123.45"
 */
export function formatCost(cost: number | string): string {
  const numericCost = typeof cost === 'string' ? parseFloat(cost) : cost

  if (isNaN(numericCost)) {
    return '$0.00'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(numericCost)
}

/**
 * Validate appointment duration
 * @param duration - Duration in minutes
 * @returns True if duration is valid (15-480 minutes, in 15-minute increments)
 */
export function isValidDuration(duration: number): boolean {
  return (
    duration >= 15 &&
    duration <= 480 && // Max 8 hours
    duration % 15 === 0 // Must be in 15-minute increments
  )
}

/**
 * Validate medical notes (check for reasonable length and no dangerous content)
 * @param notes - Notes string to validate
 * @returns True if notes are valid
 */
export function isValidMedicalNotes(notes: string): boolean {
  const trimmedNotes = notes.trim()

  return (
    trimmedNotes.length <= 5000 && // Max length
    !/[<>]/.test(trimmedNotes) // No HTML-like content for security
  )
}

/**
 * Sanitize user input to prevent XSS
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate emergency contact information
 * @param contact - Contact object with name and phone
 * @returns True if contact information is valid
 */
export function isValidEmergencyContact(contact: {
  name?: string
  phone?: string
}): boolean {
  if (!contact.name && !contact.phone) {
    return true // Both empty is okay
  }

  if (contact.name && contact.phone) {
    return (
      contact.name.trim().length >= 2 &&
      contact.name.trim().length <= 100 &&
      isValidPhone(contact.phone)
    )
  }

  return false // One field filled but not the other
}

/**
 * Validate appointment status transition
 * @param currentStatus - Current appointment status
 * @param newStatus - New status to transition to
 * @returns True if transition is valid
 */
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const validTransitions: Record<string, string[]> = {
    'scheduled': ['completed', 'cancelled', 'no-show'],
    'completed': [], // Completed appointments shouldn't change
    'cancelled': ['scheduled'], // Can reschedule cancelled appointments
    'no-show': ['scheduled'] // Can reschedule no-shows
  }

  return validTransitions[currentStatus]?.includes(newStatus) ?? false
}

/**
 * Generate validation error messages for forms
 * @param fieldName - Name of the field being validated
 * @param value - Value to validate
 * @param rules - Validation rules to apply
 * @returns Array of error messages
 */
export function validateField(
  fieldName: string,
  value: any,
  rules: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any) => boolean | string
  }
): string[] {
  const errors: string[] = []

  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    errors.push(`${fieldName} is required`)
    return errors // If required and empty, don't run other validations
  }

  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && !value.trim())) {
    return errors
  }

  // Length validations
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`${fieldName} must be at least ${rules.minLength} characters`)
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`${fieldName} must be no more than ${rules.maxLength} characters`)
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(`${fieldName} format is invalid`)
  }

  // Custom validation
  if (rules.custom) {
    const customResult = rules.custom(value)
    if (customResult === false) {
      errors.push(`${fieldName} is invalid`)
    } else if (typeof customResult === 'string') {
      errors.push(customResult)
    }
  }

  return errors
}