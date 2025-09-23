'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useQRTokens } from '@/hooks/use-qr-tokens'
import QRCode from 'qrcode'
import {
  QrCode,
  Download,
  Copy,
  Calendar,
  Users,
  Shield,
  Infinity,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react'

interface QRViewerModalProps {
  tokenId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRViewerModal({ tokenId, open, onOpenChange }: QRViewerModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [tokenDetails, setTokenDetails] = useState<any>(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  const { fetchToken, isLoading, error } = useQRTokens()
  const { toast } = useToast()

  const generateQRCode = useCallback(async (url: string) => {
    setIsGeneratingQR(true)
    try {
      const qrOptions = {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }

      const dataUrl = await QRCode.toDataURL(url, qrOptions)
      setQrDataUrl(dataUrl)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "QR Generation Failed",
        description: "Failed to generate QR code image."
      })
    } finally {
      setIsGeneratingQR(false)
    }
  }, [toast])

  const loadTokenDetails = useCallback(async () => {
    if (!tokenId) return

    try {
      const details = await fetchToken(tokenId)
      setTokenDetails(details)
      await generateQRCode(details.registration_url)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to load QR code",
        description: error || "Could not load QR token details."
      })
    }
  }, [tokenId, fetchToken, error, toast, generateQRCode])

  // Load token details when modal opens
  useEffect(() => {
    if (open && tokenId) {
      loadTokenDetails()
    } else {
      // Reset state when modal closes
      setTokenDetails(null)
      setQrDataUrl(null)
    }
  }, [open, tokenId, loadTokenDetails])

  const handleCopyLink = async () => {
    if (!tokenDetails?.registration_url) return

    try {
      await navigator.clipboard.writeText(tokenDetails.registration_url)
      toast({
        title: "Link Copied",
        description: "Registration link has been copied to clipboard."
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy link to clipboard."
      })
    }
  }

  const handleDownloadQR = () => {
    if (!qrDataUrl || !tokenDetails) return

    const link = document.createElement('a')
    const fileName = `qr-${tokenDetails.qr_type}-${tokenDetails.token.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.png`
    link.download = fileName
    link.href = qrDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "QR Downloaded",
      description: "QR code image has been downloaded successfully."
    })
  }

  const getQRTypeInfo = (qrType: string) => {
    switch (qrType) {
      case 'generic':
        return {
          icon: Infinity,
          label: 'Generic QR Code',
          description: 'Permanent clinic QR code that never expires',
          badgeVariant: 'default' as const
        }
      case 'reusable':
        return {
          icon: Users,
          label: 'Reusable QR Token',
          description: 'Multi-use QR with expiration for campaigns',
          badgeVariant: 'secondary' as const
        }
      case 'single-use':
        return {
          icon: Shield,
          label: 'Single-use QR Token',
          description: 'One-time use QR for individual invitations',
          badgeVariant: 'outline' as const
        }
      default:
        return {
          icon: QrCode,
          label: qrType,
          description: 'QR Token',
          badgeVariant: 'outline' as const
        }
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: Clock, color: 'text-green-600', bgColor: 'bg-green-50', label: 'Active' }
      case 'used':
        return { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Used' }
      case 'expired':
        return { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Expired' }
      default:
        return { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-50', label: status }
    }
  }

  const formatExpirationTime = (expiresAt: string): string => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffMs = expiry.getTime() - now.getTime()

    if (diffMs <= 0) return 'Expired'

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24)
      return `${days}d ${diffHours % 24}h`
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    } else {
      return `${diffMinutes}m`
    }
  }

  if (!tokenDetails && !isLoading) {
    return null
  }

  const qrTypeInfo = tokenDetails ? getQRTypeInfo(tokenDetails.qr_type) : null
  const statusInfo = tokenDetails ? getStatusInfo(tokenDetails.status) : null
  const QRTypeIcon = qrTypeInfo?.icon
  const StatusIcon = statusInfo?.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                QR Code Details
              </DialogTitle>
              <DialogDescription className="text-base">
                View and manage your QR code
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tokenDetails && (
          <div className="space-y-6">
            {/* QR Code Display */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${statusInfo?.bgColor} ${statusInfo?.color}`}>
                    {StatusIcon && <StatusIcon className="h-4 w-4" />}
                  </div>
                  QR Code Ready
                </CardTitle>
                <CardDescription>
                  {qrTypeInfo?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-xl border-2 border-dashed border-muted shadow-sm">
                    {isGeneratingQR ? (
                      <div className="w-64 h-64 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : qrDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrDataUrl}
                        alt="QR Code for Patient Registration"
                        className="w-64 h-64 object-contain"
                      />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center text-muted-foreground">
                        Failed to generate QR code
                      </div>
                    )}
                  </div>
                </div>

                {/* Token Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">QR Type</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={qrTypeInfo?.badgeVariant}>
                          {QRTypeIcon && <QRTypeIcon className="h-3 w-3 mr-1" />}
                          {qrTypeInfo?.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Status</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusInfo?.color === 'text-green-600' ? 'default' :
                                     statusInfo?.color === 'text-blue-600' ? 'secondary' : 'destructive'}>
                          {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                          {statusInfo?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {tokenDetails.qr_type !== 'generic' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(tokenDetails.created_at).toLocaleDateString()} at{' '}
                          {new Date(tokenDetails.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {tokenDetails.is_expired ? 'Expired' : 'Expires'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {tokenDetails.is_expired ?
                            new Date(tokenDetails.expires_at).toLocaleDateString() :
                            `${formatExpirationTime(tokenDetails.expires_at)} remaining`
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-sm font-medium">Usage</p>
                    <p className="text-sm text-muted-foreground">
                      {tokenDetails.reusable ?
                        `${tokenDetails.usage_count} registrations completed` :
                        tokenDetails.used ? 'Token has been used' : 'Token not yet used'
                      }
                    </p>
                  </div>

                  {tokenDetails.qr_type === 'generic' && (
                    <Alert>
                      <Infinity className="h-4 w-4" />
                      <AlertDescription>
                        This is a permanent clinic QR code that never expires and can be used by unlimited patients.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleCopyLink} variant="outline" className="flex-1">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={handleDownloadQR}
                    variant="outline"
                    className="flex-1"
                    disabled={!qrDataUrl || isGeneratingQR}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download QR
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}