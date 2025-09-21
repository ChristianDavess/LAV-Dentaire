'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Search, Filter, Plus, AlertCircle, RefreshCw, Edit, Trash2, Stethoscope, Clock, DollarSign, Eye, EyeOff } from 'lucide-react'
import ProcedureForm from './procedure-form'
import { useToast } from '@/hooks/use-toast'

interface Procedure {
  id: string
  name: string
  description?: string
  default_cost?: number
  estimated_duration?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProcedureListProps {
  className?: string
}

export default function ProcedureList({ className }: ProcedureListProps) {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)
  const [deletingProcedure, setDeletingProcedure] = useState<Procedure | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { toast } = useToast()

  const fetchProcedures = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (activeFilter !== 'all') params.append('is_active', activeFilter)
      params.append('limit', '100')

      const response = await fetch(`/api/procedures?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch procedures')
      }

      const data = await response.json()
      setProcedures(data.procedures || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load procedures')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, activeFilter])

  useEffect(() => {
    fetchProcedures()
  }, [fetchProcedures, refreshTrigger])

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleCreateSuccess = () => {
    setIsCreateOpen(false)
    refreshData()
    toast({
      title: 'Success',
      description: 'Procedure created successfully',
    })
  }

  const handleEditSuccess = () => {
    setEditingProcedure(null)
    refreshData()
    toast({
      title: 'Success',
      description: 'Procedure updated successfully',
    })
  }

  const handleDelete = async (procedure: Procedure) => {
    try {
      const response = await fetch(`/api/procedures/${procedure.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete procedure')
      }

      toast({
        title: 'Success',
        description: 'Procedure deleted successfully',
      })

      setDeletingProcedure(null)
      refreshData()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete procedure',
        variant: 'destructive',
      })
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not set'
    return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Not set'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
    }
    return `${mins}m`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Procedures
            </CardTitle>
            <CardDescription>
              Manage dental procedures and their costs
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Procedure
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Procedure</DialogTitle>
                  <DialogDescription>
                    Add a new dental procedure to your catalog
                  </DialogDescription>
                </DialogHeader>
                <ProcedureForm onSuccess={handleCreateSuccess} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search procedures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={activeFilter} onValueChange={setActiveFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Procedures</SelectItem>
              <SelectItem value="true">Active Only</SelectItem>
              <SelectItem value="false">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {procedures.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary">
              {procedures.filter(p => p.is_active).length} Active
            </Badge>
            <Badge variant="outline">
              {procedures.filter(p => !p.is_active).length} Inactive
            </Badge>
            <Badge variant="outline">
              {procedures.length} Total
            </Badge>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : procedures.length === 0 ? (
          <div className="text-center py-8">
            <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No procedures found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || activeFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first procedure.'}
            </p>
            {!searchTerm && activeFilter === 'all' && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Procedure
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {procedures.map((procedure) => (
              <div
                key={procedure.id}
                className="flex flex-col gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{procedure.name}</h3>
                      <Badge variant={procedure.is_active ? 'default' : 'secondary'}>
                        {procedure.is_active ? (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </div>
                    {procedure.description && (
                      <p className="text-sm text-muted-foreground">
                        {procedure.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProcedure(procedure)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog open={deletingProcedure?.id === procedure.id} onOpenChange={(open) => !open && setDeletingProcedure(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingProcedure(procedure)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Procedure</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{procedure.name}"?
                            This action cannot be undone. If this procedure is used in treatments, deletion may fail.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(procedure)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatCurrency(procedure.default_cost)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatDuration(procedure.estimated_duration)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Procedure Dialog */}
      <Dialog open={!!editingProcedure} onOpenChange={() => setEditingProcedure(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Procedure</DialogTitle>
            <DialogDescription>
              Update procedure details
            </DialogDescription>
          </DialogHeader>
          {editingProcedure && (
            <ProcedureForm
              procedure={editingProcedure}
              onSuccess={handleEditSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}