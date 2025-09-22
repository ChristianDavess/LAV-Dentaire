// Data fetching hooks
export * from './use-appointments'
export * from './use-patients'
export * from './use-treatments'
export * from './use-procedures'

// API and state management hooks
export * from './use-api'
export * from './use-local-storage'
export * from './use-debounced'

// Individual hook exports for convenience
export { useAppointments, useAppointmentsByDateRange, usePatientAppointments } from './use-appointments'
export { usePatients, usePatientsForSelection, usePatient } from './use-patients'
export { useTreatments, usePatientTreatments, useTreatment, useTreatmentStats } from './use-treatments'
export { useProcedures, useProceduresForSelection, useProcedure, usePopularProcedures } from './use-procedures'
export { useApi } from './use-api'
export {
  useLocalStorage,
  useFormDraft,
  useUserPreferences,
  useRecentItems,
  useUIState,
  useSearchHistory
} from './use-local-storage'
export {
  useDebounced,
  useDebouncedCallback,
  useDebouncedSearch,
  useDebouncedAutoSave,
  useDebouncedApi,
  useDebouncedValidation
} from './use-debounced'

// Re-export shadcn hooks for convenience
export { useToast } from './use-toast'