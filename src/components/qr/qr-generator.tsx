'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useQRTokens } from '@/hooks/use-qr-tokens'
import QRCode from 'qrcode'
import Image from 'next/image'
import {
  QrCode,
  Download,
  Copy,
  Clock,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Share2,
  Calendar,
  Infinity,
  Users,
  Shield
} from 'lucide-react'
import { getQRBaseUrl } from '@/lib/utils/url'

interface QRGeneratorProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

const EXPIRATION_OPTIONS = [
  { value: 1, label: '1 Hour' },
  { value: 6, label: '6 Hours' },
  { value: 24, label: '1 Day' },
  { value: 72, label: '3 Days' },
  { value: 168, label: '1 Week' },
  { value: 0, label: 'Custom' }
]

const QR_TYPE_OPTIONS = [
  {
    value: 'generic',
    label: 'Generic QR Code',
    description: 'Permanent clinic QR code that never expires. Best for reception areas and printed materials.',
    icon: Infinity,
    badge: 'Permanent',
    badgeVariant: 'default' as const
  },
  {
    value: 'reusable',
    label: 'Reusable QR Token',
    description: 'Multi-use QR with expiration. Multiple patients can register with the same code.',
    icon: Users,
    badge: 'Multi-use',
    badgeVariant: 'secondary' as const
  },
  {
    value: 'single-use',
    label: 'Single-use QR Token',
    description: 'One-time use QR with expiration. Perfect for individual patient invitations.',
    icon: Shield,
    badge: 'Single-use',
    badgeVariant: 'outline' as const
  }
]

type QRType = 'generic' | 'reusable' | 'single-use'


