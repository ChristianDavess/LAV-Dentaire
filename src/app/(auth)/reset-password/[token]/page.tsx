'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import Image from 'next/image'

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`)
        const data = await response.json()

        if (!response.ok || !data.success) {
          setError(data.error || 'Invalid or expired reset token')
        } else {
          setUserEmail(data.email)
        }
      } catch (err) {
        setError('Failed to validate reset token')
      } finally {
        setIsValidating(false)
      }
    }

    if (token) {
      validateToken()
    } else {
      setError('Reset token is missing')
      setIsValidating(false)
    }
  }, [token])

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to reset password')
      }

      setIsSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="mx-auto max-w-sm">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Validating reset token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
              <CardTitle className="text-2xl font-semibold">Password updated</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Your password has been successfully updated
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                You can now sign in with your new password.
              </p>
              <Button
                onClick={() => router.push('/login')}
                className="w-full"
                size="lg"
              >
                Continue to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error && !isValidating) {
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
              <CardTitle className="text-2xl font-semibold">Reset link expired</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                This password reset link is invalid or has expired
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="space-y-4">
              <Button
                onClick={() => router.push('/forgot-password')}
                className="w-full"
                variant="outline"
                size="lg"
              >
                Request New Reset Link
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
            <CardTitle className="text-2xl font-semibold">Set new password</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Enter a new password for {userEmail}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          disabled={isLoading}
                          placeholder="Enter new password"
                          className="pl-10 pr-12"
                          autoComplete="new-password"
                          autoFocus
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showConfirmPassword ? 'text' : 'password'}
                          disabled={isLoading}
                          placeholder="Confirm new password"
                          className="pl-10 pr-12"
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
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
                {isLoading ? 'Updating password...' : 'Update password'}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors inline-flex items-center"
                  tabIndex={isLoading ? -1 : 0}
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