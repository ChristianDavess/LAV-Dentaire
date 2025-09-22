'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider } from '@/lib/contexts/sidebar-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { Skeleton } from '@/components/ui/skeleton'

interface User {
  id: string
  username: string
  email: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <div className="flex">
            <div className="hidden md:block w-64 border-r">
              <div className="p-4 space-y-4">
                <Skeleton className="h-8 w-32" />
                <div className="space-y-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="h-16 border-b">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <div className="flex h-screen">
          {/* Desktop Sidebar */}
          <div className="hidden md:flex flex-col border-r">
            <Sidebar />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header user={user} />
            <main className="flex-1 overflow-y-auto">
              <Suspense
                fallback={
                  <div className="p-6">
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  </div>
                }
              >
                {children}
              </Suspense>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}