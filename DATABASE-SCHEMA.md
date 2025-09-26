-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  appointment_date date NOT NULL,
  appointment_time time without time zone NOT NULL,
  duration_minutes integer DEFAULT 60,
  status character varying DEFAULT 'scheduled'::character varying,
  reason text,
  notes text,
  email_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  reminder_24h_sent_at timestamp with time zone,
  reminder_day_of_sent_at timestamp with time zone,
  reminder_count integer DEFAULT 0,
  reminder_status text DEFAULT 'pending'::text CHECK (reminder_status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text, 'disabled'::text])),
  patient_reminder_preference text DEFAULT 'email'::text CHECK (patient_reminder_preference = ANY (ARRAY['email'::text, 'sms'::text, 'none'::text, 'both'::text])),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id)
);
CREATE TABLE public.medical_history_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  field_name character varying NOT NULL,
  field_type character varying DEFAULT 'checkbox'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT medical_history_fields_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type character varying NOT NULL,
  title character varying NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.admin_users(id)
);
CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  middle_name character varying,
  date_of_birth date,
  gender character varying,
  phone character varying,
  email character varying,
  address text,
  emergency_contact_name character varying,
  emergency_contact_phone character varying,
  medical_history jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT patients_pkey PRIMARY KEY (id)
);
CREATE TABLE public.procedures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  default_cost numeric,
  estimated_duration integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT procedures_pkey PRIMARY KEY (id)
);
CREATE TABLE public.qr_registration_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token character varying NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT qr_registration_tokens_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reminder_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reminder_type text NOT NULL CHECK (reminder_type = ANY (ARRAY['24_hour'::text, 'day_of'::text, 'custom'::text])),
  hours_before integer NOT NULL,
  is_enabled boolean DEFAULT true,
  email_template_subject text NOT NULL,
  email_template_body text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reminder_config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reminder_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  reminder_type text NOT NULL,
  sent_at timestamp with time zone DEFAULT now(),
  status text NOT NULL CHECK (status = ANY (ARRAY['sent'::text, 'failed'::text, 'bounced'::text])),
  email_address text,
  error_message text,
  resend_message_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reminder_logs_pkey PRIMARY KEY (id),
  CONSTRAINT reminder_logs_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);
CREATE TABLE public.treatment_procedures (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  treatment_id uuid,
  procedure_id uuid,
  quantity integer DEFAULT 1,
  cost_per_unit numeric,
  total_cost numeric,
  tooth_number character varying,
  notes text,
  CONSTRAINT treatment_procedures_pkey PRIMARY KEY (id),
  CONSTRAINT treatment_procedures_treatment_id_fkey FOREIGN KEY (treatment_id) REFERENCES public.treatments(id),
  CONSTRAINT treatment_procedures_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedures(id)
);
CREATE TABLE public.treatments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  appointment_id uuid,
  treatment_date date NOT NULL,
  total_cost numeric DEFAULT 0,
  payment_status character varying DEFAULT 'pending'::character varying,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT treatments_pkey PRIMARY KEY (id),
  CONSTRAINT treatments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT treatments_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id)
);