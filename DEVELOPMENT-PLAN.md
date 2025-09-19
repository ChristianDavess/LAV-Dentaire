# LAV Dentaire - Development Implementation Plan

## Project Overview
Comprehensive dental clinic management system for LAV Dentaire with admin-only access, patient management, appointments, treatments, and QR code patient registration.

**IMPORTANT: This is a SINGLE-USER SYSTEM** - designed for one admin user (dentist/clinic owner) to manage their practice. All authentication and system features are built around this single-user architecture.

## Tech Stack
- **Frontend**: Next.js 14+ (App Router)
- **UI Library**: shadcn/ui (see CLAUDE.md for UI guidelines)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Database, Auth, Real-time, Storage)
- **Language**: TypeScript
- **Email**: Resend API
- **QR Codes**: qrcode + qr-scanner libraries
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Deployment**: Vercel

---

## Project Structure
```
lav-dentaire-clinic/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── patients/
│   │   │   ├── appointments/
│   │   │   ├── treatments/
│   │   │   ├── analytics/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── patients/
│   │   │   ├── appointments/
│   │   │   ├── treatments/
│   │   │   ├── notifications/
│   │   │   └── qr-registration/
│   │   ├── patient-registration/
│   │   │   └── [qr-code]/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── forms/
│   │   ├── charts/
│   │   ├── notifications/
│   │   └── patient/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validations/
│   │   ├── utils.ts
│   │   └── constants.ts
│   └── types/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── public/
└── package.json
```

---

## Database Schema (Supabase)

### 1. admin_users
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. medical_history_fields
```sql
CREATE TABLE medical_history_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name VARCHAR NOT NULL,
  field_type VARCHAR DEFAULT 'checkbox', -- checkbox, text, number
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. patients
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id VARCHAR UNIQUE NOT NULL, -- Auto-generated P001, P002, etc.
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  middle_name VARCHAR,
  date_of_birth DATE,
  gender VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  address TEXT,
  emergency_contact_name VARCHAR,
  emergency_contact_phone VARCHAR,
  medical_history JSONB DEFAULT '{}', -- Dynamic medical history based on fields
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. appointments
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status VARCHAR DEFAULT 'scheduled', -- scheduled, completed, cancelled, no-show
  reason TEXT,
  notes TEXT,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. procedures
```sql
CREATE TABLE procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  default_cost DECIMAL(10,2),
  estimated_duration INTEGER, -- minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 6. treatments
```sql
CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id),
  treatment_date DATE NOT NULL,
  total_cost DECIMAL(10,2) DEFAULT 0,
  payment_status VARCHAR DEFAULT 'pending', -- pending, partial, paid
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. treatment_procedures
```sql
CREATE TABLE treatment_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID REFERENCES treatments(id) ON DELETE CASCADE,
  procedure_id UUID REFERENCES procedures(id),
  quantity INTEGER DEFAULT 1,
  cost_per_unit DECIMAL(10,2),
  total_cost DECIMAL(10,2),
  tooth_number VARCHAR, -- Optional: specific tooth
  notes TEXT
);
```

### 8. qr_registration_tokens
```sql
CREATE TABLE qr_registration_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 9. notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR NOT NULL, -- appointment_reminder, payment_due, etc.
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Environment Variables
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Email (Resend)
RESEND_API_KEY=your_resend_api_key_here

# App
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# QR Registration
QR_REGISTRATION_SECRET=your_qr_registration_secret_here
```

---

## Installation Commands
```bash
# Initialize Next.js project
npx create-next-app@latest lav-dentaire-clinic --typescript --tailwind --eslint --app
cd lav-dentaire-clinic

# Initialize shadcn/ui
npx shadcn-ui@latest init

# Install core dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install resend
npm install qrcode qr-scanner
npm install chart.js react-chartjs-2
npm install @hookform/resolvers react-hook-form zod
npm install date-fns
npm install lucide-react

