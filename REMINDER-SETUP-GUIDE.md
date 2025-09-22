# 📧 Automated Appointment Reminder System Setup Guide

## 🎯 Overview

The LAV Dentaire system now includes a comprehensive automated appointment reminder system that sends professional email reminders to patients at configurable intervals before their appointments.

## ✅ What's Already Implemented

### 1. **Database Schema** ✅
- Reminder tracking fields added to appointments table
- Reminder configuration table for customizable settings
- Reminder logs table for audit trails
- Migration file: `supabase/migrations/20250921000001_add_reminder_tracking.sql`

### 2. **API Endpoints** ✅
- `/api/reminders/process` - Main reminder processing endpoint
- `/api/reminders/config` - Configuration management
- Full CRUD operations for reminder settings
- Test reminder functionality

### 3. **Email Templates** ✅
- Professional, branded email templates using Resend
- Template variables for dynamic content
- Responsive HTML design with clinic branding
- Customizable subject lines and content

### 4. **Admin Interface** ✅
- Settings page with reminder management
- Configuration editing interface
- Test email functionality
- Statistics and monitoring dashboard

## 🚀 Setup Instructions

### Step 1: Environment Configuration

Add the following environment variables to your `.env.local` file:

```bash
# Resend Email Service
RESEND_API_KEY=your_resend_api_key_here

# Cron Job Security (generate a random string)
CRON_SECRET=your_secure_random_string_here
```

