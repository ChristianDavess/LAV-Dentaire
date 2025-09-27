import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { patientId, reason } = await request.json();

    if (!patientId || !reason) {
      return NextResponse.json(
        { error: 'Patient ID and reason are required' },
        { status: 400 }
      );
    }

    // Check if user is authenticated admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const serviceSupabase = await createServiceClient();

    // Get patient details
    const { data: patient, error: fetchError } = await serviceSupabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (fetchError || !patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    if (patient.registration_status !== 'pending') {
      return NextResponse.json(
        { error: 'Patient registration is not pending' },
        { status: 400 }
      );
    }

    // Update patient status
    const { error: updateError } = await serviceSupabase
      .from('patients')
      .update({
        registration_status: 'denied',
        denied_at: new Date().toISOString(),
        denied_by: user.id,
        denial_reason: reason,
      })
      .eq('id', patientId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to deny patient' },
        { status: 500 }
      );
    }

    // Create notification
    await serviceSupabase
      .from('notifications')
      .insert([{
        patient_id: patientId,
        type: 'registration_denied',
        title: 'Registration Denied',
        message: `Your registration has been denied. Reason: ${reason}`,
      }]);

    // Send denial email
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: patient.email,
        subject: 'Registration Status Update - LAV Dentaire',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Registration Status Update</h2>
            <p>Dear ${patient.first_name} ${patient.last_name},</p>
            <p>Thank you for your interest in LAV Dentaire. After reviewing your registration, we regret to inform you that we are unable to approve your registration at this time.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Reason:</strong></p>
              <p>${reason}</p>
            </div>
            
            <p>If you believe this decision was made in error or if you have additional information to provide, please contact us directly.</p>
            <br>
            <p>Thank you for your understanding.</p>
            <p>Best regards,<br>LAV Dentaire Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Patient registration denied',
    });
  } catch (error) {
    console.error('Denial error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}