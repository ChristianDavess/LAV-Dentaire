'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { PatientRegistrationForm } from '@/components/forms/patient-registration-form'
import { EditPatientForm } from '@/components/forms/edit-patient-form'
import { DeletePatientDialog } from '@/components/forms/delete-patient-dialog'
import { PatientProfileView } from '@/components/patient/patient-profile-view'
import { QRGenerator } from '@/components/qr'
import {
  Users,
  Plus,
  Search,
  Filter,
  UserPlus,
  Download,
  Calendar,
  Phone,
  Mail,
  MapPin,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Activity,
  QrCode,
  RefreshCw
} from 'lucide-react'

// Patient interface - matches database schema
interface Patient {
  id: string
  patient_id: string
  first_name: string
  last_name: string
  middle_name: string | null
  email: string | null
  phone: string | null
  date_of_birth: string | null
  gender: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  medical_history: Record<string, any>
  notes: string | null
  registration_source: string | null
  created_at: string
  updated_at: string
}

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

// Helper function to get patient contact status badge
const getContactStatusBadge = (patient: Patient) => {
  const hasEmail = !!patient.email
  const hasPhone = !!patient.phone

  if (hasEmail && hasPhone) {
    return { variant: 'default' as const, text: 'Complete', icon: '✓' }
  } else if (hasEmail || hasPhone) {
    return { variant: 'secondary' as const, text: 'Partial', icon: '◐' }
  } else {
    return { variant: 'destructive' as const, text: 'Missing', icon: '!' }
  }
}

// Helper function to check if patient is recently registered
const isRecentlyRegistered = (patient: Patient): boolean => {
  const registrationDate = new Date(patient.created_at)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return registrationDate >= thirtyDaysAgo
}