# Install ALL shadcn components (see CLAUDE.md for complete list)
npx shadcn-ui@latest add button input label textarea select checkbox radio-group switch table card dialog alert-dialog sheet form dropdown-menu popover tooltip badge alert avatar calendar date-picker tabs accordion navigation-menu breadcrumb pagination skeleton scroll-area separator toast progress command collapsible hover-card menubar context-menu
```

---

## Implementation Phases

### Phase 1: Project Setup & Authentication
1. Initialize Next.js project with TypeScript
2. Install and configure shadcn/ui, Tailwind CSS
3. Install ALL shadcn components
4. Set up Supabase project and environment variables
5. Create database tables and initial migration
6. Implement admin authentication system
7. Create protected route middleware
8. Build login/logout functionality

### Phase 2: Core Layout & Navigation
1. Create dashboard layout with sidebar
2. Implement notifications system
3. Add breadcrumb navigation
4. Create responsive design for mobile/tablet
5. Set up global error handling
6. Add loading states

### Phase 3: Patient Management System
1. Create patient list view with search and filters
2. Build patient registration form
3. Implement dynamic medical history fields
4. Add patient profile view
5. Create patient ID auto-generation (P001, P002, etc.)
6. Add patient deletion with confirmation
7. Implement patient medical history interface

### Phase 4: Appointment Management System
1. Build appointment calendar view
2. Create appointment booking form
3. Implement appointment status management
4. Add appointment conflict detection
5. Build email notification system using Resend
6. Create appointment reminder automation
7. Add appointment history

### Phase 5: Treatment & Procedures System
1. Create procedures management
2. Build treatment creation form
3. Implement multiple procedure selection
4. Add cost calculations
5. Create treatment history view
6. Add invoice/receipt generation
7. Implement treatment notes

### Phase 6: QR Code Patient Registration
1. Generate QR registration tokens
2. Create QR code display interface
3. Build patient self-registration form
4. Implement token validation
5. Add admin approval workflow
6. Create QR token management

### Phase 7: Analytics Dashboard
1. Create analytics overview
2. Build patient statistics charts
3. Add appointment analytics
4. Implement revenue tracking
5. Create procedure popularity analytics
6. Add export functionality

### Phase 8: Admin Profile & Settings
1. Build admin profile management
2. Create username/password change
3. Add system settings
4. Implement medical history fields management
5. Add clinic information settings
6. Create backup/export functionality

### Phase 9: Notifications & Email System
1. Implement real-time notifications
2. Create email templates for appointments
3. Add notification preferences
4. Build notification history
5. Implement appointment reminder scheduling
6. Add system health notifications

### Phase 10: Testing & Deployment
1. Write unit tests for critical components
2. Implement integration tests
3. Add error monitoring (Sentry)
4. Optimize performance and SEO
5. Set up CI/CD pipeline
6. Deploy to Vercel
7. Configure custom domain
8. Add monitoring and analytics

---

## Key Features Implementation

### Patient Management
- Auto-generated patient IDs (P001, P002, etc.)
- Comprehensive patient profiles
- Customizable medical history fields
- Patient search and filtering
- Patient appointment history
- Treatment history

### Appointment System
- Calendar view with status indicators
- Appointment scheduling with conflict detection
- Automated email reminders
- Multiple appointment statuses
- Appointment notes
- Recurring appointments support

### Treatment System
- Multiple procedure selection
- Cost calculation and tracking
- Payment status management
- Treatment notes
- Invoice generation
- Treatment history

### QR Registration System
- QR code generation for patient registration
- Registration token management
- Patient self-service registration form
- Admin approval workflow
- Token expiration and validation

### Analytics Dashboard
- Total patients, appointments, revenue metrics
- Patient age distribution charts
- Monthly revenue charts
- Appointment status breakdown
- Most common procedures analytics

---

## Security Considerations
1. Input validation and sanitization
2. SQL injection prevention (Supabase handles this)
3. XSS protection
4. CSRF protection
5. Rate limiting for API endpoints
6. Secure password hashing
7. JWT token validation
8. File upload restrictions
9. Environment variable security
10. QR token expiration and validation

---

## Performance Optimizations
1. Image optimization with Next.js Image component
2. Code splitting and lazy loading
3. Database query optimization
4. Caching strategies
5. Minimize bundle size
6. Server-side rendering where appropriate
7. Progressive Web App features
8. Offline capability for critical functions

---

## Deployment Checklist
1. Environment variables configured
2. Database migrations applied
3. SSL certificate configured
4. Custom domain setup
5. Error monitoring enabled
6. Analytics tracking implemented
7. Backup strategy in place
8. Performance monitoring active
9. Security headers configured
10. SEO optimization complete