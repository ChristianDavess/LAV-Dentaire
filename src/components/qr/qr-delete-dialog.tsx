'use client'

import React, { useState } from 'react'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { useQRTokens } from '@/hooks/use-qr-tokens'
import {
  Infinity,
  Users,
  Shield,
  AlertTriangle,
  Trash2,
  Loader2
} from 'lucide-react'

interface QRDeleteDialogProps {
  token: {
    id: string
    qr_type: string
    usage_count: number
    used: boolean
    reusable: boolean
    token: string
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function QRDeleteDialog({ token, open, onOpenChange, onSuccess }: QRDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const { deleteToken } = useQRTokens()
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!token) return

    setIsDeleting(true)

    try {
      await deleteToken(token.id)

      toast({
        title: "QR Token Deleted",
        description: `${getQRTypeInfo(token.qr_type).label} has been deleted successfully.`
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: "Failed to delete QR token. Please try again."
      })
    } finally {
      setIsDeleting(false)
      setConfirmed(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      setConfirmed(false)
    }
  }

  const getQRTypeInfo = (qrType: string) => {
    switch (qrType) {
      case 'generic':
        return {
          icon: Infinity,
          label: 'Generic QR Code',
          color: 'text-primary',
          bgColor: 'bg-primary/10'
        }
      case 'reusable':
        return {
          icon: Users,
          label: 'Reusable QR Token',
          color: 'text-primary',
          bgColor: 'bg-primary/10'
        }
      case 'single-use':
        return {
          icon: Shield,
          label: 'Single-use QR Token',
          color: 'text-primary',
          bgColor: 'bg-primary/10'
        }
      default:
        return {
          icon: Shield,
          label: 'QR Token',
          color: 'text-muted-foreground',
          bgColor: 'bg-muted/10'
        }
    }
  }

  const getDeleteWarning = () => {
    if (!token) return null

    const typeInfo = getQRTypeInfo(token.qr_type)

    switch (token.qr_type) {
      case 'generic':
        return {
          severity: 'high',
          title: 'Delete Permanent QR Code?',
          message: 'This is a permanent clinic QR code that never expires. Deleting it will remove access for all patients using this QR code.',
          consequences: [
            'Patients will no longer be able to register using this QR code',
            'Any printed materials with this QR code will become invalid',
            'This action cannot be undone'
          ],
          confirmText: 'I understand this will disable all existing printed QR codes'
        }

      case 'reusable':
        return {
          severity: token.usage_count > 0 ? 'medium' : 'low',
          title: 'Delete Reusable QR Token?',
          message: token.usage_count > 0 ?
            `This reusable QR token has been used ${token.usage_count} time${token.usage_count !== 1 ? 's' : ''}. Deleting it will prevent future registrations.` :
            'This reusable QR token hasn\'t been used yet. Are you sure you want to delete it?',
          consequences: token.usage_count > 0 ? [
            'No more patients can register using this QR code',
            `Registration history for ${token.usage_count} patient${token.usage_count !== 1 ? 's' : ''} will be preserved`,
            'Any active campaign materials will become invalid'
          ] : [
            'This unused QR token will be permanently removed',
            'Any distributed materials with this QR code will become invalid'
          ],
          confirmText: token.usage_count > 0 ?
            'I understand this will disable an active QR token' :
            'I want to delete this unused QR token'
        }

      case 'single-use':
        return {
          severity: 'low',
          title: 'Delete Single-use QR Token?',
          message: token.used ?
            'This single-use QR token has already been used and can be safely deleted.' :
            'This single-use QR token hasn\'t been used yet. Deleting it will prevent the intended patient from registering.',
          consequences: token.used ? [
            'This will clean up your QR token list',
            'Patient registration data will be preserved'
          ] : [
            'The intended recipient will not be able to register',
            'You may need to create a new QR code for them'
          ],
          confirmText: token.used ?
            'Delete this used QR token' :
            'I understand the recipient cannot register with this QR code'
        }

      default:
        return {
          severity: 'medium',
          title: 'Delete QR Token?',
          message: 'Are you sure you want to delete this QR token?',
          consequences: ['This action cannot be undone'],
          confirmText: 'I want to delete this QR token'
        }
    }
  }

  if (!token) return null

  const typeInfo = getQRTypeInfo(token.qr_type)
  const warning = getDeleteWarning()
  const TypeIcon = typeInfo.icon

  const needsConfirmation = warning?.severity === 'high' ||
    (warning?.severity === 'medium' && token.usage_count > 0)

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${typeInfo.bgColor} ${typeInfo.color}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold">
                {warning?.title}
              </AlertDialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  <TypeIcon className="h-3 w-3 mr-1" />
                  {typeInfo.label}
                </Badge>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                  {token.token.substring(0, 8)}...
                </code>
              </div>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {warning?.message}
          </AlertDialogDescription>

          {warning && (
            <Alert variant={warning.severity === 'high' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">This will:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {warning.consequences.map((consequence, index) => (
                      <li key={index}>{consequence}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {token.qr_type !== 'single-use' || !token.used ? (
            <div className="bg-muted/30 p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Usage Information:</p>
              <p className="text-muted-foreground">
                {token.reusable ?
                  `Used ${token.usage_count} time${token.usage_count !== 1 ? 's' : ''}` :
                  token.used ? 'Already used' : 'Not yet used'
                }
              </p>
            </div>
          ) : null}

          {needsConfirmation && (
            <div className="flex items-start space-x-2">
              <Checkbox
                id="confirm-delete"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <label
                htmlFor="confirm-delete"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {warning?.confirmText}
              </label>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || (needsConfirmation && !confirmed)}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete QR Token
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}