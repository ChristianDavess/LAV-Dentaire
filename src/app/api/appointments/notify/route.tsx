import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { formatDate, formatTime } from '@/lib/utils';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json();
    
    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch appointment with patient details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(first_name, last_name, email)
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Send email notification
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: appointment.patient.email,
      subject: 'Appointment Reminder - LAV Dentaire',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Appointment Reminder</h2>
          <p>Dear ${appointment.patient.first_name} ${appointment.patient.last_name},</p>
          <p>This is a reminder about your upcoming appointment at LAV Dentaire.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Date:</strong> ${formatDate(appointment.appointment_date)}</p>
            <p><strong>Time:</strong> ${formatTime(appointment.appointment_time)}</p>
            ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
          </div>
          
          <p>Please arrive 10 minutes before your scheduled time.</p>
          <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
          
          <p>Best regards,<br>LAV Dentaire Team</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('Email sending error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, emailId: emailData?.id });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}