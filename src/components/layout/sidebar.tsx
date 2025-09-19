'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/lib/contexts/sidebar-context'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Settings,
  UserCircle
} from 'lucide-react'
import Image from 'next/image'

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Patients',
    href: '/patients',
    icon: Users,
  },
  {
    title: 'Appointments',
    href: '/appointments',
    icon: Calendar,
  },
  {
    title: 'Treatments',
    href: '/treatments',
    icon: FileText,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: UserCircle,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()

  return (
    <TooltipProvider>
      <div className={cn(
        'flex h-full flex-col border-r bg-card transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}>
        {/* Header */}
        <div className="py-6 px-6">
          <div className="relative flex items-center h-10">
            <div className="absolute left-0 flex h-10 w-10 items-center justify-center">
              <Image
                src="/lav-dentaire-logo.svg"
                alt="LAV Dentaire Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>
            <div className={cn(
              "absolute left-14 space-y-1 overflow-hidden transition-all duration-300 ease-in-out",
              isCollapsed
                ? "w-0 opacity-0"
                : "w-auto opacity-100"
            )}>
              <h2 className="text-lg font-semibold whitespace-nowrap">LAV Dentaire</h2>
              <p className="text-sm text-muted-foreground whitespace-nowrap">Dental Clinic</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <ScrollArea className={cn("flex-1", isCollapsed ? "px-3" : "px-3")}>
          <div className={cn("py-4", isCollapsed ? "space-y-2" : "space-y-1")}>
            {navigationItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className="w-full h-10 relative transition-all duration-200 ease-in-out"
                      asChild
                    >
                      <Link href={item.href}>
                        <div className="absolute left-3 flex items-center justify-center">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className={cn(
                          "absolute left-11 truncate whitespace-nowrap transition-all duration-300 ease-in-out",
                          isCollapsed
                            ? "w-0 opacity-0 overflow-hidden"
                            : "w-auto opacity-100"
                        )}>
                          {item.title}
                        </span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" className="font-medium">
                      {item.title}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="py-4 px-4">
          <div className="relative h-4 flex items-center text-xs text-muted-foreground">
            <div className="absolute left-2 h-2 w-2 rounded-full bg-primary" />
            <span className={cn(
              "absolute left-6 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out",
              isCollapsed
                ? "w-0 opacity-0"
                : "w-auto opacity-100"
            )}>
              Phase 2 Complete
            </span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}