// Fetch patients from API
async function fetchPatients(): Promise<Patient[]> {
  try {
    console.log('🌐 Making API call to /api/patients')
    const response = await fetch('/api/patients', {
      credentials: 'include'
    })
    console.log('🌐 API response status:', response.status)
    if (!response.ok) {
      throw new Error('Failed to fetch patients')
    }
    const data = await response.json()
    console.log('🌐 API returned patients count:', data.data?.patients?.length || 0)
    return data.data?.patients || []
  } catch (error) {
    console.error('❌ Error fetching patients:', error)
    return []
  }
}

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [registrationFilter, setRegistrationFilter] = useState('all')
  const [contactFilter, setContactFilter] = useState('all')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const patientsPerPage = 5

  // Load patients on component mount
  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true)
      const fetchedPatients = await fetchPatients()
      setPatients(fetchedPatients)
      setLoading(false)
    }
    loadPatients()
  }, [])

  // Function to refresh patients list
  const refreshPatients = async () => {
    console.log('🔄 refreshPatients called - starting fetch')
    try {
      const fetchedPatients = await fetchPatients()
      console.log('📋 Fetched patients count:', fetchedPatients.length)
      console.log('📋 First patient data:', fetchedPatients[0])
      setPatients(fetchedPatients)
      console.log('✅ Patient state updated successfully')
    } catch (error) {
      console.error('❌ Error in refreshPatients:', error)
    }
  }

  // Function to export patient data to CSV
  const exportPatients = async () => {
    setExporting(true)
    try {
      // Use filtered patients (respects current search and filter criteria)
      const dataToExport = filteredPatients

      // CSV headers
      const headers = [
        'Patient ID',
        'First Name',
        'Last Name',
        'Middle Name',
        'Email',
        'Phone',
        'Date of Birth',
        'Gender',
        'Address',
        'Emergency Contact Name',
        'Emergency Contact Phone',
        'Registration Date',
        'Notes'
      ]

      // Convert data to CSV format
      const csvContent = [headers]
        .concat(
          dataToExport.map(patient => [
            patient.patient_id || '',
            patient.first_name || '',
            patient.last_name || '',
            patient.middle_name || '',
            patient.email || '',
            patient.phone || '',
            patient.date_of_birth || '',
            formatGender(patient.gender) || '',
            patient.address || '',
            patient.emergency_contact_name || '',
            patient.emergency_contact_phone || '',
            new Date(patient.created_at).toLocaleDateString() || '',
            (patient.notes || '').replace(/[\r\n]+/g, ' ').replace(/"/g, '""') // Escape quotes and newlines
          ])
        )
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)

        // Generate filename with current date and filter info
        const currentDate = new Date().toISOString().split('T')[0]
        let filename = `patients_${currentDate}`

        if (searchTerm) {
          filename += `_search-${searchTerm.replace(/[^a-zA-Z0-9]/g, '')}`
        }
        if (registrationFilter !== 'all') {
          filename += `_${registrationFilter}`
        }
        if (contactFilter !== 'all') {
          filename += `_${contactFilter}`
        }

        link.setAttribute('download', `${filename}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        console.log(`✅ Exported ${dataToExport.length} patients to ${filename}.csv`)
      }
    } catch (error) {
      console.error('❌ Error exporting patients:', error)
      // In a real app, you might want to show a toast notification here
    } finally {
      setExporting(false)
    }
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = `${patient.first_name} ${patient.last_name} ${patient.patient_id}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())

    // Registration date filtering
    const registrationDate = new Date(patient.created_at)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    let matchesRegistration = true
    if (registrationFilter === 'recent') {
      matchesRegistration = registrationDate >= thirtyDaysAgo
    } else if (registrationFilter === 'this_year') {
      matchesRegistration = registrationDate >= startOfYear
    }

    // Contact completeness filtering
    const hasEmail = !!patient.email
    const hasPhone = !!patient.phone
    let matchesContact = true

    if (contactFilter === 'complete') {
      matchesContact = hasEmail && hasPhone
    } else if (contactFilter === 'partial') {
      matchesContact = (hasEmail || hasPhone) && !(hasEmail && hasPhone)
    } else if (contactFilter === 'missing') {
      matchesContact = !hasEmail && !hasPhone
    }

    return matchesSearch && matchesRegistration && matchesContact
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage)
  const startIndex = (currentPage - 1) * patientsPerPage
  const endIndex = startIndex + patientsPerPage
  const paginatedPatients = filteredPatients.slice(startIndex, endIndex)

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, registrationFilter, contactFilter])

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Patients</h2>
            <p className="text-sm text-muted-foreground">
              Manage patient records, medical history, and appointments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={exportPatients}
                    disabled={exporting || loading}
                  >
                    <Download className={`h-4 w-4 ${exporting ? 'animate-bounce' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{exporting ? 'Exporting...' : `Export ${filteredPatients.length} patients to CSV`}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <QRGenerator onSuccess={refreshPatients} />
            <PatientRegistrationForm onSuccess={refreshPatients} />
          </div>
        </div>

        {/* Search and Filter Controls */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={registrationFilter} onValueChange={setRegistrationFilter}>
                  <SelectTrigger className="w-44">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Registration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Patients</SelectItem>
                    <SelectItem value="recent">Recent (30 days)</SelectItem>
                    <SelectItem value="this_year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={contactFilter} onValueChange={setContactFilter}>
                  <SelectTrigger className="w-40">
                    <Phone className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Contact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contact</SelectItem>
                    <SelectItem value="complete">Complete Info</SelectItem>
                    <SelectItem value="partial">Partial Info</SelectItem>
                    <SelectItem value="missing">Missing Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {filteredPatients.length} patients {totalPages > 1 && `(Page ${currentPage} of ${totalPages})`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  Patient Registry
                </CardTitle>
                <CardDescription>
                  Complete list of registered patients with their basic information
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPatients}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {paginatedPatients.length === 0 ? (
              // Empty State
              <div className="text-center py-12">
                <div className="flex justify-center mb-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold tracking-tight mb-2">No patients found</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first patient to the system'}
                </p>
                {!searchTerm && (
                  <PatientRegistrationForm
                    trigger={
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add First Patient
                      </Button>
                    }
                    onSuccess={refreshPatients}
                  />
                )}
              </div>
            ) : (
              // Patients Table
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      // Loading skeleton rows
                      Array.from({ length: 3 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                              <div className="space-y-2">
                                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                              <div className="h-3 w-28 bg-muted rounded animate-pulse" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                              <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
                          </TableCell>
                          <TableCell>
                            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      paginatedPatients.map((patient) => (
                        <TableRow key={patient.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {patient.first_name[0]}{patient.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {patient.first_name} {patient.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {patient.patient_id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {patient.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span>{patient.email}</span>
                              </div>
                            )}
                            {patient.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{patient.phone}</span>
                              </div>
                            )}
                            {!patient.email && !patient.phone && (
                              <span className="text-sm text-muted-foreground">No contact info</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {patient.date_of_birth && (
                              <div>Age: {new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()}</div>
                            )}
                            {patient.gender && (
                              <div className="text-muted-foreground">{formatGender(patient.gender)}</div>
                            )}
                            {!patient.date_of_birth && !patient.gender && (
                              <span className="text-muted-foreground">No details</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const contactStatus = getContactStatusBadge(patient)
                              return (
                                <Badge variant={contactStatus.variant} className="text-xs">
                                  {contactStatus.icon} {contactStatus.text}
                                </Badge>
                              )
                            })()}
                            {isRecentlyRegistered(patient) && (
                              <Badge variant="outline" className="text-xs">
                                New
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{new Date(patient.created_at).toLocaleDateString()}</div>
                            <div className="text-muted-foreground">Registered</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <PatientProfileView
                                patient={patient}
                                onPatientUpdate={refreshPatients}
                                trigger={
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                }
                              />
                              <EditPatientForm
                                patient={patient}
                                trigger={
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Patient
                                  </DropdownMenuItem>
                                }
                                onSuccess={refreshPatients}
                              />
                              <DeletePatientDialog
                                patient={patient}
                                trigger={
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Patient
                                  </DropdownMenuItem>
                                }
                                onSuccess={refreshPatients}
                              />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}