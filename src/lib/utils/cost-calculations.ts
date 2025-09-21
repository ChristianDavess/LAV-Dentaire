// Cost calculation utilities for treatments

export interface TreatmentProcedure {
  procedure_id: string
  quantity: number
  cost_per_unit: number
  tooth_number?: string
  notes?: string
}

export interface CostCalculation {
  subtotal: number
  total: number
  procedures: (TreatmentProcedure & { line_total: number })[]
}

/**
 * Calculate the total cost for a treatment including all procedures
 */
export function calculateTreatmentCost(procedures: TreatmentProcedure[]): CostCalculation {
  const proceduresWithTotals = procedures.map(proc => ({
    ...proc,
    line_total: proc.quantity * proc.cost_per_unit
  }))

  const subtotal = proceduresWithTotals.reduce((sum, proc) => sum + proc.line_total, 0)

  return {
    subtotal,
    total: subtotal, // No tax/discount for now, but structure allows for future additions
    procedures: proceduresWithTotals
  }
}

/**
 * Calculate cost for a single procedure line
 */
export function calculateProcedureCost(quantity: number, costPerUnit: number): number {
  return quantity * costPerUnit
}

/**
 * Format currency in Philippine Peso
 */
export function formatCurrency(amount: number, options?: {
  showSymbol?: boolean
  minimumFractionDigits?: number
}): string {
  const {
    showSymbol = true,
    minimumFractionDigits = 2
  } = options || {}

  const formatted = amount.toLocaleString('en-PH', {
    minimumFractionDigits,
    maximumFractionDigits: 2
  })

  return showSymbol ? `₱${formatted}` : formatted
}

/**
 * Parse currency string to number (removes symbols and formatting)
 */
export function parseCurrency(currencyString: string): number {
  return parseFloat(currencyString.replace(/[₱,]/g, '')) || 0
}

/**
 * Validate procedure cost data
 */
export function validateProcedureCost(procedure: TreatmentProcedure): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (procedure.quantity < 1) {
    errors.push('Quantity must be at least 1')
  }

  if (procedure.cost_per_unit < 0) {
    errors.push('Cost per unit cannot be negative')
  }

  if (!Number.isFinite(procedure.quantity)) {
    errors.push('Quantity must be a valid number')
  }

  if (!Number.isFinite(procedure.cost_per_unit)) {
    errors.push('Cost per unit must be a valid number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get cost summary statistics for a treatment
 */
export function getCostSummary(procedures: TreatmentProcedure[]) {
  const calculation = calculateTreatmentCost(procedures)

  return {
    procedureCount: procedures.length,
    totalQuantity: procedures.reduce((sum, proc) => sum + proc.quantity, 0),
    averageCostPerProcedure: procedures.length > 0
      ? calculation.total / procedures.length
      : 0,
    highestProcedureCost: Math.max(...calculation.procedures.map(p => p.line_total), 0),
    lowestProcedureCost: procedures.length > 0
      ? Math.min(...calculation.procedures.map(p => p.line_total))
      : 0,
    ...calculation
  }
}

/**
 * Calculate percentage breakdown of costs by procedure
 */
export function getCostBreakdown(procedures: TreatmentProcedure[]) {
  const calculation = calculateTreatmentCost(procedures)

  if (calculation.total === 0) {
    return []
  }

  return calculation.procedures.map(proc => ({
    procedure_id: proc.procedure_id,
    cost: proc.line_total,
    percentage: (proc.line_total / calculation.total) * 100,
    quantity: proc.quantity,
    cost_per_unit: proc.cost_per_unit
  }))
}

/**
 * Apply discount to treatment cost
 */
export function applyDiscount(
  originalCost: number,
  discount: number,
  discountType: 'percentage' | 'fixed' = 'percentage'
): {
  originalCost: number
  discountAmount: number
  finalCost: number
  discountPercentage: number
} {
  let discountAmount: number

  if (discountType === 'percentage') {
    discountAmount = originalCost * (discount / 100)
  } else {
    discountAmount = Math.min(discount, originalCost) // Fixed amount, but not more than original cost
  }

  const finalCost = Math.max(0, originalCost - discountAmount)
  const discountPercentage = originalCost > 0 ? (discountAmount / originalCost) * 100 : 0

  return {
    originalCost,
    discountAmount,
    finalCost,
    discountPercentage
  }
}

/**
 * Calculate payment progress
 */
export function calculatePaymentProgress(
  totalCost: number,
  paidAmount: number
): {
  totalCost: number
  paidAmount: number
  remainingAmount: number
  percentagePaid: number
  status: 'pending' | 'partial' | 'paid' | 'overpaid'
} {
  const remainingAmount = Math.max(0, totalCost - paidAmount)
  const percentagePaid = totalCost > 0 ? (paidAmount / totalCost) * 100 : 0

  let status: 'pending' | 'partial' | 'paid' | 'overpaid'
  if (paidAmount === 0) {
    status = 'pending'
  } else if (paidAmount < totalCost) {
    status = 'partial'
  } else if (paidAmount === totalCost) {
    status = 'paid'
  } else {
    status = 'overpaid'
  }

  return {
    totalCost,
    paidAmount,
    remainingAmount,
    percentagePaid,
    status
  }
}