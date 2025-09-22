'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Mail,
  Clock,
  Settings,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  Edit,
  TestTube
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const reminderConfigSchema = z.object({
  reminder_type: z.enum(['24_hour', 'day_of', 'custom']),
  hours_before: z.number().min(1).max(168),
  is_enabled: z.boolean(),
  email_template_subject: z.string().min(1).max(200),
  email_template_body: z.string().min(10).max(5000)
})

const testReminderSchema = z.object({
  appointment_id: z.string().min(1, 'Please select an appointment'),
  reminder_type: z.enum(['24_hour', 'day_of', 'custom']),
  test_email: z.string().email().optional()
})

type ReminderConfigFormData = z.infer<typeof reminderConfigSchema>
type TestReminderFormData = z.infer<typeof testReminderSchema>

interface ReminderConfig {
  id: string
  reminder_type: string
  hours_before: number
  is_enabled: boolean
  email_template_subject: string
  email_template_body: string
  created_at: string
  updated_at: string
}

interface ReminderStats {
  total_sent: number
  total_failed: number
  by_type: {
    '24_hour': number
    'day_of': number
  }
}

interface Appointment {
  id: string
  appointment_date: string
  appointment_time: string
  patients: {
    first_name: string
    last_name: string
    email?: string
  }
}

export default function ReminderSettings() {
  const [configs, setConfigs] = useState<ReminderConfig[]>([])
  const [statistics, setStatistics] = useState<ReminderStats | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingConfig, setEditingConfig] = useState<ReminderConfig | null>(null)
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false)
  const [emailConfigured, setEmailConfigured] = useState(false)
  const { toast } = useToast()

  const editForm = useForm<ReminderConfigFormData>({
    resolver: zodResolver(reminderConfigSchema)
  })

  const testForm = useForm<TestReminderFormData>({
    resolver: zodResolver(testReminderSchema)
  })

  useEffect(() => {
    fetchConfigs()
    fetchUpcomingAppointments()
  }, [])

  const fetchConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reminders/config', {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in to access reminder settings.')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch reminder configurations')
      }

      const data = await response.json()
      setConfigs(data.configs || [])
      setStatistics(data.statistics)
      setEmailConfigured(data.emailConfigured)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load reminder settings'
      setError(errorMessage)
      console.error('Error fetching reminder configs:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUpcomingAppointments = async () => {
    try {
      const response = await fetch('/api/appointments?limit=20&status=scheduled', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      }
    } catch (err) {
      console.error('Error fetching appointments:', err)
    }
  }

  const handleEditConfig = (config: ReminderConfig) => {
    setEditingConfig(config)
    editForm.reset({
      reminder_type: config.reminder_type as any,
      hours_before: config.hours_before,
      is_enabled: config.is_enabled,
      email_template_subject: config.email_template_subject,
      email_template_body: config.email_template_body
    })
  }

  const handleSaveConfig = async (data: ReminderConfigFormData) => {
    if (!editingConfig) return

    setSaving(true)
    try {
      const response = await fetch(`/api/reminders/config?id=${editingConfig.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update configuration')
      }

      toast({
        title: 'Success',
        description: 'Reminder configuration updated successfully'
      })

      setEditingConfig(null)
      fetchConfigs()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update configuration',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestReminder = async (data: TestReminderFormData) => {
    setTesting(true)
    try {
      const response = await fetch('/api/reminders/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'test_reminder',
          ...data
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send test reminder')
      }

      const result = await response.json()

      toast({
        title: 'Test Reminder Sent',
        description: `Test email sent successfully to ${result.sentTo}`
      })

      setIsTestDialogOpen(false)
      testForm.reset()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to send test reminder',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case '24_hour': return '24 Hours Before'
      case 'day_of': return 'Day of Appointment'
      case 'custom': return 'Custom Timing'
      default: return type
    }
  }

  const getStatusBadge = (isEnabled: boolean) => {
    return (
      <Badge variant={isEnabled ? 'default' : 'secondary'}>
        {isEnabled ? (
          <>
            <CheckCircle className="h-4 w-4 mr-1" />
            Enabled
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 mr-1" />
            Disabled
          </>
        )}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <Mail className="h-4 w-4" />
            Appointment Reminders
          </CardTitle>
          <CardDescription>Loading reminder settings...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <Mail className="h-4 w-4" />
            Appointment Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 flex gap-2">
            {error.includes('Authentication required') && (
              <Button onClick={() => window.location.href = '/login'} variant="outline">
                Go to Login
              </Button>
            )}
            <Button onClick={fetchConfigs} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Email Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-base font-semibold">
            <Mail className="h-4 w-4" />
            Email Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Resend Email Service
              </p>
              <p className="text-sm text-muted-foreground">
                Required for sending appointment reminders
              </p>
            </div>
            <Badge variant={emailConfigured ? 'default' : 'destructive'}>
              {emailConfigured ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Configured
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1" />
                  Not Configured
                </>
              )}
            </Badge>
          </div>
          {!emailConfigured && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Email service is not configured. Please add your RESEND_API_KEY to environment variables to enable reminder emails.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base font-semibold">
              <Settings className="h-4 w-4" />
              Reminder Statistics (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-semibold text-primary">{statistics.total_sent}</div>
                <div className="text-sm text-muted-foreground">Sent Successfully</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-destructive">{statistics.total_failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-primary">{statistics.by_type['24_hour']}</div>
                <div className="text-sm text-muted-foreground">24h Reminders</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold text-primary">{statistics.by_type.day_of}</div>
                <div className="text-sm text-muted-foreground">Day-of Reminders</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reminder Configurations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-base font-semibold">
                <Clock className="h-4 w-4" />
                Reminder Configurations
              </CardTitle>
              <CardDescription>
                Manage when and how appointment reminders are sent
              </CardDescription>
            </div>
            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!emailConfigured || appointments.length === 0}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Reminder
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-lg font-semibold">Test Reminder Email</DialogTitle>
                  <DialogDescription>
                    Send a test reminder email to verify your configuration
                  </DialogDescription>
                </DialogHeader>
                <Form {...testForm}>
                  <form onSubmit={testForm.handleSubmit(handleTestReminder)} className="space-y-4">
                    <FormField
                      control={testForm.control}
                      name="appointment_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Appointment</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an upcoming appointment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {appointments.map((appointment) => (
                                <SelectItem key={appointment.id} value={appointment.id}>
                                  {appointment.patients.first_name} {appointment.patients.last_name} - {appointment.appointment_date}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={testForm.control}
                      name="reminder_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reminder Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select reminder type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="24_hour">24 Hours Before</SelectItem>
                              <SelectItem value="day_of">Day of Appointment</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={testForm.control}
                      name="test_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Test Email (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="test@example.com (leave empty to use patient email)"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            If empty, will use the patient's email address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsTestDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={testing}>
                        {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {testing ? 'Sending...' : 'Send Test Email'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {configs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold">{getReminderTypeLabel(config.reminder_type)}</h4>
                    {getStatusBadge(config.is_enabled)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sends {config.hours_before} hours before appointment
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Subject: {config.email_template_subject}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditConfig(config)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Configuration Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Edit {editingConfig ? getReminderTypeLabel(editingConfig.reminder_type) : ''} Configuration
            </DialogTitle>
            <DialogDescription>
              Customize the reminder timing and email template
            </DialogDescription>
          </DialogHeader>
          {editingConfig && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleSaveConfig)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="hours_before"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours Before Appointment</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={168}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          1 hour to 7 days (168 hours)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="is_enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Enable Reminder</FormLabel>
                          <FormDescription>
                            Send this type of reminder
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="email_template_subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Email subject line..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Use {`{{patient_name}}`}, {`{{appointment_date}}`}, {`{{appointment_time}}`} for dynamic content
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="email_template_body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Template</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Email content..."
                          className="min-h-[200px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Available variables: {`{{patient_name}}`}, {`{{appointment_date}}`}, {`{{appointment_time}}`}, {`{{duration}}`}, {`{{reason}}`}, {`{{patient_id}}`}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingConfig(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}