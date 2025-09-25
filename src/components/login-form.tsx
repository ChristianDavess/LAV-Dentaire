'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { User, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters'),
  rememberMe: z.boolean(),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
    mode: 'onChange',
  })

  // Load saved username from localStorage
  useEffect(() => {
    const rememberedUsername = localStorage.getItem('rememberedUsername')
    if (rememberedUsername) {
      form.setValue('username', rememberedUsername)
      form.setValue('rememberMe', true)
    }
  }, [form])

  const onSubmit = async (data: LoginForm) => {
    if (isLocked) return

    setIsLoading(true)
    setGlobalError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username.trim(),
          password: data.password,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Handle rate limiting
        if (response.status === 429) {
          setIsLocked(true)
          setGlobalError('Account temporarily locked due to too many failed attempts. Please try again in 15 minutes.')
          // Focus on error for accessibility
          setTimeout(() => errorRef.current?.focus(), 100)
          return
        }

        // Enhanced error messages
        let errorMessage = 'Invalid username or password'
        if (responseData?.error) {
          if (responseData.error.includes('user not found')) {
            errorMessage = 'Username not found. Please check your username and try again.'
          } else if (responseData.error.includes('password')) {
            errorMessage = 'Incorrect password. Please try again.'
          } else {
            errorMessage = responseData.error
          }
        }
        throw new Error(errorMessage)
      }

      // Handle remember me functionality
      if (data.rememberMe) {
        localStorage.setItem('rememberedUsername', data.username.trim())
      } else {
        localStorage.removeItem('rememberedUsername')
      }

      // Success - redirect immediately without showing success message
      router.push(redirectTo)
      router.refresh()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please check your connection and try again.'
      setGlobalError(errorMessage)
      // Focus on error for accessibility
      setTimeout(() => errorRef.current?.focus(), 100)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader className="space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center">
            <Image
              src="/icon.svg"
              alt="LAV Dentaire Logo"
              width={48}
              height={48}
              className="h-12 w-12"
              priority
            />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <CardTitle className="text-lg font-semibold">Welcome back</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Sign in to LAV Dentaire
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="text"
                        disabled={isLoading || isLocked}
                        placeholder="Enter your username"
                        className="pl-10"
                        autoComplete="username"
                        autoFocus
                        aria-describedby="username-help"
                        aria-invalid={!!form.formState.errors.username}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        disabled={isLoading || isLocked}
                        placeholder="Enter your password"
                        className="pl-10 pr-12"
                        autoComplete="current-password"
                        aria-describedby="password-help"
                        aria-invalid={!!form.formState.errors.password}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading || isLocked}
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

            {/* Remember Me Checkbox */}
            <FormField
              control={form.control}
              name="rememberMe"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading || isLocked}
                      id="rememberMe"
                      aria-describedby="rememberMe-description"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel
                      htmlFor="rememberMe"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Remember my username
                    </FormLabel>
                    <p id="rememberMe-description" className="text-xs text-muted-foreground">
                      We&apos;ll save your username for faster sign-in next time
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Error Alert with better focus management */}
            {globalError && (
              <Alert variant="destructive" ref={errorRef} tabIndex={-1}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{globalError}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || isLocked}
              size="lg"
              aria-describedby={globalError ? 'error-alert' : undefined}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in...
                </>
              ) : isLocked ? (
                'Account Locked'
              ) : (
                'Sign In'
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
                tabIndex={isLoading || isLocked ? -1 : 0}
              >
                Forgot your password?
              </Link>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}