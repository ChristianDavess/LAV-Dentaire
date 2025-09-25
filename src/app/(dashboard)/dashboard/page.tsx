'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Calendar, TrendingUp, Activity, Clock, Banknote, Plus, ArrowUp, ArrowDown, Minus, AlertTriangle, Loader2 } from 'lucide-react'
import Image from 'next/image'

interface DashboardStats {
  totalPatients: number
  todayAppointments: number
  monthlyRevenue: number
  activeProcedures: number
  progress: {
    patients: number
    dailySchedule: number
    monthlyRevenue: number
    procedures: number
  }
  targets: {
    patients: number
    dailySlots: number
    monthlyRevenue: number
  }
  metadata: {
    currentDate: string
    currentMonth: string
    lastUpdated: string
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/dashboard/stats', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics')
      }

      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Dashboard stats error:', err)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="flex-1 p-4 md:p-8 pt-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Welcome to your dental clinic management system
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Activity className="mr-1 h-3 w-3" />
              Live
            </Badge>
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}. <button
                onClick={fetchDashboardStats}
                className="underline hover:no-underline"
              >
                Try again
              </button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8 mt-8">
          <TooltipProvider>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-base font-semibold">Total Patients</CardTitle>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors duration-300">
                        <Users className="h-5 w-5" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loading ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Skeleton className="h-10 w-16" />
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-5 w-20" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-3 w-8" />
                            </div>
                            <Skeleton className="h-2 w-full" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <div className="text-xl font-semibold tracking-tight">
                              {stats?.totalPatients || 0}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={stats?.totalPatients ? "default" : "secondary"} className="text-xs font-medium">
                                {stats?.totalPatients ? (
                                  <>
                                    <TrendingUp className="mr-1 h-3 w-3" />
                                    Growing
                                  </>
                                ) : (
                                  <>
                                    <Plus className="mr-1 h-3 w-3" />
                                    Ready to grow
                                  </>
                                )}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {stats?.totalPatients ? (
                                  <>
                                    <ArrowUp className="h-3 w-3" />
                                    <span>Active patients</span>
                                  </>
                                ) : (
                                  <>
                                    <Minus className="h-3 w-3" />
                                    <span>No patients yet</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Registration Progress</span>
                              <span className="font-medium">{stats?.progress.patients || 0}%</span>
                            </div>
                            <Progress value={stats?.progress.patients || 0} className="h-2 bg-muted/50" />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Track total registered patients in the system</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card
                    className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                    onClick={() => router.push('/appointments')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-base font-semibold">Today&apos;s Appointments</CardTitle>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/20 text-secondary-foreground group-hover:bg-secondary/30 transition-colors duration-300">
                        <Calendar className="h-5 w-5" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loading ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Skeleton className="h-10 w-16" />
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-5 w-20" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-2 w-full" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <div className="text-xl font-semibold tracking-tight">
                              {stats?.todayAppointments || 0}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={stats?.todayAppointments ? "default" : "outline"} className="text-xs font-medium border-muted-foreground/20">
                                {stats?.todayAppointments ? (
                                  <>
                                    <Activity className="mr-1 h-3 w-3" />
                                    Scheduled
                                  </>
                                ) : (
                                  <>
                                    <Clock className="mr-1 h-3 w-3" />
                                    Available
                                  </>
                                )}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {stats?.todayAppointments ? (
                                  <>
                                    <ArrowUp className="h-3 w-3" />
                                    <span>Today&apos;s schedule</span>
                                  </>
                                ) : (
                                  <>
                                    <Minus className="h-3 w-3" />
                                    <span>Open for booking</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Daily Schedule</span>
                              <span className="font-medium">{stats?.todayAppointments || 0}/{stats?.targets.dailySlots || 8} slots</span>
                            </div>
                            <Progress value={stats?.progress.dailySchedule || 0} className="h-2 bg-muted/50" />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View and manage today&apos;s appointment schedule</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-base font-semibold">Monthly Revenue</CardTitle>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground group-hover:bg-accent/30 transition-colors duration-300">
                        <Banknote className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loading ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Skeleton className="h-10 w-24" />
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-5 w-20" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton className="h-2 w-full" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <div className="text-xl font-semibold tracking-tight">
                              ₱{(stats?.monthlyRevenue || 0).toFixed(2)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={stats?.monthlyRevenue ? "default" : "secondary"} className="text-xs font-medium">
                                {stats?.monthlyRevenue ? (
                                  <>
                                    <Banknote className="mr-1 h-4 w-4" />
                                    Earning
                                  </>
                                ) : (
                                  <>
                                    <TrendingUp className="mr-1 h-3 w-3" />
                                    Growth ready
                                  </>
                                )}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {stats?.monthlyRevenue ? (
                                  <>
                                    <ArrowUp className="h-3 w-3" />
                                    <span>This month</span>
                                  </>
                                ) : (
                                  <>
                                    <Minus className="h-3 w-3" />
                                    <span>No revenue yet</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Monthly Target</span>
                              <span className="font-medium">₱{(stats?.monthlyRevenue || 0).toFixed(0)} / ₱{(stats?.targets.monthlyRevenue || 50000).toLocaleString()}</span>
                            </div>
                            <Progress value={stats?.progress.monthlyRevenue || 0} className="h-2 bg-muted/50" />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Track monthly revenue from treatments and procedures</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
                    <div className="absolute inset-0 bg-gradient-to-br from-muted/5 to-muted/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-base font-semibold">Active Procedures</CardTitle>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/20 text-muted-foreground group-hover:bg-muted/30 transition-colors duration-300">
                        <Image
                          src="/icon.svg"
                          alt="LAV Dentaire Logo"
                          width={32}
                          height={32}
                          className="h-8 w-8"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {loading ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Skeleton className="h-10 w-16" />
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-5 w-20" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-3 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                            <Skeleton className="h-2 w-full" />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <div className="text-xl font-semibold tracking-tight">
                              {stats?.activeProcedures || 0}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={stats?.activeProcedures ? "default" : "outline"} className="text-xs font-medium border-muted-foreground/20">
                                {stats?.activeProcedures ? (
                                  <>
                                    <Activity className="mr-1 h-3 w-3" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <Activity className="mr-1 h-3 w-3" />
                                    Setup needed
                                  </>
                                )}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {stats?.activeProcedures ? (
                                  <>
                                    <ArrowUp className="h-3 w-3" />
                                    <span>Procedures ready</span>
                                  </>
                                ) : (
                                  <>
                                    <Minus className="h-3 w-3" />
                                    <span>Configure procedures</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Setup Progress</span>
                              <span className="font-medium">
                                {stats?.activeProcedures ? "Complete" : "Pending"}
                              </span>
                            </div>
                            <Progress value={stats?.progress.procedures || 0} className="h-2 bg-muted/50" />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manage dental procedures and treatment options</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Activity className="h-4 w-4" />
                  </div>
                  Implementation Progress
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  LAV Dentaire Dental Clinic Management System development status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-6">
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="space-y-1">
                        <span className="text-sm font-semibold tracking-tight">Phase 1: Setup & Authentication</span>
                        <div className="text-xs text-muted-foreground">Project foundation and security</div>
                      </div>
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                        <Activity className="mr-1 h-3 w-3" />
                        Complete
                      </Badge>
                    </div>
                    <Progress value={100} className="h-3 bg-muted/30" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="space-y-1">
                        <span className="text-sm font-semibold tracking-tight">Phase 2: Core Layout & Navigation</span>
                        <div className="text-xs text-muted-foreground">Dashboard UI and navigation system</div>
                      </div>
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                        <Activity className="mr-1 h-3 w-3" />
                        Complete
                      </Badge>
                    </div>
                    <Progress value={100} className="h-3 bg-muted/30" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="space-y-1">
                        <span className="text-sm font-semibold tracking-tight">Phase 3: Patient Management</span>
                        <div className="text-xs text-muted-foreground">Patient records and registration</div>
                      </div>
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                        <Activity className="mr-1 h-3 w-3" />
                        Complete
                      </Badge>
                    </div>
                    <Progress value={100} className="h-3 bg-muted/30" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="space-y-1">
                        <span className="text-sm font-semibold tracking-tight">Phase 4: Appointment System</span>
                        <div className="text-xs text-muted-foreground">Calendar and appointment booking</div>
                      </div>
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                        <Activity className="mr-1 h-3 w-3" />
                        Complete
                      </Badge>
                    </div>
                    <Progress value={100} className="h-3 bg-muted/30" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="space-y-1">
                        <span className="text-sm font-semibold tracking-tight">Phase 5: Treatment & Procedures</span>
                        <div className="text-xs text-muted-foreground">Treatment records and procedure management</div>
                      </div>
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                        <Activity className="mr-1 h-3 w-3" />
                        Complete
                      </Badge>
                    </div>
                    <Progress value={100} className="h-3 bg-muted/30" />
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className="space-y-1">
                        <span className="text-sm font-semibold tracking-tight">Phase 6: QR Registration</span>
                        <div className="text-xs text-muted-foreground">QR-based patient registration system</div>
                      </div>
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        Next Phase
                      </Badge>
                    </div>
                    <Progress value={0} className="h-3 bg-muted/30" />
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border/20 to-transparent" />

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Image
                        src="/icon.svg"
                        alt="LAV Dentaire Logo"
                        width={20}
                        height={20}
                        className="h-5 w-5"
                      />
                    </div>
                    Features Available
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Activity className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">Authentication System</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Activity className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">Patient Management</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Activity className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">Appointment System</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Activity className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">Treatment & Procedures</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Common clinic management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div
                    className="group flex items-center justify-between p-4 rounded-xl border border-dashed border-muted-foreground/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                    onClick={() => router.push('/patients')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/30 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-all duration-300">
                        <Users className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Add Patient</span>
                        <div className="text-xs text-muted-foreground">Register new patient</div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs">Available</Badge>
                  </div>

                  <div
                    className="group flex items-center justify-between p-4 rounded-xl border border-dashed border-muted-foreground/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                    onClick={() => router.push('/appointments')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/30 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-all duration-300">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Schedule Appointment</span>
                        <div className="text-xs text-muted-foreground">Book patient visit</div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs">Available</Badge>
                  </div>

                  <div
                    className="group flex items-center justify-between p-4 rounded-xl border border-dashed border-muted-foreground/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                    onClick={() => router.push('/treatments')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/30 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-all duration-300">
                        <Image
                          src="/icon.svg"
                          alt="LAV Dentaire Logo"
                          width={32}
                          height={32}
                          className="h-8 w-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Add Treatment</span>
                        <div className="text-xs text-muted-foreground">Record treatment</div>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs">Available</Badge>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-border/20 to-transparent" />

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-muted-foreground">Coming Soon</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-muted/40 text-muted-foreground">
                        <Plus className="h-3 w-3" />
                      </div>
                      <span className="text-xs text-muted-foreground">QR Registration System</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-muted/40 text-muted-foreground">
                        <Plus className="h-3 w-3" />
                      </div>
                      <span className="text-xs text-muted-foreground">Advanced Analytics</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}