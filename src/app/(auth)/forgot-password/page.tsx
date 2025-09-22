'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Image from 'next/image'

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email.trim(),
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to send reset email')
      }

      setIsSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="mx-auto max-w-sm">
          <CardHeader className="space-y-6">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center">
                <Image
                  src="/lav-dentaire-logo.svg"
                  alt="LAV Dentaire Logo"
                  width={48}
                  height={48}
                  className="h-12 w-12"
                  priority
                />
              </div>
            </div>
            <div className="space-y-2 text-center">
              <CardTitle className="text-xl font-semibold">Check your email</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                We&apos;ve sent password reset instructions to your email
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                If you don&apos;t see the email in your inbox, please check your spam folder.
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
                variant="outline"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="mx-auto max-w-sm">
        <CardHeader className="space-y-6">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center">
              <Image
                src="/lav-dentaire-logo.svg"
                alt="LAV Dentaire Logo"
                width={48}
                height={48}
                className="h-12 w-12"
                priority
              />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-xl font-semibold">Reset password</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Enter your email and we&apos;ll send you reset instructions
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          disabled={isLoading}
                          placeholder="Enter your email address"
                          className="pl-10"
                          autoComplete="email"
                          autoFocus
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? 'Sending instructions...' : 'Send reset instructions'}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors inline-flex items-center"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back to login
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}