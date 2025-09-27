import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const patientData = await request.json();

    if (!patientData.email || !patientData.first_name || !patientData.last_name) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Check if email already exists
    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('email', patientData.email)
      .single();

    if (existingPatient) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Insert new patient with pending status
    const { data: newPatient, error: insertError } = await supabase
      .from('patients')
      .insert([{
        ...patientData,
        registration_status: 'pending',
        consent_signed_date: new Date().toISOString(),
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to register patient' },
        { status: 500 }
      );
    }

    // Create notification for admin
    await supabase
      .from('notifications')
      .insert([{
        patient_id: newPatient.id,
        type: 'registration_pending',
        title: 'New Patient Registration',
        message: `${newPatient.first_name} ${newPatient.last_name} has submitted a registration request.`,
      }]);

    // Send confirmation email to patient
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: patientData.email,
        subject: 'Registration Received - LAV Dentaire',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Registration Received</h2>
            <p>Dear ${patientData.first_name} ${patientData.last_name},</p>
            <p>Thank you for registering with LAV Dentaire. We have received your registration and it is currently under review.</p>
            <p>Our admin team will review your information and you will receive an email notification once your account is approved.</p>
            <p>This process typically takes 1-2 business days.</p>
            <br>
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
      message: 'Registration submitted successfully',
      patientId: newPatient.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}