export function QRGenerator({ trigger, onSuccess }: QRGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [qrType, setQrType] = useState<QRType>('generic')
  const [expirationHours, setExpirationHours] = useState<number>(24)
  const [customHours, setCustomHours] = useState<number>(48)
  const [note, setNote] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [generatedToken, setGeneratedToken] = useState<any>(null)
  const [step, setStep] = useState<'configure' | 'generated'>('configure')

  const { generateToken, isLoading, error } = useQRTokens()
  const { toast } = useToast()

  const defaultTrigger = (
    <Button>
      <QrCode className="mr-2 h-4 w-4" />
      Generate QR Code
    </Button>
  )

  const handleGenerate = async () => {
    try {
      let tokenData: any = null
      let registrationUrl: string

      if (qrType === 'generic') {
        // Generate generic token via API (with expiration_hours = 0)
        tokenData = await generateToken({
          expiration_hours: 0, // Special flag for generic tokens
          note: note.trim() || undefined,
          qr_type: 'generic',
          reusable: true
        })
        registrationUrl = tokenData.registration_url
      } else {
        // Generate token for reusable or single-use QRs
        const finalHours = expirationHours === 0 ? customHours : expirationHours
        tokenData = await generateToken({
          expiration_hours: finalHours,
          note: note.trim() || undefined,
          qr_type: qrType,
          reusable: qrType === 'reusable'
        })
        registrationUrl = tokenData.registration_url
      }

      // Generate QR code image
      const qrOptions = {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }

      const dataUrl = await QRCode.toDataURL(registrationUrl, qrOptions)

      setGeneratedToken(tokenData)
      setQrDataUrl(dataUrl)
      setStep('generated')

      toast({
        title: "QR Code Generated",
        description: `${QR_TYPE_OPTIONS.find(o => o.value === qrType)?.label} has been created successfully.`
      })

      onSuccess?.()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error || "Failed to generate QR code. Please try again."
      })
    }
  }

  const handleCopyLink = async () => {
    if (generatedToken?.registration_url) {
      try {
        await navigator.clipboard.writeText(generatedToken.registration_url)
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
  }

  const handleDownloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a')
      link.download = `qr-patient-registration-${new Date().toISOString().split('T')[0]}.png`
      link.href = qrDataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "QR Downloaded",
        description: "QR code image has been downloaded successfully."
      })
    }
  }

  const handleReset = () => {
    setStep('configure')
    setGeneratedToken(null)
    setQrDataUrl(null)
    setNote('')
    setQrType('generic')
    setExpirationHours(24)
    setCustomHours(48)
  }

  const handleClose = () => {
    setIsOpen(false)
    setTimeout(() => {
      if (step === 'generated') {
        handleReset()
      }
    }, 200) // Small delay to prevent visual glitch
  }

  const formatExpirationTime = (hours: number): string => {
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`
    } else if (hours < 168) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return remainingHours === 0
        ? `${days} day${days !== 1 ? 's' : ''}`
        : `${days} day${days !== 1 ? 's' : ''} ${remainingHours}h`
    } else {
      const weeks = Math.floor(hours / 168)
      return `${weeks} week${weeks !== 1 ? 's' : ''}`
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {step === 'configure' ? 'Generate QR Code' : 'QR Code Generated'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {step === 'configure'
                  ? 'Create a QR code for patient self-registration'
                  : 'Share this QR code with patients for registration'
                }
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

        {step === 'configure' && (
          <div className="space-y-6">
            {/* QR Type Selection */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <QrCode className="h-4 w-4" />
                  </div>
                  QR Code Type
                </CardTitle>
                <CardDescription>
                  Choose the type of QR code based on your needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  {QR_TYPE_OPTIONS.map((option) => {
                    const IconComponent = option.icon
                    return (
                      <div
                        key={option.value}
                        className={`relative flex cursor-pointer select-none items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-accent hover:text-accent-foreground ${
                          qrType === option.value ? 'border-primary bg-accent' : 'border-border'
                        }`}
                        onClick={() => setQrType(option.value as QRType)}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold">{option.label}</h4>
                            <Badge variant={option.badgeVariant}>{option.badge}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{option.description}</p>
                        </div>
                        <div className={`h-4 w-4 rounded-full border ${
                          qrType === option.value ? 'border-primary bg-primary' : 'border-border'
                        }`}>
                          {qrType === option.value && (
                            <div className="h-full w-full rounded-full bg-primary-foreground scale-50" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  Configuration
                </CardTitle>
                <CardDescription>
                  {qrType === 'generic'
                    ? 'Add an optional note for reference'
                    : 'Set expiration time and optional note for the QR code'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              {qrType !== 'generic' && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Expiration Time</Label>
                  <Select value={expirationHours.toString()} onValueChange={(value) => setExpirationHours(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select expiration time" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPIRATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {expirationHours === 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Custom Hours</Label>
                      <Input
                        type="number"
                        min="1"
                        max="168"
                        value={customHours}
                        onChange={(e) => setCustomHours(Number(e.target.value))}
                        placeholder="Enter hours (1-168)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum 168 hours (1 week)
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Expires in {formatExpirationTime(expirationHours === 0 ? customHours : expirationHours)}
                    </span>
                  </div>
                </div>
              )}

              {qrType === 'generic' && (
                <div className="flex items-center gap-2 text-sm p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <Infinity className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">
                    This QR code never expires and can be used by unlimited patients
                  </span>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Note (Optional)</Label>
                <Input
                  placeholder="Add a note for reference..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {note.length}/100 characters
                </p>
              </div>
            </CardContent>
            </Card>
          </div>
        )}

        {step === 'generated' && generatedToken && (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  QR Code Ready
                </CardTitle>
                <CardDescription>
                  Scan or share this QR code with patients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-xl border-2 border-dashed border-muted shadow-sm">
                    {qrDataUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={qrDataUrl}
                        alt="QR Code for Patient Registration"
                        className="w-64 h-64 object-contain"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">QR Type</p>
                      <div className="flex items-center gap-2">
                        <Badge variant={QR_TYPE_OPTIONS.find(o => o.value === qrType)?.badgeVariant}>
                          {QR_TYPE_OPTIONS.find(o => o.value === qrType)?.badge}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {qrType === 'generic' ? 'Status' : 'Expires'}
                      </p>
                      <div className="flex items-center gap-2">
                        {qrType === 'generic' ? (
                          <Badge variant="default" className="text-xs">
                            <Infinity className="mr-1 h-3 w-3" />
                            Never expires
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {formatExpirationTime(generatedToken.expiration_hours)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {note && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Note</p>
                      <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                        {note}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-3">
                    <Button onClick={handleCopyLink} variant="outline" className="flex-1">
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Link
                    </Button>
                    <Button onClick={handleDownloadQR} variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download QR
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t">
          {step === 'generated' ? (
            <>
              <Button variant="outline" onClick={handleReset}>
                Generate Another
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={
                  isLoading ||
                  (qrType !== 'generic' && expirationHours === 0 && (customHours < 1 || customHours > 168))
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}