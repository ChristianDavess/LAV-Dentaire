'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Home } from 'lucide-react'

const pathNames: Record<string, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  appointments: 'Appointments',
  treatments: 'Treatments',
  analytics: 'Analytics',
  profile: 'Profile',
  settings: 'Settings',
}

export function BreadcrumbNav() {
  const pathname = usePathname()
  const pathSegments = pathname.split('/').filter(Boolean)

  if (pathSegments.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-300 w-fit">
      <Breadcrumb>
        <BreadcrumbList className="gap-1">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                href="/dashboard"
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-background/80 transition-all duration-300 hover:scale-105 group"
              >
                <Home className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="sr-only">Dashboard</span>
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {pathSegments.map((segment, index) => {
            const href = '/' + pathSegments.slice(0, index + 1).join('/')
            const isLast = index === pathSegments.length - 1
            const displayName = pathNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

            return (
              <div key={href} className="flex items-center gap-1">
                <BreadcrumbSeparator className="text-muted-foreground/60" />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="font-semibold text-foreground px-2 py-1">
                      {displayName}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link
                        href={href}
                        className="px-2 py-1 rounded-md hover:bg-background/80 transition-all duration-300 hover:scale-105 text-muted-foreground hover:text-primary font-medium"
                      >
                        {displayName}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}