// Date and time utilities
export * from './date-time'

// Validation utilities
export * from './validation'

// Individual utility exports for convenience
export {
  formatTime,
  formatDate,
  formatDateFull,
  formatDateForInput,
  calculateEndTime,
  formatDateTime,
  isToday,
  formatDuration,
  createDateRange,
  parseTimeToMinutes,
  minutesToTimeString,
  isValidDateString,
  isValidTimeString
} from './date-time'

export {
  isValidEmail,
  isValidPhone,
  formatPhoneNumber,
  isValidDateOfBirth,
  isValidAppointmentTime,
  validatePassword,
  isValidPatientId,
  isValidCost,
  formatCost,
  isValidDuration,
  isValidMedicalNotes,
  sanitizeInput,
  isValidEmergencyContact,
  isValidStatusTransition,
  validateField
} from './validation'

// Re-export existing utilities for convenience
export { cn } from '../utils'