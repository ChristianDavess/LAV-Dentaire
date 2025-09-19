const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function updateAdminEmail() {
  console.log('Updating admin email from lavdentaire.dc@gmail.com to christiandavesb@gmail.com...')

  const { data, error } = await supabase
    .from('admin_users')
    .update({ email: 'christiandavesb@gmail.com' })
    .eq('email', 'lavdentaire.dc@gmail.com')
    .select()

  if (error) {
    console.error('Error updating admin email:', error)
  } else {
    console.log('Successfully updated admin email:', data)
  }
}

updateAdminEmail()