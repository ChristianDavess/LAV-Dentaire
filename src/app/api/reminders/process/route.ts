import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { format, addHours, subHours, isAfter, isBefore } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

interface ReminderConfig {
  id: string
  reminder_type: string
  hours_before: number
  is_enabled: boolean
  email_template_subject: string
  email_template_body: string
}

interface AppointmentForReminder {
  id: string
  patient_id: string
  appointment_date: string
  appointment_time: string
  duration_minutes: number
  reason?: string
  notes?: string
  reminder_24h_sent_at?: string
  reminder_day_of_sent_at?: string
  reminder_count: number
  reminder_status: string
  patients: {
    first_name: string
    last_name: string
    email?: string
    patient_id: string
  }
}

// Helper function to replace template variables
function replaceTemplateVariables(template: string, appointment: AppointmentForReminder): string {
  const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)

  return template
    .replace(/\{\{patient_name\}\}/g, `${appointment.patients.first_name} ${appointment.patients.last_name}`)
    .replace(/\{\{appointment_date\}\}/g, format(appointmentDateTime, 'EEEE, MMMM dd, yyyy'))
    .replace(/\{\{appointment_time\}\}/g, format(appointmentDateTime, 'h:mm a'))
    .replace(/\{\{duration\}\}/g, appointment.duration_minutes.toString())
    .replace(/\{\{reason\}\}/g, appointment.reason || 'General consultation')
    .replace(/\{\{patient_id\}\}/g, appointment.patients.patient_id)
}

