// Quick script to update admin email for testing
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateAdminEmail() {
  const { data, error } = await supabase
    .from('admin_users')
    .update({ email: 'christiandavesb@gmail.com' })
    .eq('email', 'lavdentaire.dc@gmail.com')
    .select()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Updated admin email:', data)
  }
}

updateAdminEmail()