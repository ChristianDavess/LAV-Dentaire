'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-muted/50 hover:scale-105 transition-all duration-300 rounded-lg"
        >
          <Menu className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-90' : ''}`} />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-72 border-r shadow-lg backdrop-blur-sm bg-background/95 supports-[backdrop-filter]:bg-background/90"
      >
        <div className="h-full">
          <Sidebar />
        </div>
      </SheetContent>
    </Sheet>
  )
}