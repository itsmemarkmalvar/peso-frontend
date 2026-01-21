"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      name?: string;
      username?: string;
      email: string;
      role: "admin" | "intern" | "supervisor" | "coordinator";
      status?: "active" | "inactive" | "suspended";
    };
    token: string;
  };
};

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>(
    { email: false, password: false }
  );
  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();
  const { login } = useAuth();

  const emailError =
    touched.email && !email.trim()
      ? "Email is required."
      : touched.email && !isValidEmail(email)
        ? "Enter a valid email address."
        : null;

  const passwordError =
    touched.password && !password
      ? "Password is required."
      : touched.password && password.length < 8
        ? "Password must be at least 8 characters."
        : null;

  const isFormValid =
    isValidEmail(email) && password.length >= 8;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setFormError(null);
    if (!isFormValid) return;

    setIsSubmitting(true);

    try {
      const res = await apiClient.post<LoginResponse>(API_ENDPOINTS.auth.login, {
        email: email.trim(),
        password,
      });

      const user = res?.data?.user;
      const token = res?.data?.token;

      if (!user || !token) {
        throw new Error("Login failed. Missing session data.");
      }

      login(
        {
          id: user.id,
          username: user.username ?? user.email.split("@")[0],
          email: user.email,
          role: user.role,
          name: user.name,
        },
        token
      );

      // Role-based redirect (2 dashboards: Admin/Staff vs Intern)
      if (user.role === "intern") {
        router.push("/dashboard/intern");
      } else {
        router.push("/dashboard/admin");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="relative overflow-hidden border-slate-200 shadow-sm">
        {/* subtle brand accent */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-700 via-blue-600 to-slate-900" />

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
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>
            Authorized personnel only. Use your assigned PESO account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {formError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Sign-in failed</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Password
                </Label>
                <button
                  type="button"
                  className="text-xs font-medium text-blue-700 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="pl-9 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  onKeyUp={(e) =>
                    setCapsLockOn(e.getModifierState?.("CapsLock") ?? false)
                  }
                  aria-invalid={!!passwordError}
                  aria-describedby={
                    passwordError || capsLockOn ? "password-help" : undefined
                  }
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
              {(passwordError || capsLockOn) ? (
                <div id="password-help" className="space-y-1">
                  {passwordError ? (
                    <p className="text-xs text-red-600">{passwordError}</p>
                  ) : null}
                  {capsLockOn ? (
                    <p className="text-xs text-amber-700">
                      Caps Lock is on.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(Boolean(v))}
                />
                Remember me
              </label>
              <span className="text-xs text-slate-500">Secure access</span>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 shadow-sm"
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="space-y-4">
            <Separator />
            <p className="text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-red-600 hover:underline">
                Create one
              </Link>
            </p>
            <p className="text-center text-xs text-slate-500">
              Need help? Email{" "}
              <a
                className="font-semibold text-blue-700 hover:underline"
                href="mailto:pesocabuyaocity@gmail.com?subject=PESO%20OJT%20Attendance%20System%20-%20Login%20Support"
              >
                pesocabuyaocity@gmail.com
              </a>
              .
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 border-t">
          <p className="text-center text-xs text-slate-500">
            Official use only. Access and data handling are subject to office policies.
          </p>
        </CardFooter>
    </Card>
  );
}