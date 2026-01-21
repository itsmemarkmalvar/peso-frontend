"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { AlertCircle, Eye, EyeOff, Lock, Mail, CheckCircle2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/endpoints"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

type SetupPasswordResponse = {
  success: boolean
  message: string
}

export function SetupPasswordClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const initialEmail = searchParams.get("email") ?? ""

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false,
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const emailLocked = initialEmail.length > 0
  const tokenMissing = token.length === 0

  const emailError =
    touched.email && !email.trim()
      ? "Email is required."
      : touched.email && !isValidEmail(email)
        ? "Enter a valid email address."
        : null

  const passwordError =
    touched.password && !password
      ? "Password is required."
      : touched.password && password.length < 8
        ? "Password must be at least 8 characters."
        : null

  const confirmPasswordError =
    touched.confirmPassword && !confirmPassword
      ? "Confirm your password."
      : touched.confirmPassword && confirmPassword !== password
        ? "Passwords do not match."
        : null

  const isFormValid =
    !tokenMissing &&
    isValidEmail(email) &&
    password.length >= 8 &&
    confirmPassword === password &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    setTouched({ email: true, password: true, confirmPassword: true })

    if (!isFormValid || isSubmitting) {
      if (tokenMissing) {
        setFormError("Missing setup token. Please use the link from the email.")
      }
      return
    }

    setIsSubmitting(true)
    try {
      const res = await apiClient.post<SetupPasswordResponse>(
        API_ENDPOINTS.auth.setupPassword,
        {
          email: email.trim(),
          token,
          password,
          password_confirmation: confirmPassword,
        }
      )
      setFormSuccess(res?.message ?? "Password updated. You can now sign in.")
      setIsSubmitted(true)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to set password. Please try again."
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="relative overflow-hidden border-slate-200 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-700 via-blue-600 to-slate-900" />

      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Set your password</CardTitle>
        <CardDescription>
          Your account has been approved. Create a password to access the
          internship portal.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {tokenMissing ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Missing setup link</AlertTitle>
            <AlertDescription>
              This page needs a valid approval link. Please open the email sent
              by your coordinator.
            </AlertDescription>
          </Alert>
        ) : null}

        {formError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Setup failed</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        {formSuccess ? (
          <Alert className="bg-blue-50 text-blue-900">
            <AlertTitle>Password set</AlertTitle>
            <AlertDescription>{formSuccess}</AlertDescription>
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Email
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                disabled={emailLocked || isSubmitting || isSubmitted}
              />
            </div>
            {emailError ? (
              <p id="email-error" className="text-xs text-red-600">
                {emailError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
                minLength={8}
                className="pl-9 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "password-error" : undefined}
                disabled={isSubmitting || isSubmitted}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isSubmitting || isSubmitted}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {passwordError ? (
              <p id="password-error" className="text-xs text-red-600">
                {passwordError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Confirm password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
                minLength={8}
                className="pl-9 pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() =>
                  setTouched((t) => ({ ...t, confirmPassword: true }))
                }
                aria-invalid={!!confirmPasswordError}
                aria-describedby={
                  confirmPasswordError ? "confirmPassword-error" : undefined
                }
                disabled={isSubmitting || isSubmitted}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                disabled={isSubmitting || isSubmitted}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {confirmPasswordError ? (
              <p id="confirmPassword-error" className="text-xs text-red-600">
                {confirmPasswordError}
              </p>
            ) : confirmPassword.length > 0 &&
              confirmPassword === password ? (
              <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Passwords match
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-800 shadow-sm"
            disabled={isSubmitting || isSubmitted || !isFormValid}
          >
            {isSubmitting ? "Saving..." : "Set password"}
          </Button>
        </form>

        <div className="space-y-4">
          <Separator />
          <p className="text-center text-sm text-slate-600">
            Already set your password?{" "}
            <Link href="/login" className="font-semibold text-blue-700 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t">
        <p className="text-center text-xs text-slate-500">
          Use the setup link emailed by the PESO coordinator.
        </p>
      </CardFooter>
    </Card>
  )
}
