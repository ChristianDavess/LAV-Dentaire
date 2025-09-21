'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { procedureSchema, type ProcedureSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

interface Procedure {
  id: string
  name: string
  description?: string
  default_cost?: number
  estimated_duration?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProcedureFormProps {
  procedure?: Procedure
  onSuccess: () => void
}

export default function ProcedureForm({ procedure, onSuccess }: ProcedureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ProcedureSchema>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      name: procedure?.name || '',
      description: procedure?.description || '',
      default_cost: procedure?.default_cost || 0,
      estimated_duration: procedure?.estimated_duration || 0,
      is_active: procedure?.is_active ?? true
    }
  })

  const handleSubmit = async (data: ProcedureSchema) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const url = procedure ? `/api/procedures/${procedure.id}` : '/api/procedures'
      const method = procedure ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${procedure ? 'update' : 'create'} procedure`)
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${procedure ? 'update' : 'create'} procedure`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Procedure Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Procedure Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Teeth Cleaning, Root Canal, Dental Filling..."
                  aria-describedby="name-description"
                  {...field}
                />
              </FormControl>
              <FormDescription id="name-description">
                The name of the dental procedure
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the procedure details, what it involves, benefits, etc..."
                  className="resize-none"
                  rows={3}
                  aria-describedby="description-description"
                  {...field}
                />
              </FormControl>
              <FormDescription id="description-description">
                Optional detailed description of the procedure
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Cost */}
          <FormField
            control={form.control}
            name="default_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">Default Cost (₱)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    aria-describedby="cost-description"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                  />
                </FormControl>
                <FormDescription id="cost-description">
                  Default cost in Philippine Peso (can be overridden per treatment)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Estimated Duration */}
          <FormField
            control={form.control}
            name="estimated_duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold">Estimated Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="60"
                    aria-describedby="duration-description"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                  />
                </FormControl>
                <FormDescription id="duration-description">
                  Typical duration for this procedure in minutes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Active Status */}
        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-base font-semibold">
                  Active Procedure
                </FormLabel>
                <FormDescription>
                  Active procedures can be selected when creating treatments.
                  Inactive procedures are hidden from selection but preserved in historical data.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4 border-t">
          <Button
            type="submit"
            disabled={isSubmitting}
            aria-label={
              isSubmitting
                ? `${procedure ? 'Updating' : 'Creating'} procedure...`
                : `${procedure ? 'Update' : 'Create'} procedure`
            }
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {isSubmitting
              ? `${procedure ? 'Updating' : 'Creating'}...`
              : `${procedure ? 'Update' : 'Create'} Procedure`
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}