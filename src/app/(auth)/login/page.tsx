'use client'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { LoginForm } from "@/components/login-form"

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="mx-auto max-w-sm">
            <div className="space-y-4">
              <div className="flex justify-center">
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
              <div className="space-y-2 text-center">
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>
    </Suspense>
  )
}