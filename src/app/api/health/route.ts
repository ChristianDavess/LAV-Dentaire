import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: false,
      database: false,
      auth: false,
      email: false,
    },
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasFromEmail: !!process.env.FROM_EMAIL,
    },
    tables: {
      admins: false,
      patients: false,
      appointments: false,
      treatments: false,
      procedures: false,
      treatment_procedures: false,
      notifications: false,
    },
  };

  try {
    // Check API is running
    health.services.api = true;

    // Check database connection
    const supabase = await createServiceClient();
    
    // Test database by checking tables
    const tables = Object.keys(health.tables);
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          health.tables[table as keyof typeof health.tables] = true;
        }
      } catch (err) {
        // Table doesn't exist or error
      }
    }

    // If at least one table exists, database is connected
    health.services.database = Object.values(health.tables).some(v => v);

    // Check auth service
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      health.services.auth = !error;
    } catch (err) {
      health.services.auth = false;
    }

    // Check email service (just verify key exists)
    health.services.email = !!process.env.RESEND_API_KEY && !!process.env.FROM_EMAIL;

    // Determine overall health
    const allServicesHealthy = Object.values(health.services).every(v => v);
    const allTablesExist = Object.values(health.tables).every(v => v);
    const allEnvVarsSet = Object.values(health.environment).every(v => v);

    if (!allServicesHealthy || !allTablesExist || !allEnvVarsSet) {
      health.status = 'degraded';
    }

    return NextResponse.json(health, { 
      status: health.status === 'healthy' ? 200 : 503 
    });
  } catch (error: any) {
    health.status = 'unhealthy';
    return NextResponse.json({
      ...health,
      error: error.message,
    }, { status: 503 });
  }
}