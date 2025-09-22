'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Stethoscope, FileText, Loader2 } from 'lucide-react'
import { ProcedureList } from '@/components/procedures'
import { TreatmentForm, TreatmentList, TreatmentDetails, TreatmentInvoice } from '@/components/treatments'
import { useToast } from '@/hooks/use-toast'
import { TreatmentWithDetails } from '@/types/database'

type Treatment = TreatmentWithDetails

export default function TreatmentsPage() {
  const [activeTab, setActiveTab] = useState('treatments')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isNewTreatmentOpen, setIsNewTreatmentOpen] = useState(false)
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null)
  const [viewingTreatment, setViewingTreatment] = useState<Treatment | null>(null)
  const [invoiceTreatment, setInvoiceTreatment] = useState<Treatment | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleTreatmentCreate = async (treatmentData: any) => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/treatments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(treatmentData),
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMessage = 'Failed to create treatment'
        if (data.error) {
          errorMessage = data.error
        } else if (data.details && Array.isArray(data.details)) {
          errorMessage = data.details.map((detail: any) => detail.message).join(', ')
        }
        throw new Error(errorMessage)
      }

      toast({
        title: 'Success',
        description: 'Treatment created successfully',
      })

      setIsNewTreatmentOpen(false)
      refreshData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create treatment',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleTreatmentEdit = async (treatmentId: string, treatmentData: any) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/treatments/${treatmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(treatmentData),
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMessage = 'Failed to update treatment'
        if (data.error) {
          errorMessage = data.error
        } else if (data.details && Array.isArray(data.details)) {
          errorMessage = data.details.map((detail: any) => detail.message).join(', ')
        }
        throw new Error(errorMessage)
      }

      toast({
        title: 'Success',
        description: 'Treatment updated successfully',
      })

      setEditingTreatment(null)
      refreshData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update treatment',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEditTreatment = (treatment: Treatment) => {
    setEditingTreatment(treatment)
  }

  const handleViewDetails = (treatment: Treatment) => {
    setViewingTreatment(treatment)
  }

  const handleGenerateInvoice = (treatment: Treatment) => {
    setInvoiceTreatment(treatment)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold mb-2">Treatments & Procedures</h1>
          <p className="text-muted-foreground">Comprehensive treatment and procedure management</p>
        </div>
        <Dialog open={isNewTreatmentOpen} onOpenChange={setIsNewTreatmentOpen}>
          <Button
            onClick={() => setIsNewTreatmentOpen(true)}
            disabled={isCreating}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isCreating ? 'Creating...' : 'New Treatment'}
          </Button>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Treatment</DialogTitle>
              <DialogDescription>
                Record a new treatment with procedures for a patient
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto">
              <TreatmentForm
                onSubmit={handleTreatmentCreate}
                onCancel={() => setIsNewTreatmentOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="treatments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Treatments
          </TabsTrigger>
          <TabsTrigger value="procedures" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Procedures
          </TabsTrigger>
        </TabsList>

        <TabsContent value="treatments" className="space-y-6">
          <TreatmentList
            onEdit={handleEditTreatment}
            onViewDetails={handleViewDetails}
            onGenerateInvoice={handleGenerateInvoice}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="procedures" className="space-y-6">
          <ProcedureList />
        </TabsContent>
      </Tabs>

      {/* Edit Treatment Dialog */}
      <Dialog
        open={!!editingTreatment}
        onOpenChange={(open) => !open && setEditingTreatment(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Treatment</DialogTitle>
            <DialogDescription>
              Update treatment details for {editingTreatment?.patient?.first_name} {editingTreatment?.patient?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {editingTreatment && (
              <TreatmentForm
                treatment={editingTreatment}
                onSubmit={(data) => handleTreatmentEdit(editingTreatment.id, data)}
                onCancel={() => setEditingTreatment(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Treatment Details Dialog */}
      <TreatmentDetails
        treatment={viewingTreatment}
        open={!!viewingTreatment}
        onOpenChange={(open) => !open && setViewingTreatment(null)}
        onEdit={handleEditTreatment}
        onGenerateInvoice={handleGenerateInvoice}
      />

      {/* Invoice Dialog */}
      <TreatmentInvoice
        treatment={invoiceTreatment}
        open={!!invoiceTreatment}
        onOpenChange={(open) => !open && setInvoiceTreatment(null)}
      />
    </div>
  )
}