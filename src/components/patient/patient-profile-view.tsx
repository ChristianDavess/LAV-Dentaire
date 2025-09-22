'use client'

import { useState, useEffect, useCallback } from 'react'
import { PatientSchema } from '@/lib/validations'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  Heart,
  FileText,
  CreditCard,
  Activity,
  Edit,
  Eye,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import Image from 'next/image'
import { EditPatientForm } from '@/components/forms/edit-patient-form'
import { MedicalHistorySection } from '@/components/forms/medical-history-section'

interface PatientProfileViewProps {
  patient: PatientSchema & {
    id: string
    patient_id: string
    created_at?: string
    updated_at?: string
  }
  trigger?: React.ReactNode
  onPatientUpdate?: (patient: any) => void
}

// Real data will be fetched from API in future phases

// Helper function to format gender for display
const formatGender = (gender: string | null | undefined): string => {
  if (!gender) return ''

  switch (gender.toLowerCase()) {
    case 'male':
      return 'Male'
    case 'female':
      return 'Female'
    case 'prefer_not_to_say':
      return 'Prefer not to say'
    default:
      return gender
  }
}

export function PatientProfileView({ patient, trigger, onPatientUpdate }: PatientProfileViewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPatient, setCurrentPatient] = useState(patient)

  const handlePatientUpdate = (updatedPatient: any) => {
    setCurrentPatient(updatedPatient)
    // Optionally refresh stats after update
    fetchPatientStats()
    // Call parent callback to refresh main patient registry
    if (onPatientUpdate) {
      onPatientUpdate(updatedPatient)
    }
  }

  const getInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    const first = firstName?.charAt(0) || 'F'
    const last = lastName?.charAt(0) || 'L'
    return `${first}${last}`.toUpperCase()
  }

  const calculateAge = (dateOfBirth: string | null | undefined) => {
    if (!dateOfBirth) return 'N/A'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default'
      case 'completed':
      case 'paid':
        return 'default'
      case 'cancelled':
        return 'destructive'
      case 'pending':
      case 'partial':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Patient statistics state
  const [stats, setStats] = useState({
    totalAmountPaid: 0,
    totalTreatments: 0,
    upcomingAppointments: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  const fetchPatientStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const response = await fetch(`/api/patients/${currentPatient.id}/stats`)

      if (response.ok) {
        const data = await response.json()
        setStats({
          totalAmountPaid: data.stats.totalAmountPaid || 0,
          totalTreatments: data.stats.totalTreatments || 0,
          upcomingAppointments: data.stats.upcomingAppointments || 0
        })
      }
    } catch (error) {
      console.error('Error fetching patient stats:', error)
      // Keep default values on error
    } finally {
      setStatsLoading(false)
    }
  }, [currentPatient.id])

  // Fetch patient statistics when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchPatientStats()
    }
  }, [isOpen, currentPatient.id, fetchPatientStats])

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Eye className="h-4 w-4" />
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary text-lg font-bold">
              {getInitials(currentPatient.first_name, currentPatient.last_name)}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                {currentPatient.first_name} {currentPatient.last_name}
              </DialogTitle>
              <div className="text-sm text-muted-foreground flex items-center gap-4">
                <span className="font-medium text-primary">{currentPatient.patient_id}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>Age: {calculateAge(currentPatient.date_of_birth)}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{formatGender(currentPatient.gender)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <EditPatientForm
                patient={{
                  ...currentPatient,
                  created_at: currentPatient.created_at || new Date().toISOString(),
                  updated_at: currentPatient.updated_at || new Date().toISOString()
                }}
                onSuccess={handlePatientUpdate}
                trigger={
                  <Button variant="outline" size="sm" className="hover:scale-[1.02] transition-all duration-300">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                }
              />
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="medical-history" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Medical History
            </TabsTrigger>
            <TabsTrigger value="treatments" className="flex items-center gap-2">
              <Image
                src="/lav-dentaire-logo.svg"
                alt="LAV Dentaire Logo"
                width={16}
                height={16}
                className="h-4 w-4"
              />
              Treatments
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Appointments
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Phone className="h-4 w-4" />
                    </div>
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentPatient.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{currentPatient.phone}</span>
                    </div>
                  )}
                  {currentPatient.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{currentPatient.email}</span>
                    </div>
                  )}
                  {currentPatient.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{currentPatient.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentPatient.emergency_contact_name ? (
                    <>
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{currentPatient.emergency_contact_name}</span>
                      </div>
                      {currentPatient.emergency_contact_phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{currentPatient.emergency_contact_phone}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No emergency contact provided</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Treatment Summary */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Activity className="h-4 w-4" />
                  </div>
                  Treatment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center space-y-2">
                      <div className="h-8 w-16 mx-auto bg-muted animate-pulse rounded"></div>
                      <div className="text-sm text-muted-foreground">Total Treatments</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="h-8 w-20 mx-auto bg-muted animate-pulse rounded"></div>
                      <div className="text-sm text-muted-foreground">Total Paid</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="h-8 w-12 mx-auto bg-muted animate-pulse rounded"></div>
                      <div className="text-sm text-muted-foreground">Upcoming Appointments</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center space-y-2">
                      <div className="text-xl font-semibold text-primary">{stats.totalTreatments}</div>
                      <div className="text-sm text-muted-foreground">Total Treatments</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-xl font-semibold text-primary">₱{stats.totalAmountPaid.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">Total Paid</div>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-xl font-semibold text-primary">{stats.upcomingAppointments}</div>
                      <div className="text-sm text-muted-foreground">Upcoming Appointments</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical History Tab */}
          <TabsContent value="medical-history" className="space-y-6">
            <MedicalHistorySection
              medicalHistory={currentPatient.medical_history || {}}
              onMedicalHistoryChange={() => {}} // Read-only view
              title="Medical History"
              description="Patient's medical history and health conditions"
              readOnly={true}
            />

            {currentPatient.notes && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                    {currentPatient.notes}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Treatments Tab */}
          <TabsContent value="treatments" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Image
                        src="/lav-dentaire-logo.svg"
                        alt="LAV Dentaire Logo"
                        width={16}
                        height={16}
                        className="h-4 w-4"
                      />
                    </div>
                    Treatment History
                  </div>
                  <Button size="sm" className="hover:scale-[1.02] transition-all duration-300">
                    <FileText className="mr-2 h-4 w-4" />
                    New Treatment
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30">
                      <Image
                        src="/lav-dentaire-logo.svg"
                        alt="LAV Dentaire Logo"
                        width={40}
                        height={40}
                        className="h-10 w-10 text-muted-foreground"
                      />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight mb-2">No treatments found</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Treatment records will appear here once they are added to the system
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-4 w-4" />
                    </div>
                    Appointment History
                  </div>
                  <Button size="sm" className="hover:scale-[1.02] transition-all duration-300">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Appointment
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30">
                      <Calendar className="h-10 w-10 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight mb-2">No appointments found</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Appointment records will appear here once they are scheduled
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}