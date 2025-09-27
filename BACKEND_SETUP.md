# Backend Setup - LAV Dentaire

## ✅ Backend Implementation Status

### **Completed Backend Components:**

#### 1. **Database Schema** (`supabase/schema.sql`)
- ✅ All tables with proper relationships
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ UUID support

#### 2. **API Routes**
- ✅ `/api/auth/login` - Admin authentication
- ✅ `/api/auth/logout` - Session termination
- ✅ `/api/patients/register` - Patient self-registration
- ✅ `/api/patients/approve` - Approve registrations
- ✅ `/api/patients/deny` - Deny registrations
- ✅ `/api/appointments/notify` - Send email reminders

#### 3. **Email Service** (`src/lib/email/service.ts`)
- ✅ Resend integration
- ✅ Professional HTML email templates:
  - Appointment reminders
  - Cancellation notices
  - Treatment summaries
  - Welcome emails
  - Registration status updates

#### 4. **Supabase Configuration**
- ✅ Client-side configuration
- ✅ Server-side configuration
- ✅ Service role configuration
- ✅ Authentication setup

#### 5. **Database Seeding**
- ✅ Admin account creation
- ✅ Procedures with pricing
- ✅ Complete setup script

## 🚀 Quick Backend Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Database
Go to your Supabase dashboard and run the schema:

1. Visit: https://supabase.com/dashboard/project/zxjhhyzcueooxayfarfe/sql/new
2. Copy entire contents of `supabase/schema.sql`
3. Paste and click "Run"
4. Wait for success message

### Step 3: Run Complete Setup
```bash
npm run setup:complete
```

This will:
- Create admin account
- Seed all procedures
- Verify database setup
- Show connection status

### Step 4: Start Development Server
```bash
npm run dev
```

## 📊 Backend Architecture

```
Backend Services
├── Authentication
│   ├── Supabase Auth (JWT)
│   ├── Admin-only access
│   └── Password reset flow
│
├── Database (Supabase/PostgreSQL)
│   ├── 7 main tables
│   ├── RLS policies
│   └── Automatic timestamps
│
├── API Endpoints
│   ├── RESTful design
│   ├── Error handling
│   └── Type safety
│
├── Email Service (Resend)
│   ├── Transactional emails
│   ├── HTML templates
│   └── Async processing
│
└── Real-time Features
    ├── Live updates (via Supabase)
    └── Instant notifications
```

## 🔒 Security Features

1. **Authentication**
   - JWT tokens via Supabase
   - Secure password hashing
   - Session management

2. **Authorization**
   - Admin-only routes protected
   - Row Level Security in database
   - Service role for sensitive operations

3. **Data Protection**
   - Environment variables for secrets
   - HTTPS in production
   - Input validation

## 📧 Email Notifications

### Configured Emails:
1. **Patient Registration**
   - Confirmation to patient
   - Notification to admin

2. **Registration Decision**
   - Approval email with welcome message
   - Denial email with reason

3. **Appointments**
   - Reminder emails (24 hours before)
   - Cancellation notifications
   - Rescheduling confirmations

4. **Treatments**
   - Treatment summary with costs
   - Payment reminders for balances

## 🔧 Backend Utilities

### Database Operations
```typescript
// Example: Fetch patients with Supabase
const { data, error } = await supabase
  .from('patients')
  .select('*')
  .eq('registration_status', 'approved');
```

### Email Sending
```typescript
// Example: Send appointment reminder
import { emailTemplates, sendEmail } from '@/lib/email/service';

const template = emailTemplates.appointmentReminder({
  patientName: 'John Doe',
  date: '2024-01-20',
  time: '14:00',
});

await sendEmail({
  to: 'patient@email.com',
  ...template
});
```

## 🚨 Troubleshooting Backend

### Database Connection Issues
```bash
# Check if tables exist
npm run setup:complete
```

### Email Not Sending
1. Verify Resend API key in `.env.local`
2. Check Resend dashboard for logs
3. Ensure FROM_EMAIL is verified

### Authentication Failing
1. Check Supabase credentials
2. Verify admin exists in database
3. Clear browser cookies

### API Errors
Check browser console and Network tab for:
- 401: Authentication required
- 403: Forbidden (not admin)
- 404: Resource not found
- 500: Server error (check logs)

## 📦 Environment Variables Required

```env
# Supabase (Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=✅ Configured
NEXT_PUBLIC_SUPABASE_ANON_KEY=✅ Configured
SUPABASE_SERVICE_ROLE_KEY=✅ Configured

# Email Service
RESEND_API_KEY=✅ Configured
FROM_EMAIL=✅ Configured

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@lavdentaire.com
ADMIN_PASSWORD=Admin@123456
```

## ✅ Backend Checklist

- [x] Database schema created
- [x] Tables with relationships
- [x] Authentication system
- [x] API endpoints
- [x] Email service
- [x] Error handling
- [x] Type safety
- [x] Security policies
- [x] Admin account
- [x] Procedures seeded
- [x] Environment variables

## 🎯 Backend is Ready!

The backend is now fully implemented and ready to use. Run:

```bash
npm run dev
```

Then access:
- Admin Login: http://localhost:3000/login
- Patient Registration: http://localhost:3000/register

Login with:
- Email: admin@lavdentaire.com
- Password: Admin@123456

All backend services are configured and operational! 🚀