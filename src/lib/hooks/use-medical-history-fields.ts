import { useState, useEffect } from 'react'

export interface MedicalHistoryField {
  id: string
  field_name: string
  field_type: 'checkbox' | 'text' | 'number'
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export function useMedicalHistoryFields() {
  const [fields, setFields] = useState<MedicalHistoryField[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFields = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/medical-history-fields', {
        credentials: 'include'
      })

      if (!response.ok) {
        // If 404, it might mean the table doesn't exist yet - return empty array
        if (response.status === 404) {
          console.warn('Medical history fields table not found - using empty array')
          setFields([])
          return
        }
        throw new Error('Failed to fetch medical history fields')
      }

      const data = await response.json()
      setFields(data.fields || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching medical history fields:', err)
      // Set empty array as fallback to prevent blocking the UI
      setFields([])
    } finally {
      setLoading(false)
    }
  }

  const createField = async (fieldData: Omit<MedicalHistoryField, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/medical-history-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(fieldData),
      })

      if (!response.ok) {
        throw new Error('Failed to create medical history field')
      }

      const data = await response.json()
      setFields(prev => [...prev, data.field])
      return data.field
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create field')
      throw err
    }
  }

  const updateField = async (id: string, fieldData: Partial<MedicalHistoryField>) => {
    try {
      const response = await fetch(`/api/medical-history-fields/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldData),
      })

      if (!response.ok) {
        throw new Error('Failed to update medical history field')
      }

      const data = await response.json()
      setFields(prev =>
        prev.map(field => field.id === id ? data.field : field)
      )
      return data.field
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update field')
      throw err
    }
  }

  const deleteField = async (id: string) => {
    try {
      const response = await fetch(`/api/medical-history-fields/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete medical history field')
      }

      setFields(prev => prev.filter(field => field.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete field')
      throw err
    }
  }

  useEffect(() => {
    fetchFields()
  }, [])

  return {
    fields,
    loading,
    error,
    refetch: fetchFields,
    createField,
    updateField,
    deleteField,
  }
}