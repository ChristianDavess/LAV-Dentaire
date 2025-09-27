import { createClient } from '@supabase/supabase-js';
import { PROCEDURES } from '../src/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDatabase() {
  console.log('Starting database seed...');

  try {
    // 1. Create admin user
    console.log('Creating admin user...');
    const { data: adminUser, error: authError } = await supabase.auth.admin.createUser({
      email: process.env.ADMIN_EMAIL!,
      password: process.env.ADMIN_PASSWORD!,
      email_confirm: true,
    });

    if (authError && !authError.message.includes('already been registered')) {
      throw authError;
    }

    if (adminUser) {
      // Insert admin record
      const { error: adminError } = await supabase
        .from('admins')
        .upsert([
          {
            id: adminUser.user.id,
            email: process.env.ADMIN_EMAIL!,
            username: 'admin',
          },
        ], { onConflict: 'email' });

      if (adminError) {
        console.error('Error creating admin record:', adminError);
      }
    }

    // 2. Seed procedures
    console.log('Seeding procedures...');
    const proceduresToInsert = [];

    for (const [category, procedures] of Object.entries(PROCEDURES)) {
      for (const procedure of procedures) {
        proceduresToInsert.push({
          category,
          name: procedure.name,
          price: procedure.price,
          description: `${category} - ${procedure.name}`,
        });
      }
    }

    const { error: proceduresError } = await supabase
      .from('procedures')
      .upsert(proceduresToInsert, { 
        onConflict: 'name',
        ignoreDuplicates: true 
      });

    if (proceduresError) {
      console.error('Error seeding procedures:', proceduresError);
    }

    console.log('Database seed completed successfully!');
    console.log(`Admin credentials: ${process.env.ADMIN_EMAIL} / ${process.env.ADMIN_PASSWORD}`);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();