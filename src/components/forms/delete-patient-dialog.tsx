'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Trash2,
  AlertTriangle,
  Loader2,
  User
} from 'lucide-react'
import type { Patient } from '@/types/database'

interface DeletePatientDialogProps {
  patient: Patient
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function DeletePatientDialog({ patient, trigger, onSuccess }: DeletePatientDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setIsLoading(true)
    setError('')

    try {
      console.log('Deleting patient with ID:', patient.id)

      const response = await fetch(`/api/patients/${patient.id}`, {
        method: 'DELETE',
      })

      console.log('Delete response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Delete patient error:', errorData)
        throw new Error(errorData.error || 'Failed to delete patient')
      }

      const result = await response.json()
      console.log('Patient deleted successfully:', result)

      // Success handling
      setIsOpen(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      console.error('Delete patient error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while deleting the patient')
    } finally {
      setIsLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="destructive" size="sm">
      <Trash2 className="mr-2 h-4 w-4" />
      Delete Patient
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">Delete Patient</DialogTitle>
              <DialogDescription className="text-base">
                This action cannot be undone
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Patient Info Card */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-sm font-medium">
                  {patient.first_name[0]}{patient.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-semibold">
                  {patient.first_name} {patient.last_name}
                </h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {patient.patient_id}
                  </Badge>
                  <span>•</span>
                  <span>
                    Registered {new Date(patient.created_at).toLocaleDateString()}
                  </span>
                </div>
                {patient.email && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {patient.email}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Deleting this patient will permanently remove their profile,
              medical history, and all associated records. This action cannot be undone.
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Confirmation Message */}
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong>{patient.first_name} {patient.last_name}</strong>?
              This action cannot be undone.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Patient
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}