import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { emailTemplates, sendEmail } from '@/lib/email/service';

export async function POST(request: NextRequest) {
  try {
    const treatmentData = await request.json();

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
    const { data: patient } = await serviceSupabase
      .from('patients')
      .select('*')
      .eq('id', treatmentData.patient_id)
      .single();

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Calculate total amount
    const totalAmount = treatmentData.procedures.reduce((sum: number, proc: any) => 
      sum + (proc.unit_price * proc.quantity), 0
    );

    // Create treatment record
    const { data: newTreatment, error: treatmentError } = await serviceSupabase
      .from('treatments')
      .insert([{
        patient_id: treatmentData.patient_id,
        appointment_id: treatmentData.appointment_id || null,
        treatment_date: treatmentData.treatment_date,
        tooth_numbers: treatmentData.tooth_numbers || null,
        notes: treatmentData.notes || null,
        total_amount: totalAmount,
        payment_status: 'pending',
        amount_paid: 0,
        created_by: user.id,
      }])
      .select()
      .single();

    if (treatmentError) {
      console.error('Treatment error:', treatmentError);
      return NextResponse.json(
        { error: 'Failed to create treatment' },
        { status: 500 }
      );
    }

    // Insert treatment procedures
    const proceduresToInsert = treatmentData.procedures.map((proc: any) => ({
      treatment_id: newTreatment.id,
      procedure_id: proc.procedure_id,
      quantity: proc.quantity,
      unit_price: proc.unit_price,
      subtotal: proc.unit_price * proc.quantity,
    }));

    const { error: proceduresError } = await serviceSupabase
      .from('treatment_procedures')
      .insert(proceduresToInsert);

    if (proceduresError) {
      console.error('Procedures error:', proceduresError);
    }

    // Mark appointment as completed if linked
    if (treatmentData.appointment_id) {
      await serviceSupabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', treatmentData.appointment_id);
    }

    // Get procedure names for email
    const { data: procedures } = await serviceSupabase
      .from('procedures')
      .select('name')
      .in('id', treatmentData.procedures.map((p: any) => p.procedure_id));

    // Send treatment summary email
    try {
      const template = emailTemplates.treatmentSummary({
        patientName: `${patient.first_name} ${patient.last_name}`,
        date: treatmentData.treatment_date,
        procedures: procedures?.map(p => p.name) || [],
        totalAmount,
        amountPaid: 0,
        balance: totalAmount,
      });

      await sendEmail({
        to: patient.email,
        ...template,
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Continue even if email fails
    }

    return NextResponse.json({
      success: true,
      treatment: newTreatment,
      message: 'Treatment recorded successfully',
    });
  } catch (error) {
    console.error('Treatment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { treatmentId, ...updateData } = await request.json();

    if (!treatmentId) {
      return NextResponse.json(
        { error: 'Treatment ID is required' },
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

    // Update treatment
    const { data: updatedTreatment, error: updateError } = await serviceSupabase
      .from('treatments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', treatmentId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update treatment' },
        { status: 500 }
      );
    }

    // If payment status changed to paid, send confirmation
    if (updateData.payment_status === 'paid') {
      const { data: patient } = await serviceSupabase
        .from('patients')
        .select('*')
        .eq('id', updatedTreatment.patient_id)
        .single();

      if (patient) {
        try {
          await sendEmail({
            to: patient.email,
            subject: 'Payment Received - LAV Dentaire',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Payment Confirmation</h2>
                <p>Dear ${patient.first_name} ${patient.last_name},</p>
                <p>We have received your payment of ₱${updatedTreatment.amount_paid.toLocaleString()} for your treatment on ${updatedTreatment.treatment_date}.</p>
                <p>Thank you for your prompt payment!</p>
                <br>
                <p>Best regards,<br>LAV Dentaire Team</p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error('Payment email error:', emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      treatment: updatedTreatment,
      message: 'Treatment updated successfully',
    });
  } catch (error) {
    console.error('Treatment update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}