import { Resend } from 'resend';
import { formatDate, formatTime } from '@/lib/utils';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

// Email Templates
export const emailTemplates = {
  appointmentReminder: (data: {
    patientName: string;
    date: string;
    time: string;
    notes?: string;
  }) => ({
    subject: 'Appointment Reminder - LAV Dentaire',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">LAV Dentaire</h1>
          <p style="color: white; margin: 5px 0;">Dental Care Excellence</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Appointment Reminder</h2>
          <p style="font-size: 16px;">Dear ${data.patientName},</p>
          <p>This is a friendly reminder about your upcoming appointment at LAV Dentaire.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formatDate(data.date)}</p>
            <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${formatTime(data.time)}</p>
            ${data.notes ? `<p style="margin: 5px 0;"><strong>📝 Notes:</strong> ${data.notes}</p>` : ''}
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>Important:</strong> Please arrive 10 minutes before your scheduled time for check-in.
            </p>
          </div>
          
          <p>If you need to reschedule or cancel, please contact us as soon as possible.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">Best regards,</p>
            <p style="color: #6c757d; font-size: 14px; margin: 5px 0;"><strong>LAV Dentaire Team</strong></p>
            <p style="color: #6c757d; font-size: 12px; margin-top: 10px;">
              📧 noreply@notifications.lavdentaire.com<br>
              📍 Manila, Philippines
            </p>
          </div>
        </div>
      </div>
    `,
  }),

  appointmentCancellation: (data: {
    patientName: string;
    date: string;
    time: string;
    reason: string;
  }) => ({
    subject: 'Appointment Cancelled - LAV Dentaire',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">LAV Dentaire</h1>
          <p style="color: white; margin: 5px 0;">Appointment Cancellation Notice</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Appointment Cancelled</h2>
          <p style="font-size: 16px;">Dear ${data.patientName},</p>
          <p>We regret to inform you that your appointment has been cancelled.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f5576c;">
            <p style="margin: 5px 0;"><strong>Original Date:</strong> ${formatDate(data.date)}</p>
            <p style="margin: 5px 0;"><strong>Original Time:</strong> ${formatTime(data.time)}</p>
            <p style="margin: 5px 0;"><strong>Reason:</strong> ${data.reason}</p>
          </div>
          
          <p>We apologize for any inconvenience this may cause. Please contact us to reschedule your appointment at your earliest convenience.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="mailto:admin@lavdentaire.com" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Contact Us to Reschedule
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px;">Best regards,<br><strong>LAV Dentaire Team</strong></p>
          </div>
        </div>
      </div>
    `,
  }),

  treatmentSummary: (data: {
    patientName: string;
    date: string;
    procedures: string[];
    totalAmount: number;
    amountPaid: number;
    balance: number;
  }) => ({
    subject: 'Treatment Summary - LAV Dentaire',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">LAV Dentaire</h1>
          <p style="color: white; margin: 5px 0;">Treatment Summary</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Treatment Completed</h2>
          <p style="font-size: 16px;">Dear ${data.patientName},</p>
          <p>Thank you for visiting LAV Dentaire. Here's a summary of your treatment:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-bottom: 15px;">Treatment Details</h3>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDate(data.date)}</p>
            
            <h4 style="margin-top: 15px; margin-bottom: 10px;">Procedures Performed:</h4>
            <ul style="margin: 0; padding-left: 20px;">
              ${data.procedures.map(proc => `<li style="margin: 5px 0;">${proc}</li>`).join('')}
            </ul>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-bottom: 15px;">Payment Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;">Total Amount:</td>
                <td style="text-align: right; font-weight: bold;">₱${data.totalAmount.toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">Amount Paid:</td>
                <td style="text-align: right; color: #28a745;">₱${data.amountPaid.toLocaleString()}</td>
              </tr>
              <tr style="border-top: 2px solid #dee2e6;">
                <td style="padding: 8px 0; font-weight: bold;">Balance Due:</td>
                <td style="text-align: right; font-weight: bold; color: ${data.balance > 0 ? '#dc3545' : '#28a745'};">
                  ₱${data.balance.toLocaleString()}
                </td>
              </tr>
            </table>
          </div>
          
          ${data.balance > 0 ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Payment Reminder:</strong> You have an outstanding balance of ₱${data.balance.toLocaleString()}. 
                Please settle this amount on your next visit.
              </p>
            </div>
          ` : ''}
          
          <p>Thank you for choosing LAV Dentaire for your dental care needs. We look forward to seeing you again!</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px;">Best regards,<br><strong>LAV Dentaire Team</strong></p>
          </div>
        </div>
      </div>
    `,
  }),

  welcomePatient: (data: {
    patientName: string;
    email: string;
  }) => ({
    subject: 'Welcome to LAV Dentaire',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 36px;">Welcome to LAV Dentaire!</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">Thank You for Choosing Us</h2>
          <p style="font-size: 16px;">Dear ${data.patientName},</p>
          <p>Welcome to the LAV Dentaire family! We're thrilled to have you as our patient and look forward to providing you with excellent dental care.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea;">What's Next?</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li style="margin: 10px 0;">Schedule your first appointment with us</li>
              <li style="margin: 10px 0;">Bring any previous dental records if available</li>
              <li style="margin: 10px 0;">Arrive 10 minutes early for your appointment</li>
            </ol>
          </div>
          
          <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0066cc; margin-bottom: 10px;">Our Services Include:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #333;">
              <li style="margin: 5px 0;">Preventive Dentistry</li>
              <li style="margin: 5px 0;">Restorative Procedures</li>
              <li style="margin: 5px 0;">Cosmetic Dentistry</li>
              <li style="margin: 5px 0;">Orthodontics</li>
              <li style="margin: 5px 0;">Oral Surgery</li>
            </ul>
          </div>
          
          <p>If you have any questions or need to schedule an appointment, please don't hesitate to contact us.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
            <p style="color: #6c757d; font-size: 14px;">
              We're here to help you achieve optimal oral health!<br><br>
              Best regards,<br><strong>LAV Dentaire Team</strong>
            </p>
          </div>
        </div>
      </div>
    `,
  }),
};