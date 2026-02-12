"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Mail, User, AlertCircle } from "lucide-react";
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

import pesoLogo from "@/assets/images/image-Photoroom.png";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [touched, setTouched] = useState<{
    fullName: boolean;
    email: boolean;
    terms: boolean;
  }>({
    fullName: false,
    email: false,
    terms: false,
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  type RegisterRequestResponse = {
    success: boolean;
    message: string;
  };

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

  const termsError =
    touched.terms && !termsAccepted
      ? "You must confirm the information is accurate."
      : null;

  const isFormValid =
    !fullNameError &&
    !emailError &&
    isValidEmail(email) &&
    fullName.trim().length >= 2 &&
    termsAccepted;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setTouched({
      fullName: true,
      email: true,
      terms: true,
    });
    if (!isFormValid) return;

    setIsSubmitting(true);

    try {
      const res = await apiClient.post<RegisterRequestResponse>(
        API_ENDPOINTS.auth.registerRequest,
        {
        name: fullName.trim(),
        email: email.trim(),
        },
      );

      setFormSuccess(
        res?.message ??
          "Request submitted. Please wait for admin approval."
      );
      setIsSubmitted(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration request failed. Please try again.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
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
          <CardTitle className="text-2xl">Request Account</CardTitle>
          <CardDescription>
            Submit your official details. An admin or supervisor will review
            and email a setup link for your password and onboarding.
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
          {formSuccess ? (
            <Alert className="bg-blue-50 text-blue-900">
              <AlertTitle>Request submitted</AlertTitle>
              <AlertDescription>{formSuccess}</AlertDescription>
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
                  disabled={isSubmitting || isSubmitted}
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
                  disabled={isSubmitting || isSubmitted}
                />
              </div>
              {emailError ? (
                <p id="email-error" className="text-xs text-red-600">
                  {emailError}
                </p>
              ) : null}
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600">
              <Checkbox
                id="terms"
                className="mt-0.5"
                checked={termsAccepted}
                onCheckedChange={(v) => setTermsAccepted(Boolean(v))}
                onBlur={() => setTouched((t) => ({ ...t, terms: true }))}
                aria-invalid={!!termsError}
                disabled={isSubmitting || isSubmitted}
              />
              <span>
                I confirm the information provided is accurate. An admin will
                review this request before sending a password setup link.
              </span>
            </label>
            {termsError ? (
              <p className="-mt-2 text-xs text-red-600">{termsError}</p>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 shadow-sm"
              disabled={isSubmitting || isSubmitted || !isFormValid}
            >
              {isSubmitting ? "Submitting..." : "Submit request"}
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
            Official use only. Accounts are activated after admin approval.
          </p>
        </CardFooter>
    </Card>
  );
}
