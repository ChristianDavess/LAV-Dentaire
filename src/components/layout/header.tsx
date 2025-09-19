'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, LogOut, UserCircle, Settings, Menu } from 'lucide-react'
import { useSidebar } from '@/lib/contexts/sidebar-context'
import { MobileNav } from './mobile-nav'
import { BreadcrumbNav } from './breadcrumb-nav'
import { LogoutDialog } from '@/components/forms/logout-dialog'

interface User {
  id: string
  username: string
  email: string
}

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { toggle } = useSidebar()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')

      if (!response.ok) {
        // If unauthorized or other errors, use sample notifications
        console.warn('Failed to fetch notifications from API, using sample data')
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
            message: 'Patient management features are now available',
            type: 'system',
            is_read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          }
        ]
        setNotifications(sampleNotifications)
        setUnreadCount(sampleNotifications.filter(n => !n.is_read).length)
        return
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.warn('Error fetching notifications, using fallback:', error)
      // Use sample notifications on any error
      const sampleNotifications = [
        {
          id: '1',
          title: 'Welcome to LAV Dentaire',
          message: 'Your clinic management system is ready to use',
          type: 'system',
          is_read: false,
          created_at: new Date().toISOString(),
        }
      ]
      setNotifications(sampleNotifications)
      setUnreadCount(1)
    }
  }

  const markAsRead = async (notificationId: string) => {
    // Always update UI immediately for better UX
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))

    // Try to update on server, but don't block UI
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'PUT',
      })
    } catch (error) {
      console.warn('Could not update notification on server:', error)
      // UI is already updated, so this is just a warning
    }
  }

  const markAllAsRead = async () => {
    // Always update UI immediately for better UX
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true }))
    )
    setUnreadCount(0)

    // Try to update on server, but don't block UI
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read)
      await Promise.all(
        unreadNotifications.map(notification =>
          fetch(`/api/notifications?id=${notification.id}`, {
            method: 'PUT',
          })
        )
      )
    } catch (error) {
      console.warn('Could not update all notifications on server:', error)
      // UI is already updated, so this is just a warning
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card backdrop-blur supports-[backdrop-filter]:bg-card/95">
      <div className="flex h-16 items-center px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="hidden md:flex"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          {/* Mobile Navigation */}
          <div className="flex md:hidden">
            <MobileNav />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-6">
          <div className="flex-1">
            <BreadcrumbNav />
          </div>
          <nav className="flex items-center space-x-3">
            {/* Notifications Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">View notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-96">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start space-y-2 p-4 cursor-pointer hover:bg-accent focus:bg-accent"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex w-full items-start justify-between">
                          <div className="font-medium text-sm">{notification.title}</div>
                          {!notification.is_read && (
                            <Badge variant="default" className="h-2 w-2 rounded-full p-0" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          {notification.message}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
                {notifications.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <Button variant="ghost" size="sm" className="w-full text-xs" onClick={markAllAsRead}>
                        Mark all as read
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user.username} />
                    <AvatarFallback className="text-sm font-medium">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <LogoutDialog>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </LogoutDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  )
}