**Getting Resend API Key:**
1. Sign up at [https://resend.com](https://resend.com)
2. Verify your domain (or use their free domain for testing)
3. Generate an API key in the dashboard
4. Add it to your environment variables

### Step 2: Database Migration

Run the database migration to add reminder tracking:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration manually through Supabase dashboard
# Upload: supabase/migrations/20250921000001_add_reminder_tracking.sql
```

### Step 3: Configure Default Reminders

The migration automatically creates two default reminder configurations:
- **24-hour reminder**: Sent 24 hours before appointment
- **Day-of reminder**: Sent 2 hours before appointment

Access the settings page to customize these templates and timing.

### Step 4: Set Up Automated Cron Jobs

Since Next.js is serverless, we need external cron services. Choose one of these options:

#### Option A: cron-job.org (Recommended - Free)

1. Sign up at [https://cron-job.org](https://cron-job.org)
2. Create a new cron job with these settings:
   - **URL**: `https://your-domain.com/api/reminders/process`
   - **Method**: POST
   - **Schedule**: `0 */1 * * *` (every hour)
   - **Headers**:
     ```
     x-cron-secret: your_cron_secret_here
     Content-Type: application/json
     ```
   - **Body**: `{}`

#### Option B: GitHub Actions (Free for public repos)

Create `.github/workflows/reminders.yml`:

```yaml
name: Send Appointment Reminders
on:
  schedule:
    - cron: '0 */1 * * *'  # Every hour
  workflow_dispatch:  # Manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Reminder Processing
        run: |
          curl -X POST \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            -d '{}' \
            "${{ secrets.REMINDER_ENDPOINT }}"
```

Add these secrets to your GitHub repository:
- `CRON_SECRET`: Your cron secret
- `REMINDER_ENDPOINT`: `https://your-domain.com/api/reminders/process`

#### Option C: Vercel Cron Jobs (Paid feature)

If using Vercel Pro, create `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/reminders/process",
      "schedule": "0 */1 * * *"
    }
  ]
}
```

#### Option D: Other Cron Services

- **EasyCron**: [https://www.easycron.com](https://www.easycron.com)
- **cPanel Cron Jobs**: If hosting on cPanel
- **AWS EventBridge**: For AWS deployments
- **Google Cloud Scheduler**: For GCP deployments

### Step 5: Test the System

1. **Access Settings**: Go to Settings → Reminders tab
2. **Check Configuration**: Verify email service is configured
3. **Test Email**: Use the "Test Reminder" button to send test emails
4. **Monitor Logs**: Check reminder statistics and logs

## 📝 Configuration Options

### Reminder Types

| Type | Default Timing | Purpose |
|------|---------------|---------|
| **24 Hour** | 24 hours before | Confirmation reminder with reschedule option |
| **Day Of** | 2 hours before | Final reminder with clinic details |
| **Custom** | Configurable | Additional reminders as needed |

### Email Template Variables

Use these variables in your email templates:

- `{{patient_name}}` - Patient's full name
- `{{appointment_date}}` - Formatted appointment date
- `{{appointment_time}}` - Formatted appointment time
- `{{duration}}` - Appointment duration in minutes
- `{{reason}}` - Reason for appointment
- `{{patient_id}}` - Patient ID number

### Business Rules

- Only sends reminders for **scheduled** appointments
- Skips patients without email addresses
- Prevents duplicate reminders for same type
- Respects patient preferences (when implemented)
- Tracks delivery status and failures

## 🔧 Monitoring & Troubleshooting

### Check System Status

Visit `/api/reminders/process` (GET request) to see:
- System operational status
- Upcoming appointments count
- Recent reminder logs
- Email service configuration status

### Common Issues

**1. No emails being sent**
- Check RESEND_API_KEY is valid
- Verify domain is configured in Resend
- Check cron job is running (look for POST requests in logs)

**2. Emails not delivered**
- Check email addresses are valid
- Verify Resend domain authentication
- Check spam folders
- Review delivery logs in Resend dashboard

**3. Duplicate reminders**
- System automatically prevents duplicates
- Check reminder logs for any processing errors
- Verify cron job isn't running too frequently

### Logs and Analytics

- **Reminder Logs**: `reminder_logs` table tracks all send attempts
- **Statistics**: Settings page shows 30-day delivery stats
- **Appointment Status**: Tracks which reminders have been sent

## 🛡️ Security Features

- **CRON_SECRET**: Protects endpoint from unauthorized access
- **User Authentication**: All admin functions require login
- **Audit Logging**: All reminder activities are logged
- **Email Validation**: Validates email addresses before sending
- **Rate Limiting**: Prevents spam and abuse

## 📧 Email Best Practices

### Template Guidelines

1. **Keep it concise**: Patients scan emails quickly
2. **Include all details**: Date, time, duration, reason
3. **Clear call-to-action**: Contact info for changes
4. **Professional tone**: Maintain clinic's brand voice
5. **Mobile-friendly**: Templates are responsive

### Delivery Timing

- **24-hour reminder**: Ideal for confirmation and planning
- **Day-of reminder**: Last chance for attendance
- **Avoid weekends**: For business hour appointments
- **Time zone awareness**: Consider patient locations

### Compliance

- Include unsubscribe option (future feature)
- Follow healthcare communication guidelines
- Respect patient privacy and data protection
- Maintain professional medical communication standards

## 🔄 Maintenance

### Regular Tasks

1. **Monitor Statistics**: Weekly review of delivery rates
2. **Update Templates**: Seasonal or policy changes
3. **Review Logs**: Check for delivery failures
4. **Test Functionality**: Monthly test emails

### Performance Optimization

- System processes up to 200 appointments per hour
- Automatic retry logic for failed sends
- Efficient database queries with proper indexing
- Minimal server resources required

## 📞 Support

If you encounter issues:

1. Check the Settings → Reminders page for system status
2. Review the reminder logs for specific errors
3. Test with a single appointment first
4. Verify all environment variables are set correctly

---

## 🎉 Success!

Once configured, your clinic will have:
- ✅ **Automated patient reminders** reducing no-shows
- ✅ **Professional branded emails** maintaining clinic image
- ✅ **Flexible scheduling** with configurable timing
- ✅ **Comprehensive tracking** with delivery analytics
- ✅ **Easy management** through the admin interface

The reminder system will automatically process appointments and send professional emails to patients, significantly reducing no-shows and improving clinic efficiency! 🦷📧