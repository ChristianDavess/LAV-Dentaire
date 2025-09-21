import { useMemo } from 'react'
import {
  calculateTreatmentCost,
  getCostSummary,
  getCostBreakdown,
  type TreatmentProcedure
} from '@/lib/utils/cost-calculations'

/**
 * Custom hook for real-time treatment cost calculations
 */
export function useTreatmentCalculations(procedures: TreatmentProcedure[]) {
  const calculations = useMemo(() => {
    if (!procedures || procedures.length === 0) {
      return {
        cost: {
          subtotal: 0,
          total: 0,
          procedures: []
        },
        summary: {
          procedureCount: 0,
          totalQuantity: 0,
          averageCostPerProcedure: 0,
          highestProcedureCost: 0,
          lowestProcedureCost: 0,
          subtotal: 0,
          total: 0,
          procedures: []
        },
        breakdown: []
      }
    }

    const cost = calculateTreatmentCost(procedures)
    const summary = getCostSummary(procedures)
    const breakdown = getCostBreakdown(procedures)

    return {
      cost,
      summary,
      breakdown
    }
  }, [procedures])

  return calculations
}

/**
 * Hook for individual procedure cost calculation
 */
export function useProcedureCost(quantity: number, costPerUnit: number) {
  return useMemo(() => {
    const total = quantity * costPerUnit

    return {
      quantity,
      costPerUnit,
      total,
      isValid: quantity >= 1 && costPerUnit >= 0 && Number.isFinite(total)
    }
  }, [quantity, costPerUnit])
}

/**
 * Hook for payment calculations
 */
export function usePaymentCalculations(totalCost: number, paidAmount: number = 0) {
  return useMemo(() => {
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
      status,
      isFullyPaid: status === 'paid',
      isOverpaid: status === 'overpaid',
      isPartiallyPaid: status === 'partial',
      isPending: status === 'pending'
    }
  }, [totalCost, paidAmount])
}