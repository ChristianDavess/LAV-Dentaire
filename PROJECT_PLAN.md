# LAV Dentaire - Dental Management System Project Plan

## Project Overview
A comprehensive dental clinic management system for LAV Dentaire featuring patient self-registration via QR code, appointment management, treatment tracking, and admin dashboard analytics.

## Tech Stack
- **Frontend:** Next.js 14+ (App Router)
- **UI Components:** shadcn/ui only (https://ui.shadcn.com/docs/components)
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS (via shadcn)
- **Email Service:** Resend/Nodemailer (for notifications)
- **Deployment:** Vercel/Railway

## Database Schema

### Tables Structure

```sql
-- Admin table (single admin account)
admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  reset_token text,
  reset_token_expires timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)

-- Patients table
patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_status text DEFAULT 'pending', -- pending, approved, denied
  
  -- Personal Information
  first_name text NOT NULL,
  last_name text NOT NULL,
  middle_name text,
  birthdate date NOT NULL,
  age integer NOT NULL,
  sex text NOT NULL,
  nationality text,
  nickname text,
  home_no text,
  office_no text,
  fax_no text,
  mobile_no text,
  email text UNIQUE NOT NULL,
  address text,
  occupation text,
  dental_insurance text,
  effective_date date,
  
  -- Dental History
  previous_dentist text,
  last_dental_visit date,
  
  -- Medical History
  physician_name text,
  specialty text,
  office_address text,
  office_number text,
  is_good_health boolean DEFAULT true,
  under_medical_treatment boolean DEFAULT false,
  medical_treatment_details text,
  illness_operation_details text,
  hospitalized boolean DEFAULT false,
  hospitalized_details text,
  taking_medications boolean DEFAULT false,
  medications_list text,
  tobacco_use boolean DEFAULT false,
  dangerous_drugs_use boolean DEFAULT false,
  
  -- Allergies and Conditions
  allergic_to jsonb, -- JSON array of allergies
  
  -- Medical Conditions (boolean fields)
  high_blood_pressure boolean DEFAULT false,
  low_blood_pressure boolean DEFAULT false,
  epilepsy_convulsions boolean DEFAULT false,
  aids_hiv boolean DEFAULT false,
  std boolean DEFAULT false,
  fainting boolean DEFAULT false,
  rapid_weight_loss boolean DEFAULT false,
  radiation_therapy boolean DEFAULT false,
  joint_replacement boolean DEFAULT false,
  heart_surgery boolean DEFAULT false,
  heart_attack boolean DEFAULT false,
  thyroid_problem boolean DEFAULT false,
  heart_disease boolean DEFAULT false,
  heart_murmur boolean DEFAULT false,
  liver_disease boolean DEFAULT false,
  rheumatic_fever boolean DEFAULT false,
  hay_fever boolean DEFAULT false,
  respiratory_problems boolean DEFAULT false,
  hepatitis_jaundice boolean DEFAULT false,
  tuberculosis boolean DEFAULT false,
  swollen_ankles boolean DEFAULT false,
  kidney_disease boolean DEFAULT false,
  diabetes boolean DEFAULT false,
  chest_pain boolean DEFAULT false,
  stroke boolean DEFAULT false,
  cancer boolean DEFAULT false,
  anemia boolean DEFAULT false,
  angina boolean DEFAULT false,
  asthma boolean DEFAULT false,
  emphysema boolean DEFAULT false,
  bleeding_problems boolean DEFAULT false,
  blood_diseases boolean DEFAULT false,
  head_injuries boolean DEFAULT false,
  arthritis boolean DEFAULT false,
  other_conditions text,
  
  -- For Women
  is_pregnant boolean,
  is_nursing boolean,
  taking_birth_control boolean,
  
  -- Blood Information
  blood_type text,
  blood_pressure text,
  
  -- Consent Forms
  informed_consent_signed boolean DEFAULT false,
  consent_signature text, -- Base64 signature
  consent_signed_date timestamp,
  
  -- Timestamps
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  approved_at timestamp,
  denied_at timestamp,
  approved_by uuid REFERENCES admins(id),
  denied_by uuid REFERENCES admins(id),
  denial_reason text
)

-- Appointments table
appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  status text DEFAULT 'scheduled', -- scheduled, completed, cancelled, no-show
  notes text,
  notification_sent boolean DEFAULT false,
  notification_sent_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  created_by uuid REFERENCES admins(id),
  cancelled_at timestamp,
  cancelled_by uuid REFERENCES admins(id),
  cancellation_reason text
)

-- Procedures/Services table
procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL, -- PREVENTIVE, RESTORATIVE, PROSTHODONTICS, etc.
  name text NOT NULL,
  description text,
  price decimal(10,2),
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
)

-- Treatments table
treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  treatment_date date NOT NULL,
  tooth_numbers text[], -- Array of tooth numbers
  notes text,
  total_amount decimal(10,2) DEFAULT 0,
  payment_status text DEFAULT 'pending', -- pending, partial, paid
  amount_paid decimal(10,2) DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  created_by uuid REFERENCES admins(id)
)

-- Treatment Procedures (junction table)
treatment_procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id uuid REFERENCES treatments(id) ON DELETE CASCADE,
  procedure_id uuid REFERENCES procedures(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  unit_price decimal(10,2),
  subtotal decimal(10,2),
  created_at timestamp DEFAULT now()
)

-- Notifications table
notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  type text NOT NULL, -- registration_pending, registration_approved, appointment_reminder, etc.
  title text NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp DEFAULT now()
)
```

## Project Structure

```
lav-dentaire/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   ├── (admin)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── patients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── appointments/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── treatments/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── procedures/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── (public)/
│   │   └── register/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   ├── logout/
│   │   │   └── reset-password/
│   │   ├── patients/
│   │   │   ├── register/
│   │   │   ├── approve/
│   │   │   └── deny/
│   │   ├── appointments/
│   │   │   └── notify/
│   │   └── treatments/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/           # shadcn components
│   ├── forms/
│   │   ├── patient-registration-form.tsx
│   │   ├── informed-consent-form.tsx
│   │   └── signature-pad.tsx
│   ├── dashboard/
│   │   ├── stats-cards.tsx
│   │   ├── revenue-chart.tsx
│   │   ├── appointment-calendar.tsx
│   │   └── recent-activities.tsx
│   ├── tables/
│   │   ├── patients-table.tsx
│   │   ├── appointments-table.tsx
│   │   └── treatments-table.tsx
│   └── layout/
│       ├── admin-sidebar.tsx
│       ├── admin-header.tsx
│       └── mobile-nav.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── email/
│   │   ├── templates/
│   │   └── send.ts
│   ├── utils.ts
│   └── constants.ts
├── hooks/
│   ├── use-auth.ts
│   └── use-toast.ts
├── types/
│   └── index.ts
└── middleware.ts
```

## Implementation Steps

### Phase 1: Project Setup & Authentication
1. Initialize Next.js project with App Router
2. Install and configure shadcn/ui
3. Setup Supabase project and configure environment variables
4. Create database schema in Supabase
5. Implement admin authentication (login, logout, password reset)
6. Setup middleware for protected routes
7. Seed initial admin account and procedures data

### Phase 2: Patient Registration System
1. Create public registration page (mobile-first responsive)
2. Implement multi-step registration form:
   - Step 1: Personal Information
   - Step 2: Medical History
   - Step 3: Informed Consent with signature pad
3. Generate and display QR code for registration URL
4. Implement form validation and data submission
5. Store registration in pending status
6. Send notification to admin for new registrations

### Phase 3: Admin Dashboard
1. Create dashboard layout with sidebar navigation
2. Implement stats cards:
   - Total Patients
   - Today's Appointments
   - Monthly Revenue (₱)
   - Pending Registrations
3. Add revenue chart (monthly/yearly)
4. Create appointment calendar view
5. Implement recent activities feed
6. Add quick actions panel

### Phase 4: Patient Management
1. Create patients list page with search/filter
2. Implement registration approval/denial workflow
3. Create patient detail view
4. Add patient medical history view
5. Implement patient edit functionality
6. Add notification system for approval/denial

### Phase 5: Appointment Management
1. Create appointments calendar view
2. Implement appointment scheduling modal
3. Add appointment detail/edit page
4. Implement email notification system
5. Add reschedule functionality
6. Implement appointment cancellation with reason
7. Link appointments to treatments when completed

### Phase 6: Treatment & Procedures
1. Setup procedures management page
2. Create treatment recording form
3. Implement procedure selection (multiple)
4. Calculate treatment costs in PHP (₱)
5. Link treatments to appointments (if applicable)
6. Add payment tracking
7. Generate treatment history per patient

### Phase 7: Admin Features
1. Implement admin profile page
2. Create settings page for username/password change
3. Add notification center
4. Implement activity logs
5. Add data export functionality

### Phase 8: Testing & Deployment
1. Implement error handling and loading states
2. Add form validation and error messages
3. Test all user flows
4. Optimize for mobile devices
5. Setup environment variables for production
6. Deploy to Vercel/Railway
7. Configure custom domain

## Key Features Implementation Details

### Patient Registration (Mobile-First)
- QR code directs to: `/register`
- Progressive form with validation at each step
- Canvas-based signature pad for consent
- Auto-calculate age from birthdate
- Store all medical conditions as boolean fields
- Email validation and duplicate checking

### Admin Authentication
- Single admin account (no registration)
- Secure password hashing with bcrypt
- JWT or session-based authentication via Supabase
- Password reset via email link with expiring token

### Appointment Notifications
- Email notifications using Resend/Nodemailer
- Reminder emails 24 hours before appointment
- Notification tracking in database
- Batch notification sending capability

### Dashboard Analytics
- Real-time statistics updates
- Revenue tracking in Philippine Peso (₱)
- Monthly/yearly revenue charts
- Appointment completion rate
- Patient growth metrics

### Treatment Management
- Link to appointment for scheduled patients
- Support walk-in patient treatments
- Multiple procedure selection
- Automatic cost calculation
- Payment status tracking

## UI/UX Guidelines
- Use shadcn/ui components exclusively
- Mobile-first responsive design for patient registration
- Desktop-optimized admin interface
- Philippine locale (date format: MM/DD/YYYY)
- Currency format: ₱X,XXX.XX
- Toast notifications for all actions
- Loading states for all async operations
- Error boundaries for graceful error handling

## Security Considerations
- Row Level Security (RLS) in Supabase
- Input validation and sanitization
- HTTPS only in production
- Secure session management
- Rate limiting for API endpoints
- CORS configuration
- Environment variable protection

## Dental Procedures List (To be seeded)

### PREVENTIVE DENTISTRY
- Oral Prophylaxis (Cleaning)
- Pits and Fissure Sealants
- Fluoride Varnish Treatment and Tooth Mousse Application

### RESTORATIVE DENTISTRY
- Dental Filling
- Diastema Closure

### PROSTHODONTICS
- Complete Denture
- Flexible Removable Denture
- Acrylic Removable Denture
- Fixed Partial Denture
- Porcelain Fused to Metal, All Porcelain, Emax, Zirconia
- Root Canal Treatment
- Apicoectomy

### COSMETIC DENTISTRY
- Teeth Whitening
- Veneers (Direct/Indirect)
- Composite
- E-Max
- Signum
- Ceramage

### ORTHODONTICS
- Braces
- Retainers

### PEDIATRIC DENTISTRY
- Pulp Therapy
- Stainless Steel Crown
- Strip Off Crowns

### TMJ MANAGEMENT
- Neuromuscular Dentistry

### ORAL SURGERY
- Odontectomy (3rd Molar/Impacted Extraction)
- Laser Gingivectomy
- Laser Frenectomy
- Laser Teeth Whitening

## Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email Service
EMAIL_FROM=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=

# App
NEXT_PUBLIC_APP_URL=
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

## Best Practices to Follow
1. Use TypeScript for type safety
2. Implement proper error boundaries
3. Use React Server Components where possible
4. Implement proper loading and error states
5. Use Zod for schema validation
6. Implement proper logging
7. Use database transactions for critical operations
8. Implement proper caching strategies
9. Follow accessibility guidelines (WCAG)
10. Use semantic HTML elements
11. Implement proper SEO (for public pages)
12. Use environment variables for all sensitive data

## Development Commands
```bash
# Install dependencies
npm install

# Setup shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add [component-name]

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm run start
```

## Testing Checklist
- [ ] Admin can login and reset password
- [ ] Patients can register via QR code on mobile
- [ ] Admin receives notification for new registrations
- [ ] Admin can approve/deny registrations
- [ ] Admin can schedule appointments
- [ ] Email notifications are sent for appointments
- [ ] Admin can record treatments and procedures
- [ ] Treatment costs are calculated correctly in PHP
- [ ] Dashboard displays accurate analytics
- [ ] All forms have proper validation
- [ ] Mobile responsiveness for patient registration
- [ ] Desktop optimization for admin interface
- [ ] Error handling works properly
- [ ] Loading states are shown for async operations

## Deployment Checklist
- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] Admin account seeded
- [ ] Procedures data seeded
- [ ] Email service configured and tested
- [ ] HTTPS enabled
- [ ] Domain configured
- [ ] Error logging configured
- [ ] Backup strategy implemented
- [ ] Monitoring setup

## Notes for Implementation
1. Start with core functionality before adding advanced features
2. Test each phase thoroughly before moving to the next
3. Prioritize mobile experience for patient registration
4. Ensure all monetary values use Philippine Peso (₱)
5. Implement comprehensive logging for debugging
6. Use transactions for operations affecting multiple tables
7. Consider implementing a queue system for email notifications
8. Add rate limiting to prevent abuse
9. Implement data retention policies
10. Consider HIPAA compliance if applicable