// Helper function to send reminder email
async function sendReminderEmail(
  appointment: AppointmentForReminder,
  config: ReminderConfig,
  supabase: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!appointment.patients.email) {
    return { success: false, error: 'Patient has no email address' }
  }

  try {
    const subject = replaceTemplateVariables(config.email_template_subject, appointment)
    const htmlContent = replaceTemplateVariables(config.email_template_body, appointment)
      .replace(/\n/g, '<br>')

    const { data, error } = await resend.emails.send({
      from: `LAV Dentaire <${process.env.FROM_EMAIL}>`,
      to: [appointment.patients.email],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">LAV Dentaire</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Professional Dental Care</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
              ${htmlContent}
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #495057;">Need to make changes?</h3>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">
                  Please contact us at least 24 hours in advance to reschedule or cancel your appointment.
                </p>
              </div>
              <div style="text-align: center;">
                <a href="tel:+15551234567" style="display: inline-block; background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 10px 10px 0;">
                  📞 Call Clinic
                </a>
                <a href="mailto:appointments@lavdentaire.com" style="display: inline-block; background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 0 0 10px 0;">
                  📧 Email Us
                </a>
              </div>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
            <p style="margin: 0;">
              LAV Dentaire • Professional Dental Care<br>
              📍 123 Dental Street, Dental City, DC 12345<br>
              📞 (555) 123-4567 • 📧 info@lavdentaire.com
            </p>
          </div>
        </div>
      `,
      text: replaceTemplateVariables(config.email_template_body, appointment)
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    // Log the reminder send
    await supabase.from('reminder_logs').insert({
      appointment_id: appointment.id,
      reminder_type: config.reminder_type,
      status: 'sent',
      email_address: appointment.patients.email,
      resend_message_id: data?.id
    })

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Error sending reminder email:', error)

    // Log the failure
    await supabase.from('reminder_logs').insert({
      appointment_id: appointment.id,
      reminder_type: config.reminder_type,
      status: 'failed',
      email_address: appointment.patients.email,
      error_message: error instanceof Error ? error.message : 'Unknown error'
    })

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Main reminder processing function
export async function POST(request: NextRequest) {
  try {
    // Check for API key or cron authentication
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')

    if (!authHeader && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const now = new Date()
    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    }

    // Get active reminder configurations
    const { data: configs, error: configError } = await supabase
      .from('reminder_config')
      .select('*')
      .eq('is_enabled', true)
      .order('hours_before', { ascending: false })

    if (configError) {
      console.error('Error fetching reminder config:', configError)
      return NextResponse.json({ error: 'Failed to fetch reminder configuration' }, { status: 500 })
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json({
        message: 'No active reminder configurations found',
        results
      })
    }

    // Process each reminder type
    for (const config of configs) {
      console.log(`Processing ${config.reminder_type} reminders (${config.hours_before}h before)`)

      // Calculate the target time window for this reminder type
      const targetStart = addHours(now, config.hours_before - 1) // 1 hour window
      const targetEnd = addHours(now, config.hours_before)

      // Find appointments that need this type of reminder
      const { data: appointments, error: appointmentError } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          appointment_date,
          appointment_time,
          duration_minutes,
          reason,
          notes,
          reminder_24h_sent_at,
          reminder_day_of_sent_at,
          reminder_count,
          reminder_status,
          patients:patient_id (
            first_name,
            last_name,
            email,
            patient_id
          )
        `)
        .eq('status', 'scheduled')
        .gte('appointment_date', format(targetStart, 'yyyy-MM-dd'))
        .lte('appointment_date', format(targetEnd, 'yyyy-MM-dd'))
        .in('reminder_status', ['pending', 'sent']) // Include sent to handle multiple reminder types
        .not('patients.email', 'is', null)

      if (appointmentError) {
        console.error('Error fetching appointments:', appointmentError)
        results.errors.push(`Failed to fetch appointments for ${config.reminder_type}`)
        continue
      }

      if (!appointments || appointments.length === 0) {
        console.log(`No appointments found for ${config.reminder_type} reminders`)
        continue
      }

      // Filter appointments that need this specific reminder type
      for (const appointment of appointments as unknown as AppointmentForReminder[]) {
        results.processed++

        try {
          const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
          const reminderSendTime = subHours(appointmentDateTime, config.hours_before)

          // Check if it's time to send this reminder
          if (isAfter(now, reminderSendTime) && isBefore(now, addHours(reminderSendTime, 2))) {
            // Check if this specific reminder type has already been sent
            const alreadySent = (config.reminder_type === '24_hour' && appointment.reminder_24h_sent_at) ||
                             (config.reminder_type === 'day_of' && appointment.reminder_day_of_sent_at)

            if (alreadySent) {
              results.skipped++
              continue
            }

            // Send the reminder
            const result = await sendReminderEmail(appointment, config, supabase)

            if (result.success) {
              // Update appointment with reminder sent timestamp
              const updateField = config.reminder_type === '24_hour'
                ? 'reminder_24h_sent_at'
                : 'reminder_day_of_sent_at'

              await supabase
                .from('appointments')
                .update({
                  [updateField]: now.toISOString(),
                  reminder_count: appointment.reminder_count + 1,
                  reminder_status: 'sent'
                })
                .eq('id', appointment.id)

              results.sent++
              console.log(`✅ Sent ${config.reminder_type} reminder to ${appointment.patients.email}`)
            } else {
              results.failed++
              results.errors.push(`Failed to send ${config.reminder_type} reminder to ${appointment.patients.first_name} ${appointment.patients.last_name}: ${result.error}`)
              console.error(`❌ Failed to send reminder: ${result.error}`)
            }
          } else {
            results.skipped++
          }
        } catch (error) {
          results.failed++
          results.errors.push(`Error processing appointment ${appointment.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          console.error('Error processing appointment:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder processing completed',
      results,
      processedAt: now.toISOString()
    })

  } catch (error) {
    console.error('Error in reminder processing:', error)
    return NextResponse.json(
      { error: 'Internal server error during reminder processing' },
      { status: 500 }
    )
  }
}

// GET endpoint for manual testing and status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const now = new Date()

    // Get upcoming appointments that need reminders
    const { data: upcomingAppointments } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        reminder_24h_sent_at,
        reminder_day_of_sent_at,
        reminder_status,
        patients:patient_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('status', 'scheduled')
      .gte('appointment_date', format(now, 'yyyy-MM-dd'))
      .lte('appointment_date', format(addHours(now, 48), 'yyyy-MM-dd'))
      .limit(10)

    // Get recent reminder logs
    const { data: recentLogs } = await supabase
      .from('reminder_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      status: 'Reminder system operational',
      currentTime: now.toISOString(),
      upcomingAppointments: upcomingAppointments?.length || 0,
      recentLogs: recentLogs?.length || 0,
      emailConfigured: !!process.env.RESEND_API_KEY
    })

  } catch (error) {
    console.error('Error in reminder status check:', error)
    return NextResponse.json(
      { error: 'Failed to check reminder system status' },
      { status: 500 }
    )
  }
}