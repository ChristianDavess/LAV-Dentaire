'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface LogoutDialogProps {
  children: React.ReactNode
}

export function LogoutDialog({ children }: LogoutDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast({
          title: "Logged out successfully",
          description: "You have been securely logged out.",
        })
        router.push('/login')
        router.refresh()
      } else {
        throw new Error('Logout failed')
      }
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold">
            <LogOut className="h-4 w-4 text-destructive" />
            Confirm Logout
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to log out? You will need to sign in again to access the dashboard.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}