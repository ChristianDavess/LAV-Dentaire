import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-local'
import { z } from 'zod'

const reminderConfigSchema = z.object({
  reminder_type: z.enum(['24_hour', 'day_of', 'custom']),
  hours_before: z.number().min(1).max(168), // 1 hour to 7 days
  is_enabled: z.boolean(),
  email_template_subject: z.string().min(1).max(200),
  email_template_body: z.string().min(10).max(5000)
})

const testReminderSchema = z.object({
  appointment_id: z.string().uuid(),
  reminder_type: z.enum(['24_hour', 'day_of', 'custom']),
  test_email: z.string().email().optional()
})

// GET /api/reminders/config - Get all reminder configurations
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 })
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: configs, error } = await supabase
      .from('reminder_config')
      .select('*')
      .order('hours_before', { ascending: true })

    if (error) {
      console.error('Error fetching reminder configs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reminder configurations' },
        { status: 500 }
      )
    }

    // Get reminder statistics
    const { data: stats } = await supabase
      .from('reminder_logs')
      .select('status, reminder_type')
      .gte('sent_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    const statistics = {
      total_sent: stats?.filter(s => s.status === 'sent').length || 0,
      total_failed: stats?.filter(s => s.status === 'failed').length || 0,
      by_type: {
        '24_hour': stats?.filter(s => s.reminder_type === '24_hour' && s.status === 'sent').length || 0,
        'day_of': stats?.filter(s => s.reminder_type === 'day_of' && s.status === 'sent').length || 0
      }
    }

    return NextResponse.json({
      configs,
      statistics,
      emailConfigured: !!process.env.RESEND_API_KEY
    })

  } catch (error) {
    console.error('Error in GET /api/reminders/config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/reminders/config/[id] - Update reminder configuration
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 })
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const configId = searchParams.get('id')

    if (!configId) {
      return NextResponse.json({ error: 'Configuration ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = reminderConfigSchema.parse(body)

    const supabase = await createClient()

    const { data: config, error } = await supabase
      .from('reminder_config')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', configId)
      .select()
      .single()

    if (error) {
      console.error('Error updating reminder config:', error)
      return NextResponse.json(
        { error: 'Failed to update reminder configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      config,
      message: 'Reminder configuration updated successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/reminders/config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reminders/config - Create new reminder configuration
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'No authentication token' }, { status: 401 })
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const body = await request.json()

    // Handle special POST actions
    if (body.action === 'test_reminder') {
      return await handleTestReminder(body, user)
    }

    // Create new reminder configuration
    const validatedData = reminderConfigSchema.parse(body)

    const supabase = await createClient()

    // Check if configuration for this type already exists
    const { data: existing } = await supabase
      .from('reminder_config')
      .select('id')
      .eq('reminder_type', validatedData.reminder_type)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `Configuration for ${validatedData.reminder_type} already exists` },
        { status: 409 }
      )
    }

    const { data: config, error } = await supabase
      .from('reminder_config')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating reminder config:', error)
      return NextResponse.json(
        { error: 'Failed to create reminder configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      config,
      message: 'Reminder configuration created successfully'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/reminders/config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to handle test reminder sending
async function handleTestReminder(body: any, user: any) {
  try {
    const validatedData = testReminderSchema.parse(body)

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const supabase = await createClient()

    // Get the appointment and patient details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        appointment_time,
        duration_minutes,
        reason,
        patients:patient_id (
          first_name,
          last_name,
          email,
          patient_id
        )
      `)
      .eq('id', validatedData.appointment_id)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Get the reminder configuration
    const { data: config, error: configError } = await supabase
      .from('reminder_config')
      .select('*')
      .eq('reminder_type', validatedData.reminder_type)
      .single()

    if (configError || !config) {
      return NextResponse.json(
        { error: 'Reminder configuration not found' },
        { status: 404 }
      )
    }

    // Use test email if provided, otherwise use patient email
    const patientData = Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients
    const targetEmail = validatedData.test_email || patientData.email

    if (!targetEmail) {
      return NextResponse.json(
        { error: 'No email address available for testing' },
        { status: 400 }
      )
    }

    // Import the email sending function from the process route
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    // Replace template variables
    const replaceTemplateVariables = (template: string, appointment: any): string => {
      const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
      const patientData = Array.isArray(appointment.patients) ? appointment.patients[0] : appointment.patients

      return template
        .replace(/\{\{patient_name\}\}/g, `${patientData.first_name} ${patientData.last_name}`)
        .replace(/\{\{appointment_date\}\}/g, appointmentDateTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }))
        .replace(/\{\{appointment_time\}\}/g, appointmentDateTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }))
        .replace(/\{\{duration\}\}/g, appointment.duration_minutes.toString())
        .replace(/\{\{reason\}\}/g, appointment.reason || 'General consultation')
        .replace(/\{\{patient_id\}\}/g, patientData.patient_id)
    }

    const subject = `[TEST] ${replaceTemplateVariables(config.email_template_subject, appointment)}`
    const htmlContent = replaceTemplateVariables(config.email_template_body, appointment)
      .replace(/\n/g, '<br>')

    const { data, error } = await resend.emails.send({
      from: 'LAV Dentaire <appointments@lavdentaire.com>',
      to: [targetEmail],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f39c12; color: white; padding: 15px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="margin: 0;">⚠️ TEST REMINDER EMAIL ⚠️</h2>
            <p style="margin: 5px 0 0 0;">This is a test email from LAV Dentaire reminder system</p>
          </div>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px;">
            <h1 style="margin: 0; font-size: 24px;">LAV Dentaire</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Professional Dental Care</p>
          </div>
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="white-space: pre-wrap; line-height: 1.6; color: #333;">
              ${htmlContent}
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e5e9;">
              <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                <h3 style="margin: 0 0 10px 0; color: #495057;">📧 Test Email Information</h3>
                <p style="margin: 0; color: #6c757d; font-size: 14px;">
                  <strong>Reminder Type:</strong> ${config.reminder_type}<br>
                  <strong>Sent To:</strong> ${targetEmail}<br>
                  <strong>Test Date:</strong> ${new Date().toLocaleString()}<br>
                  <strong>Template:</strong> ${config.email_template_subject}
                </p>
              </div>
            </div>
          </div>
        </div>
      `,
      text: `[TEST] ${replaceTemplateVariables(config.email_template_body, appointment)}`
    })

    if (error) {
      console.error('Test email send error:', error)
      return NextResponse.json(
        { error: `Failed to send test email: ${error.message}` },
        { status: 500 }
      )
    }

    // Log the test send
    await supabase.from('reminder_logs').insert({
      appointment_id: appointment.id,
      reminder_type: `test_${config.reminder_type}`,
      status: 'sent',
      email_address: targetEmail,
      resend_message_id: data?.id
    })

    return NextResponse.json({
      success: true,
      message: 'Test reminder sent successfully',
      messageId: data?.id,
      sentTo: targetEmail
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error sending test reminder:', error)
    return NextResponse.json(
      { error: 'Failed to send test reminder' },
      { status: 500 }
    )
  }
}