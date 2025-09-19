'use client'

import { useState } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { FormLabel } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Activity,
  AlertTriangle,
  FileText,
  Heart
} from 'lucide-react'
import { useMedicalHistoryFields } from '@/lib/hooks/use-medical-history-fields'

interface MedicalHistoryField {
  id: string
  field_name: string
  field_type: 'checkbox' | 'text' | 'number'
  is_active: boolean
}

interface MedicalHistorySectionProps {
  medicalHistory: Record<string, any>
  onMedicalHistoryChange: (fieldId: string, value: any) => void
  title?: string
  description?: string
  readOnly?: boolean
}

export function MedicalHistorySection({
  medicalHistory,
  onMedicalHistoryChange,
  title = "Medical History",
  description = "Health conditions, allergies, and medical notes",
  readOnly = false
}: MedicalHistorySectionProps) {
  const { fields: medicalHistoryFields, loading: fieldsLoading, error: fieldsError } = useMedicalHistoryFields()

  if (fieldsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Heart className="h-4 w-4" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (fieldsError) {
    console.warn('Medical history fields error:', fieldsError)
    // Don't show error to user, just use empty fields
  }

  const checkboxFields = medicalHistoryFields.filter(field => field.field_type === 'checkbox' && field.is_active)
  const textFields = medicalHistoryFields.filter(field => field.field_type === 'text' && field.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Heart className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <Accordion type="multiple" className="w-full space-y-3">
        {/* Medical Conditions */}
        {checkboxFields.length > 0 && (
          <AccordionItem value="medical-conditions" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Medical Conditions</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {Object.keys(medicalHistory).filter(key =>
                    checkboxFields.some(field => field.id === key) && medicalHistory[key]
                  ).length} selected
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                {checkboxFields.map((field) => (
                  <div key={field.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={field.id}
                      checked={medicalHistory[field.id] || false}
                      onCheckedChange={(checked) =>
                        onMedicalHistoryChange(field.id, checked)
                      }
                      disabled={readOnly}
                    />
{readOnly ? (
                      <label
                        htmlFor={field.id}
                        className="text-sm font-normal cursor-pointer flex-1 leading-tight text-muted-foreground"
                      >
                        {field.field_name}
                      </label>
                    ) : (
                      <FormLabel
                        htmlFor={field.id}
                        className="text-sm font-normal cursor-pointer flex-1 leading-tight text-muted-foreground"
                      >
                        {field.field_name}
                      </FormLabel>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Additional Information (Allergies, Medications, etc.) */}
        {textFields.length > 0 && (
          <AccordionItem value="additional-info" className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Additional Information</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {Object.keys(medicalHistory).filter(key =>
                    textFields.some(field => field.id === key) && medicalHistory[key]?.trim()
                  ).length} completed
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                {textFields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
{readOnly ? (
                      <label
                        htmlFor={field.id}
                        className="text-sm font-medium flex items-center gap-2"
                      >
                        {field.field_name.toLowerCase().includes('allerg') && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        {field.field_name.toLowerCase().includes('medication') && (
                          <FileText className="h-4 w-4 text-primary" />
                        )}
                        {field.field_name}
                      </label>
                    ) : (
                      <FormLabel
                        htmlFor={field.id}
                        className="text-sm font-medium flex items-center gap-2"
                      >
                        {field.field_name.toLowerCase().includes('allerg') && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                        {field.field_name.toLowerCase().includes('medication') && (
                          <FileText className="h-4 w-4 text-primary" />
                        )}
                        {field.field_name}
                      </FormLabel>
                    )}
                    <textarea
                      id={field.id}
                      placeholder={`Enter ${field.field_name.toLowerCase()}...`}
                      value={medicalHistory[field.id] || ''}
                      onChange={(e) => onMedicalHistoryChange(field.id, e.target.value)}
                      rows={2}
                      disabled={readOnly}
                      readOnly={readOnly}
                      className={`resize-none text-sm h-16 w-full max-w-md px-3 py-2 rounded-md border bg-background transition-colors ${
                        field.field_name.toLowerCase().includes('allerg')
                          ? 'border-destructive/20 focus:border-destructive'
                          : 'border-input focus:border-primary'
                      }`}
                      style={{
                        outline: 'none',
                        boxShadow: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none'
                      }}
                      onFocus={(e) => e.target.style.outline = 'none'}
                    />
                    {field.field_name.toLowerCase().includes('allerg') && (
                      <p className="text-xs text-destructive/70 leading-tight">
                        Include severity, reactions, and emergency treatments
                      </p>
                    )}
                    {field.field_name.toLowerCase().includes('medication') && (
                      <p className="text-xs text-muted-foreground leading-tight">
                        List medications, dosages, and frequency
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {checkboxFields.length === 0 && textFields.length === 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No medical history fields configured. Please contact your administrator.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}