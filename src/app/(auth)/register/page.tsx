"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

import pesoLogo from "@/assets/images/image-Photoroom.png";
import { useAuth } from "@/hooks/useAuth";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function passwordStrength(password: string) {
  const p = password;
  const lengthScore = Math.min(40, p.length * 5); // up to 40
  const variety =
    (/[a-z]/.test(p) ? 15 : 0) +
    (/[A-Z]/.test(p) ? 15 : 0) +
    (/\d/.test(p) ? 15 : 0) +
    (/[^A-Za-z0-9]/.test(p) ? 15 : 0); // up to 60
  const score = Math.min(100, lengthScore + variety);
  const label =
    score >= 80 ? "Strong" : score >= 55 ? "Good" : score >= 35 ? "Fair" : "Weak";
  return { score, label };
}

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [capsLockOnConfirm, setCapsLockOnConfirm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [touched, setTouched] = useState<{
    fullName: boolean;
    email: boolean;
    password: boolean;
    confirmPassword: boolean;
    terms: boolean;
  }>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    terms: false,
  });

  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useAuth();

  const fullNameError =
    touched.fullName && !fullName.trim()
      ? "Full name is required."
      : touched.fullName && fullName.trim().length < 2
        ? "Enter your full name."
        : null;

  const emailError =
    touched.email && !email.trim()
      ? "Email is required."
      : touched.email && !isValidEmail(email)
        ? "Enter a valid email address."
        : null;

  const { score, label } = passwordStrength(password);
  const passwordError =
    touched.password && !password
      ? "Password is required."
      : touched.password && password.length < 8
        ? "Password must be at least 8 characters."
        : null;

  const confirmPasswordError =
    touched.confirmPassword && !confirmPassword
      ? "Confirm your password."
      : touched.confirmPassword && confirmPassword !== password
        ? "Passwords do not match."
        : null;

  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === password;

  const termsError =
    touched.terms && !termsAccepted
      ? "You must confirm the information is accurate."
      : null;

  const isFormValid =
    !fullNameError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    isValidEmail(email) &&
    fullName.trim().length >= 2 &&
    password.length >= 8 &&
    confirmPassword === password &&
    termsAccepted;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });
    if (!isFormValid) return;

    setIsSubmitting(true);
    // UI-only: backend integration will be wired later.
    await new Promise((r) => setTimeout(r, 700));
    setFormError("Registration is not yet enabled. Please contact PESO to coordinate access.");
    setIsSubmitting(false);
  }

  return (
    <Card className="relative overflow-hidden border-slate-200 shadow-sm">
        {/* subtle brand accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-slate-900" />

        {/* watermark */}
        <div className="pointer-events-none absolute -right-24 -top-24 opacity-[0.06]">
          <Image
            src={pesoLogo}
            alt=""
            width={360}
            height={360}
            className="h-[360px] w-[360px] rotate-6 object-contain"
          />
        </div>

        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>
            Authorized personnel only. Use your official details to match your internship record.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {formError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Registration unavailable</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Full name
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Juan Dela Cruz"
                  autoComplete="name"
                  required
                  className="pl-9"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                  aria-invalid={!!fullNameError}
                  aria-describedby={fullNameError ? "fullName-error" : undefined}
                />
              </div>
              {fullNameError ? (
                <p id="fullName-error" className="text-xs text-red-600">
                  {fullNameError}
                </p>
              ) : null}
            </div>

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
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  onKeyUp={(e) =>
                    setCapsLockOn(e.getModifierState?.("CapsLock") ?? false)
                  }
                  aria-invalid={!!passwordError}
                  aria-describedby="password-help"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div id="password-help" className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    Strength: <span className="font-semibold">{label}</span>
                  </p>
                  <p className="text-xs text-slate-500 tabular-nums">{score}%</p>
                </div>
                <Progress value={score} />
                {passwordError ? (
                  <p className="text-xs text-red-600">{passwordError}</p>
                ) : null}
                {capsLockOn ? (
                  <p className="text-xs text-amber-700">Caps Lock is on.</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Confirm password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() =>
                    setTouched((t) => ({ ...t, confirmPassword: true }))
                  }
                  onKeyUp={(e) =>
                    setCapsLockOnConfirm(e.getModifierState?.("CapsLock") ?? false)
                  }
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby="confirmPassword-help"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div id="confirmPassword-help" className="space-y-1">
                {confirmPasswordError ? (
                  <p className="text-xs text-red-600">{confirmPasswordError}</p>
                ) : passwordsMatch ? (
                  <p className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Passwords match
                  </p>
                ) : null}
                {capsLockOnConfirm ? (
                  <p className="text-xs text-amber-700">Caps Lock is on.</p>
                ) : null}
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600">
              <Checkbox
                id="terms"
                className="mt-0.5"
                checked={termsAccepted}
                onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
                onBlur={() => setTouched((t) => ({ ...t, terms: true }))}
                aria-invalid={!!termsError}
              />
              <span>
                I confirm the information provided is accurate and will be used
                for attendance verification.
              </span>
            </label>
            {termsError ? (
              <p className="-mt-2 text-xs text-red-600">{termsError}</p>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 shadow-sm"
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="space-y-4">
            <Separator />
            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-blue-700 hover:underline">
                Log in
              </Link>
            </p>
            <p className="text-center text-xs text-slate-500">
              Need help? Email{" "}
              <a
                className="font-semibold text-blue-700 hover:underline"
                href="mailto:pesocabuyaocity@gmail.com?subject=PESO%20OJT%20Attendance%20System%20-%20Registration%20Support"
              >
                pesocabuyaocity@gmail.com
              </a>
              .
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t">
          <p className="text-center text-xs text-slate-500">
            Official use only. Registration may be subject to coordinator approval.
          </p>
        </CardFooter>
    </Card>
  );
}