import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get total patients count
    const { count: totalPatients, error: patientsError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })

    if (patientsError) {
      console.error('Error fetching patients count:', patientsError)
      throw new Error('Failed to fetch patients count')
    }

    // Get today's appointments count
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    const { count: todayAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today)

    if (appointmentsError && appointmentsError.code !== 'PGRST116') {
      console.error('Error fetching appointments count:', appointmentsError)
      // Don't throw error for appointments, just set to 0 if table doesn't exist
    }

    // Get monthly revenue (current month)
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    const { data: treatments, error: treatmentsError } = await supabase
      .from('treatments')
      .select('total_cost')
      .gte('treatment_date', `${currentMonth}-01`)
      .lt('treatment_date', `${currentMonth}-32`)

    if (treatmentsError && treatmentsError.code !== 'PGRST116') {
      console.error('Error fetching treatments:', treatmentsError)
      // Don't throw error for treatments, just set to 0 if table doesn't exist
    }

    const monthlyRevenue = treatments?.reduce((sum, treatment) => sum + (treatment.total_cost || 0), 0) || 0

    // Get active procedures count
    const { count: activeProcedures, error: proceduresError } = await supabase
      .from('procedures')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (proceduresError && proceduresError.code !== 'PGRST116') {
      console.error('Error fetching procedures count:', proceduresError)
      // Don't throw error for procedures, just set to 0 if table doesn't exist
    }

    // Calculate progress metrics
    const patientProgress = Math.min(Math.round((totalPatients || 0) / 100 * 100), 100) // Progress towards 100 patients
    const dailyScheduleProgress = Math.min(Math.round((todayAppointments || 0) / 8 * 100), 100) // Progress towards 8 daily slots
    const monthlyRevenueProgress = Math.min(Math.round((monthlyRevenue || 0) / 50000 * 100), 100) // Progress towards ₱50,000 monthly target

    const stats = {
      totalPatients: totalPatients || 0,
      todayAppointments: todayAppointments || 0,
      monthlyRevenue: monthlyRevenue || 0,
      activeProcedures: activeProcedures || 0,
      progress: {
        patients: patientProgress,
        dailySchedule: dailyScheduleProgress,
        monthlyRevenue: monthlyRevenueProgress,
        procedures: activeProcedures ? 100 : 0 // 100% if any procedures exist, 0% if none
      },
      targets: {
        patients: 100,
        dailySlots: 8,
        monthlyRevenue: 50000
      },
      metadata: {
        currentDate: today,
        currentMonth,
        lastUpdated: new Date().toISOString()
      }
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}