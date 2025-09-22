'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Calendar, List, Loader2 } from 'lucide-react'
import { AppointmentCalendar, AppointmentList } from '@/components/appointments'
import AppointmentForm from '@/components/forms/appointment-form'
import { useToast } from '@/hooks/use-toast'
import { Patient, Appointment } from '@/types'

interface AppointmentWithPatient extends Appointment {
  patients: Patient
}

export default function AppointmentsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [activeTab, setActiveTab] = useState('list')
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithPatient | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const { toast } = useToast()

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleAppointmentCreate = async (appointmentData: any) => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create appointment')
      }

      toast({
        title: 'Success',
        description: 'Appointment created successfully',
      })

      setIsNewAppointmentOpen(false)
      refreshData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create appointment',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleAppointmentEdit = async (appointmentId: string, appointmentData: any) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update appointment')
      }

      toast({
        title: 'Success',
        description: 'Appointment updated successfully',
      })

      setEditingAppointment(null)
      refreshData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update appointment',
        variant: 'destructive',
      })
    }
  }

  const handleStatusChange = async (appointmentId: string, status: Appointment['status']) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update appointment status')
      }

      toast({
        title: 'Success',
        description: `Appointment marked as ${status}`,
      })

      refreshData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update appointment status',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel appointment')
      }

      toast({
        title: 'Success',
        description: 'Appointment cancelled successfully',
      })

      refreshData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel appointment',
        variant: 'destructive',
      })
    }
  }

  const handleAppointmentClick = (appointment: AppointmentWithPatient) => {
    setEditingAppointment(appointment)
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold mb-2">Appointments</h1>
          <p className="text-muted-foreground">Schedule and manage patient appointments</p>
        </div>
        <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
          <DialogTrigger asChild>
            <Button disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {isCreating ? 'Creating...' : 'New Appointment'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Create a new appointment for a patient
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-6 -mr-6">
              <AppointmentForm
                onSubmit={handleAppointmentCreate}
                onCancel={() => setIsNewAppointmentOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <AppointmentCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onAppointmentClick={handleAppointmentClick}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          <AppointmentList
            onEdit={setEditingAppointment}
            onStatusChange={handleStatusChange}
            onCancel={handleCancel}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Appointment Dialog */}
      <Dialog open={!!editingAppointment} onOpenChange={() => setEditingAppointment(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Update appointment details for {editingAppointment?.patients.first_name} {editingAppointment?.patients.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-6 -mr-6">
            {editingAppointment && (
              <AppointmentForm
                appointment={editingAppointment}
                onSubmit={(data) => handleAppointmentEdit(editingAppointment.id, data)}
                onCancel={() => setEditingAppointment(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}