'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Plus, Minus, Trash2, CreditCard, Hash, FileText } from 'lucide-react'

interface Procedure {
  id: string
  name: string
  description?: string
  default_cost?: number
  estimated_duration?: number
  is_active: boolean
}

interface TreatmentProcedure {
  procedure_id: string
  procedure?: Procedure
  quantity: number
  cost_per_unit: number
  tooth_number?: string
  notes?: string
}

interface ProcedureSelectorProps {
  procedures: Procedure[]
  selectedProcedures: TreatmentProcedure[]
  onProceduresChange: (procedures: TreatmentProcedure[]) => void
}

export default function ProcedureSelector({
  procedures,
  selectedProcedures,
  onProceduresChange
}: ProcedureSelectorProps) {
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>('')

  const handleAddProcedure = () => {
    if (!selectedProcedureId) return

    const procedure = procedures.find(p => p.id === selectedProcedureId)
    if (!procedure) return

    // Check if procedure is already selected
    const existingIndex = selectedProcedures.findIndex(p => p.procedure_id === selectedProcedureId)
    if (existingIndex >= 0) {
      // Increase quantity instead of adding duplicate
      const updated = [...selectedProcedures]
      updated[existingIndex].quantity += 1
      onProceduresChange(updated)
    } else {
      // Add new procedure
      const newProcedure: TreatmentProcedure = {
        procedure_id: selectedProcedureId,
        procedure,
        quantity: 1,
        cost_per_unit: procedure.default_cost || 0,
        tooth_number: '',
        notes: ''
      }
      onProceduresChange([...selectedProcedures, newProcedure])
    }

    setSelectedProcedureId('')
  }

  const handleRemoveProcedure = (index: number) => {
    const updated = selectedProcedures.filter((_, i) => i !== index)
    onProceduresChange(updated)
  }

  const handleUpdateProcedure = (index: number, field: keyof TreatmentProcedure, value: any) => {
    const updated = [...selectedProcedures]
    if (field === 'quantity') {
      const numValue = parseInt(value)
      updated[index][field] = isNaN(numValue) || numValue < 1 ? 1 : numValue
    } else if (field === 'cost_per_unit') {
      const numValue = parseFloat(value)
      updated[index][field] = isNaN(numValue) || numValue < 0 ? 0 : numValue
    } else {
      updated[index][field] = value
    }
    onProceduresChange(updated)
  }

  const getAvailableProcedures = () => {
    return procedures.filter(p => p.is_active)
  }

  const formatCurrency = (amount: number) => {
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
  }

  const calculateProcedureTotal = (procedure: TreatmentProcedure) => {
    return procedure.quantity * procedure.cost_per_unit
  }

  const availableProcedures = getAvailableProcedures()

  return (
    <div className="space-y-4">
      {/* Add Procedure Section */}
      <div className="flex gap-2">
        <Select value={selectedProcedureId} onValueChange={setSelectedProcedureId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a procedure to add..." />
          </SelectTrigger>
          <SelectContent>
            {availableProcedures.map((procedure) => (
              <SelectItem key={procedure.id} value={procedure.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{procedure.name}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {procedure.default_cost && (
                      <span>{formatCurrency(procedure.default_cost)}</span>
                    )}
                    {procedure.estimated_duration && (
                      <span>({procedure.estimated_duration}min)</span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          onClick={handleAddProcedure}
          disabled={!selectedProcedureId}
          size="default"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected Procedures List */}
      {selectedProcedures.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No procedures selected</p>
          <p className="text-sm">Add procedures to this treatment using the dropdown above</p>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedProcedures.map((selectedProcedure, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              {/* Procedure Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {selectedProcedure.procedure?.name || 'Unknown Procedure'}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      {formatCurrency(calculateProcedureTotal(selectedProcedure))}
                    </Badge>
                  </div>
                  {selectedProcedure.procedure?.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedProcedure.procedure.description}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveProcedure(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              {/* Procedure Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Quantity */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    Quantity
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateProcedure(index, 'quantity', Math.max(1, selectedProcedure.quantity - 1))}
                      disabled={selectedProcedure.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={selectedProcedure.quantity}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '') {
                          handleUpdateProcedure(index, 'quantity', 1)
                        } else {
                          handleUpdateProcedure(index, 'quantity', value)
                        }
                      }}
                      className="text-center w-20"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateProcedure(index, 'quantity', selectedProcedure.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Cost per Unit */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Cost per Unit (₱)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={selectedProcedure.cost_per_unit}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '') {
                        handleUpdateProcedure(index, 'cost_per_unit', 0)
                      } else {
                        handleUpdateProcedure(index, 'cost_per_unit', value)
                      }
                    }}
                    placeholder="0.00"
                  />
                </div>

                {/* Tooth Number */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tooth Number (Optional)</Label>
                  <Input
                    value={selectedProcedure.tooth_number || ''}
                    onChange={(e) => handleUpdateProcedure(index, 'tooth_number', e.target.value)}
                    placeholder="e.g., 1, 2, 3..."
                  />
                </div>
              </div>

              {/* Procedure Notes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Procedure Notes (Optional)
                </Label>
                <Textarea
                  value={selectedProcedure.notes || ''}
                  onChange={(e) => handleUpdateProcedure(index, 'notes', e.target.value)}
                  placeholder="Specific notes for this procedure instance..."
                  className="resize-none"
                  rows={2}
                />
              </div>

              {/* Calculation Summary */}
              <div className="flex items-center justify-between text-sm bg-muted/50 rounded-md p-2">
                <span className="text-muted-foreground">
                  {selectedProcedure.quantity} × {formatCurrency(selectedProcedure.cost_per_unit)}
                </span>
                <span className="font-medium">
                  = {formatCurrency(calculateProcedureTotal(selectedProcedure))}
                </span>
              </div>
            </div>
          ))}

          {/* Total Summary */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total Treatment Cost:</span>
              <Badge variant="default" className="text-base px-3 py-1">
                {formatCurrency(
                  selectedProcedures.reduce((total, proc) => total + calculateProcedureTotal(proc), 0)
                )}
              </Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}