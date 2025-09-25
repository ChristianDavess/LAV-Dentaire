'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { useQRTokens, getTokenStatus, getTimeUntilExpiration } from '@/hooks/use-qr-tokens'
import { QRGenerator } from './qr-generator'
import { QRViewerModal } from './qr-viewer-modal'
import { QRDeleteDialog } from './qr-delete-dialog'
import {
  QrCode,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Activity,
  AlertTriangle,
  Infinity,
  Users,
  Shield,
  Eye,
  MoreHorizontal
} from 'lucide-react'

interface QRTokenListProps {
  showHeader?: boolean
}

export function QRTokenList({ showHeader = true }: QRTokenListProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewingTokenId, setViewingTokenId] = useState<string | null>(null)
  const [deletingToken, setDeletingToken] = useState<any>(null)

  const {
    tokens,
    isLoading,
    error,
    fetchTokens,
    cleanupExpiredTokens,
    getTokenStats
  } = useQRTokens()

  const { toast } = useToast()

  // Load tokens on component mount
  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  // Filter tokens based on search and status
  const filteredTokens = tokens.filter(token => {
    const matchesSearch = searchTerm === '' ||
      token.token.toLowerCase().includes(searchTerm.toLowerCase())

    const tokenStatus = getTokenStatus(token)
    const matchesStatus = statusFilter === 'all' || tokenStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleCleanup = async () => {
    try {
      const result = await cleanupExpiredTokens()
      toast({
        title: "Cleanup Complete",
        description: `Removed ${result.cleaned_tokens} expired tokens.`
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Cleanup Failed",
        description: "Failed to clean up expired tokens."
      })
    }
  }

  const handleRefresh = () => {
    fetchTokens()
  }

  const getBadgeVariant = (status: 'active' | 'expired' | 'used') => {
    switch (status) {
      case 'active':
        return 'default'
      case 'used':
        return 'secondary'
      case 'expired':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: 'active' | 'expired' | 'used') => {
    switch (status) {
      case 'active':
        return <Clock className="h-3 w-3" />
      case 'used':
        return <CheckCircle2 className="h-3 w-3" />
      case 'expired':
        return <XCircle className="h-3 w-3" />
    }
  }

  const getQRTypeInfo = (qrType: string) => {
    switch (qrType) {
      case 'generic':
        return { icon: Infinity, label: 'Generic', badgeVariant: 'default' as const }
      case 'reusable':
        return { icon: Users, label: 'Reusable', badgeVariant: 'secondary' as const }
      case 'single-use':
        return { icon: Shield, label: 'Single-use', badgeVariant: 'outline' as const }
      default:
        return { icon: QrCode, label: qrType, badgeVariant: 'outline' as const }
    }
  }

  const stats = getTokenStats()

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">QR Registration Tokens</h2>
            <p className="text-muted-foreground">
              Manage QR codes for patient self-registration
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <QRGenerator onSuccess={handleRefresh} />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.used}</p>
                <p className="text-sm text-muted-foreground">Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.expired}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tokens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {stats.expired > 0 && (
                <Button variant="outline" onClick={handleCleanup} disabled={isLoading}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clean Expired ({stats.expired})
                </Button>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {filteredTokens.length} tokens
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tokens Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <QrCode className="h-4 w-4" />
            </div>
            Registration Tokens
          </CardTitle>
          <CardDescription>
            QR codes generated for patient self-registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTokens.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/30">
                  <QrCode className="h-10 w-10 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-semibold tracking-tight mb-2">
                {searchTerm ? 'No matching tokens' : 'No QR tokens yet'}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm
                  ? 'Try adjusting your search criteria or filter settings'
                  : 'Create QR codes to streamline patient registration. Choose from permanent clinic QR codes, reusable campaign tokens, or single-use invitations.'
                }
              </p>
              {!searchTerm && (
                <QRGenerator
                  trigger={
                    <Button>
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate First QR Code
                    </Button>
                  }
                  onSuccess={handleRefresh}
                />
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token ID</TableHead>
                    <TableHead>QR Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton rows
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        <TableCell className="py-4">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-16 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-8 rounded ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    filteredTokens.map((token) => {
                      const status = getTokenStatus(token)
                      const timeRemaining = getTimeUntilExpiration(token.expires_at)
                      const qrTypeInfo = getQRTypeInfo(token.qr_type)
                      const QRTypeIcon = qrTypeInfo.icon

                      return (
                        <TableRow key={token.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                {token.token.substring(0, 8)}...
                              </code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={qrTypeInfo.badgeVariant} className="gap-1">
                              <QRTypeIcon className="h-3 w-3" />
                              {qrTypeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getBadgeVariant(status)} className="gap-1">
                              {getStatusIcon(status)}
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {token.reusable ? (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  <span className="font-medium">{token.usage_count}</span>
                                  <span className="text-muted-foreground">uses</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Shield className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {token.used ? 'Used' : 'Unused'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div>{new Date(token.created_at).toLocaleDateString()}</div>
                              <div className="text-muted-foreground">
                                {new Date(token.created_at).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              {token.qr_type === 'generic' ? (
                                <div className="flex items-center gap-1">
                                  <Infinity className="h-3 w-3 text-green-600" />
                                  <span className="text-green-600 font-medium">Never expires</span>
                                </div>
                              ) : (
                                <>
                                  <div>{new Date(token.expires_at).toLocaleDateString()}</div>
                                  <div className="flex items-center gap-1">
                                    {status === 'expired' ? (
                                      <span className="text-destructive font-medium">Expired</span>
                                    ) : (
                                      <span className="text-primary font-medium">{timeRemaining}</span>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setViewingTokenId(token.id)}
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View QR Code
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeletingToken(token)}
                                  className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Token
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Viewer Modal */}
      <QRViewerModal
        tokenId={viewingTokenId}
        open={!!viewingTokenId}
        onOpenChange={(open) => !open && setViewingTokenId(null)}
      />

      {/* Delete Confirmation Dialog */}
      <QRDeleteDialog
        token={deletingToken}
        open={!!deletingToken}
        onOpenChange={(open) => !open && setDeletingToken(null)}
        onSuccess={handleRefresh}
      />
    </div>
  )
}