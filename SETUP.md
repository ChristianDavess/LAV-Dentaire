# LAV Dentaire Setup Instructions

## Quick Setup Guide

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

1. Copy the `.env.local` file provided in the project
2. The file already contains your Supabase and Resend credentials

### Step 3: Setup Supabase Database

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/zxjhhyzcueooxayfarfe
2. Navigate to SQL Editor
3. Copy the entire contents of `supabase/schema.sql` 
4. Paste and run it in the SQL editor
5. This will create all necessary tables with proper structure

### Step 4: Seed Initial Data

```bash
npm run db:seed
```

This will:
- Create the admin account (admin@lavdentaire.com / Admin@123456)
- Populate dental procedures with prices

### Step 5: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser

### Step 6: Login as Admin

- Email: admin@lavdentaire.com
- Password: Admin@123456

## Important URLs

- **Admin Login**: http://localhost:3000/login
- **Patient Registration**: http://localhost:3000/register
- **Dashboard**: http://localhost:3000/dashboard (after login)

## Project Structure Overview

```
lav-dentaire/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components
│   ├── lib/             # Utility functions and configs
│   ├── hooks/           # Custom React hooks
│   └── types/           # TypeScript type definitions
├── scripts/             # Database seed scripts
├── supabase/           # Database schema
└── public/             # Static assets
```

## Key Features Ready to Use

✅ **Patient Management**
- QR code for patient self-registration
- Registration approval workflow
- Comprehensive medical history tracking
- Digital consent forms with signature

✅ **Appointment System**
- Schedule appointments
- Send email reminders
- Calendar view
- Reschedule/cancel functionality

✅ **Treatment Recording**
- Link to appointments
- Multiple procedures per treatment
- Automatic cost calculation in PHP
- Payment tracking

✅ **Dashboard Analytics**
- Patient statistics
- Revenue tracking
- Appointment overview
- Recent activities

## Troubleshooting

### Database Connection Issues
- Verify Supabase URL and keys in `.env.local`
- Check if tables were created successfully in Supabase

### Email Not Sending
- Verify Resend API key is correct
- Check if FROM_EMAIL domain is verified in Resend

### Build Errors
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Missing shadcn Components
All components are already installed with `npx shadcn@latest add --all`

## Admin Capabilities

As an admin, you can:
1. **Approve/Deny** patient registrations
2. **Schedule** appointments for patients
3. **Send** email notifications
4. **Record** treatments and procedures
5. **Track** payments and revenue
6. **Update** procedure prices
7. **Manage** settings and profile

## Patient Registration Flow

1. Patient scans QR code (displayed in admin sidebar)
2. Fills multi-step registration form
3. Signs consent digitally
4. Admin receives pending registration
5. Admin approves/denies
6. Patient receives email notification

## Support

For any issues:
- Check the README.md for detailed documentation
- Review error messages in browser console
- Verify all environment variables are set correctly

## Deployment

When ready for production:
1. Update `NEXT_PUBLIC_APP_URL` in environment
2. Use production Supabase credentials
3. Deploy to Vercel or Railway
4. Update email domain in Resend

---

**System is ready to use!** Navigate to http://localhost:3000/login to begin.