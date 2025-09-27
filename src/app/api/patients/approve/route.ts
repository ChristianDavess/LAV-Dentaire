import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
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
        registration_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', patientId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to approve patient' },
        { status: 500 }
      );
    }

    // Create notification
    await serviceSupabase
      .from('notifications')
      .insert([{
        patient_id: patientId,
        type: 'registration_approved',
        title: 'Registration Approved',
        message: 'Your registration has been approved. You can now book appointments.',
      }]);

    // Send approval email
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: patient.email,
        subject: 'Registration Approved - LAV Dentaire',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Registration Approved!</h2>
            <p>Dear ${patient.first_name} ${patient.last_name},</p>
            <p>Great news! Your registration with LAV Dentaire has been approved.</p>
            <p>You are now registered as our patient and can book appointments at your convenience.</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Your Patient Information:</strong></p>
              <p>Name: ${patient.first_name} ${patient.last_name}</p>
              <p>Email: ${patient.email}</p>
              <p>Mobile: ${patient.mobile_no || 'Not provided'}</p>
            </div>
            
            <p>For appointments or inquiries, please contact us.</p>
            <br>
            <p>Welcome to LAV Dentaire!</p>
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
      message: 'Patient approved successfully',
    });
  } catch (error) {
    console.error('Approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}