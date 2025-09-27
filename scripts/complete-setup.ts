import { createClient } from '@supabase/supabase-js';
import { PROCEDURES } from '../src/lib/constants';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Starting LAV Dentaire Complete Setup...\n');

  try {
    // Step 1: Read and execute schema
    console.log('📝 Step 1: Setting up database schema...');
    const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
    
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      console.log('   - Schema file found');
      console.log('   ⚠️  Please run the schema.sql file in your Supabase SQL editor');
      console.log('   📍 Go to: https://supabase.com/dashboard/project/zxjhhyzcueooxayfarfe/sql/new');
      console.log('   📋 Copy and paste the contents of supabase/schema.sql\n');
    } else {
      console.error('   ❌ Schema file not found');
    }

    // Step 2: Create admin user
    console.log('👤 Step 2: Creating admin user...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@lavdentaire.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

    try {
      // Check if admin already exists
      const { data: existingAdmin } = await supabase
        .from('admins')
        .select('email')
        .eq('email', adminEmail)
        .single();

      if (existingAdmin) {
        console.log('   ✓ Admin user already exists');
      } else {
        // Create admin user via auth
        const { data: adminUser, error: authError } = await supabase.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
        });

        if (authError && !authError.message.includes('already been registered')) {
          throw authError;
        }

        if (adminUser) {
          // Insert admin record
          const { error: adminError } = await supabase
            .from('admins')
            .insert([{
              id: adminUser.user.id,
              email: adminEmail,
              username: 'admin',
            }]);

          if (adminError && !adminError.message.includes('duplicate')) {
            console.error('   ⚠️  Warning: Could not create admin record:', adminError.message);
          } else {
            console.log('   ✓ Admin user created successfully');
          }
        }
      }

      console.log(`   📧 Email: ${adminEmail}`);
      console.log(`   🔑 Password: ${adminPassword}`);
    } catch (error: any) {
      if (error.message?.includes('already been registered')) {
        console.log('   ✓ Admin user already exists');
      } else {
        console.error('   ⚠️  Admin creation warning:', error.message);
      }
    }

    // Step 3: Seed procedures
    console.log('\n💊 Step 3: Seeding dental procedures...');
    let procedureCount = 0;
    let categoryCount = 0;

    for (const [category, procedures] of Object.entries(PROCEDURES)) {
      categoryCount++;
      console.log(`   📁 ${category}`);
      
      for (const procedure of procedures) {
        try {
          const { error } = await supabase
            .from('procedures')
            .upsert([{
              category,
              name: procedure.name,
              price: procedure.price,
              description: `${category} - ${procedure.name}`,
            }], { 
              onConflict: 'name',
              ignoreDuplicates: false 
            });

          if (!error) {
            procedureCount++;
            console.log(`      ✓ ${procedure.name} - ₱${procedure.price.toLocaleString()}`);
          }
        } catch (err) {
          // Continue on error
        }
      }
    }

    console.log(`\n   ✓ Seeded ${procedureCount} procedures across ${categoryCount} categories`);

    // Step 4: Create sample data (optional)
    console.log('\n📊 Step 4: Creating sample data...');
    const createSampleData = false; // Set to true if you want sample data

    if (createSampleData) {
      // Create a sample approved patient
      const { data: samplePatient, error: patientError } = await supabase
        .from('patients')
        .insert([{
          first_name: 'Juan',
          last_name: 'Dela Cruz',
          email: 'juan.delacruz@example.com',
          mobile_no: '09171234567',
          birthdate: '1990-01-15',
          age: 34,
          sex: 'male',
          address: 'Manila, Philippines',
          registration_status: 'approved',
          is_good_health: true,
          informed_consent_signed: true,
          approved_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (samplePatient && !patientError) {
        console.log('   ✓ Sample patient created');

        // Create a sample appointment
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const { error: appointmentError } = await supabase
          .from('appointments')
          .insert([{
            patient_id: samplePatient.id,
            appointment_date: tomorrow.toISOString().split('T')[0],
            appointment_time: '14:00:00',
            status: 'scheduled',
            notes: 'Regular checkup',
          }]);

        if (!appointmentError) {
          console.log('   ✓ Sample appointment created');
        }
      }
    } else {
      console.log('   ℹ️  Skipping sample data creation');
    }

    // Step 5: Verify setup
    console.log('\n✅ Step 5: Verifying setup...');
    
    // Check tables
    const tables = ['patients', 'appointments', 'treatments', 'procedures', 'admins'];
    let tablesOk = true;
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ Table '${table}' - Not found`);
        tablesOk = false;
      } else {
        console.log(`   ✓ Table '${table}' - OK (${count || 0} records)`);
      }
    }

    // Final status
    console.log('\n' + '='.repeat(60));
    if (tablesOk) {
      console.log('🎉 Setup completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. If tables are missing, run the schema.sql in Supabase SQL editor');
      console.log('2. Start the development server: npm run dev');
      console.log('3. Access the admin portal: http://localhost:3000/login');
      console.log(`4. Login with: ${adminEmail} / ${adminPassword}`);
      console.log('5. QR code for patient registration will be in the admin sidebar');
    } else {
      console.log('⚠️  Setup completed with warnings');
      console.log('\n❗ IMPORTANT: Some tables are missing!');
      console.log('1. Go to Supabase SQL editor:');
      console.log('   https://supabase.com/dashboard/project/zxjhhyzcueooxayfarfe/sql/new');
      console.log('2. Copy and run the contents of supabase/schema.sql');
      console.log('3. Run this script again: npm run setup:complete');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase().catch(console.error);