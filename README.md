# LAV Dentaire - Dental Management System

A modern, comprehensive dental clinic management system built with Next.js 14, Supabase, and shadcn/ui.

## Features

### 🦷 Patient Management
- **Self-Registration via QR Code**: Mobile-first patient registration portal
- **Comprehensive Medical History**: Detailed medical and dental history tracking
- **Digital Consent Forms**: Electronic signature capture for informed consent
- **Registration Approval Workflow**: Admin review and approval system

### 📅 Appointment Management
- **Smart Scheduling**: Easy appointment booking and rescheduling
- **Email Notifications**: Automated appointment reminders via Resend
- **Calendar View**: Visual appointment calendar
- **Status Tracking**: Track scheduled, completed, cancelled appointments

### 💊 Treatment & Procedures
- **Treatment Recording**: Link treatments to appointments
- **Multiple Procedures**: Select multiple dental procedures per treatment
- **Cost Calculation**: Automatic price calculation in Philippine Peso (₱)
- **Payment Tracking**: Monitor payment status and amounts

### 📊 Analytics Dashboard
- **Real-time Statistics**: Patient count, appointments, revenue tracking
- **Revenue Charts**: Monthly revenue visualization
- **Recent Activities**: Activity feed for quick overview
- **Pending Registrations**: Quick access to pending approvals

### 🔐 Security & Admin
- **Single Admin System**: Secure admin authentication
- **Password Reset**: Email-based password recovery
- **Settings Management**: Update credentials and system settings
- **Row Level Security**: Supabase RLS for data protection

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI + Tailwind)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Email**: Resend API
- **Deployment**: Vercel/Railway

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- Resend account for email notifications

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/lav-dentaire.git
cd lav-dentaire
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@lavdentaire.com
ADMIN_PASSWORD=your_secure_password
```

4. **Set up Supabase database**

Run the SQL schema in your Supabase SQL editor:

```bash
# Copy contents of supabase/schema.sql to Supabase SQL editor
```

5. **Seed the database**
```bash
npm run db:seed
```

This will:
- Create the admin account
- Seed dental procedures with prices

6. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
lav-dentaire/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages
│   │   ├── (admin)/         # Admin dashboard pages
│   │   ├── (public)/        # Public pages (registration)
│   │   └── api/            # API routes
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   ├── forms/          # Form components
│   │   ├── tables/         # Table components
│   │   ├── dialogs/        # Dialog components
│   │   ├── dashboard/      # Dashboard widgets
│   │   └── layout/         # Layout components
│   ├── lib/
│   │   ├── supabase/       # Supabase clients
│   │   ├── utils.ts        # Utility functions
│   │   └── constants.ts    # App constants
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript types
├── scripts/
│   └── seed.ts            # Database seeding script
└── supabase/
    └── schema.sql         # Database schema
```

## Usage Guide

### Admin Login
1. Navigate to `/login`
2. Use the admin credentials set in environment variables
3. Access the dashboard at `/dashboard`

### Patient Registration
1. Patients scan the QR code displayed in admin sidebar
2. Complete the multi-step registration form
3. Submit for admin approval
4. Receive email notification upon approval

### Scheduling Appointments
1. Go to Appointments page
2. Click "Schedule Appointment"
3. Select patient, date, and time
4. Add optional notes
5. Send email reminders to patients

### Recording Treatments
1. Navigate to Treatments page
2. Click "New Treatment"
3. Select patient and procedures
4. System calculates total cost automatically
5. Track payment status

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Deploy to Railway

1. Create new Railway project
2. Connect GitHub repository
3. Add environment variables
4. Deploy

## Security Considerations

- Enable Supabase Row Level Security (RLS)
- Use secure passwords for admin account
- Keep service role key private
- Enable HTTPS in production
- Implement rate limiting for API endpoints
- Regular security audits

## Maintenance

### Backup Database
- Use Supabase dashboard to create backups
- Export data regularly
- Store backups securely

### Update Dependencies
```bash
npm update
npm audit fix
```

### Monitor Performance
- Use Vercel Analytics
- Monitor Supabase usage
- Check email delivery rates

## Troubleshooting

### Common Issues

**Database connection errors**
- Check Supabase credentials
- Verify network connectivity
- Check RLS policies

**Email not sending**
- Verify Resend API key
- Check sender domain verification
- Review email logs in Resend dashboard

**Build errors**
- Clear `.next` folder
- Delete `node_modules` and reinstall
- Check TypeScript errors

## Support

For issues and questions:
- Create an issue on GitHub
- Contact support@lavdentaire.com
- Check documentation

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Resend](https://resend.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

Built with ❤️ for LAV Dentaire