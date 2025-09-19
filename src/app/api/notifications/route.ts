import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-local'
import { notificationSchema } from '@/lib/validations'

// GET /api/notifications - List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createClient()

    // Get notifications for the user (or all notifications for admin)
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // If no notifications table exists, return sample system notifications
    if (!notifications || notifications.length === 0) {
      const sampleNotifications = [
        {
          id: '1',
          title: 'Welcome to LAV Dentaire',
          message: 'Your clinic management system is ready to use',
          type: 'system',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'System Update',
          message: 'Patient management and appointment features are now available',
          type: 'system',
          is_read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        }
      ]

      return NextResponse.json({
        notifications: sampleNotifications,
        unreadCount: sampleNotifications.filter(n => !n.is_read).length
      })
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    return NextResponse.json({
      notifications,
      unreadCount
    })
  } catch (error) {
    console.error('Notifications GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = notificationSchema.parse(body)

    const supabase = await createClient()

    const notificationData = {
      ...validatedData,
      user_id: user.id,
      is_read: false,
      created_at: new Date().toISOString(),
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Notifications POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await getCurrentUser(token)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only mark their own notifications

    if (error) {
      console.error('Error marking notification as read:', error)
      return NextResponse.json(
        { error: 'Failed to mark notification as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notifications PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}