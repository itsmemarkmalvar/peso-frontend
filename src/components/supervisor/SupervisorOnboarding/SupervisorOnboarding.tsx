"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { internTheme } from "@/components/intern/internTheme"
import { useAuth } from "@/hooks/useAuth"
import {
  getSupervisorProfile,
  saveSupervisorOnboarding,
  type SupervisorOnboardingPayload,
} from "@/lib/api/supervisor"
import pesoLogo from "@/assets/images/image-Photoroom.png"

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "SP"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const EMPTY_FORM: SupervisorOnboardingPayload = {
  full_name: "",
  email: "",
  phone: "",
  department: "",
  job_title: "",
  approval_scope: "",
  work_location: "",
}

export function SupervisorOnboarding() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: isAuthLoading } = useAuth()
  const onboardingBypass =
    (process.env.NODE_ENV === "development" &&
      searchParams.get("dev-bypass") === "1") ||
    (process.env.NEXT_PUBLIC_ONBOARDING_BYPASS === "1" &&
      searchParams.get("onboarding-bypass") === "1")
  const [form, setForm] = useState<SupervisorOnboardingPayload>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const photoStorageKey = user?.id
    ? `supervisor_profile_photo_${user.id}`
    : "supervisor_profile_photo"

  useEffect(() => {
    if (isAuthLoading) return
    if (onboardingBypass) {
      setIsLoading(false)
      return
    }
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.role !== "supervisor") {
      router.replace("/dashboard/admin")
    }
  }, [onboardingBypass, isAuthLoading, router, user])

  useEffect(() => {
    if (onboardingBypass || isAuthLoading || !user || user.role !== "supervisor") {
      return
    }

    setForm((prev) => ({
      ...prev,
      full_name: prev.full_name || user.name || "",
      email: prev.email || user.email || "",
    }))
  }, [onboardingBypass, isAuthLoading, user])

  useEffect(() => {
    if (onboardingBypass) {
      return
    }
    if (isAuthLoading || !user || user.role !== "supervisor") {
      return
    }

    let active = true

    getSupervisorProfile()
      .then((profile) => {
        if (!active) return
        if (profile?.onboarded_at) {
          router.replace("/dashboard/admin")
          return
        }
        if (!profile) return
        setForm({
          full_name: profile.full_name ?? "",
          email: profile.email ?? "",
          phone: profile.phone ?? "",
          department: profile.department ?? "",
          job_title: profile.job_title ?? "",
          approval_scope: profile.approval_scope ?? "",
          work_location: profile.work_location ?? "",
        })
      })
      .catch(() => {})
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [onboardingBypass, isAuthLoading, router, user])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(photoStorageKey)
    if (stored) {
      setPhotoPreview(stored)
    }
  }, [photoStorageKey])

  const isFormValid = Boolean(
    form.full_name.trim() &&
      isValidEmail(form.email) &&
      form.phone.trim() &&
      form.department.trim() &&
      form.job_title.trim() &&
      form.approval_scope.trim() &&
      form.work_location.trim()
  )

  const updateField =
    (field: keyof SupervisorOnboardingPayload) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setForm((prev) => ({ ...prev, [field]: value }))
    }

  const handlePhotoSelect = () => {
    photoInputRef.current?.click()
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please upload a valid image file.")
      event.target.value = ""
      return
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoError("Image must be 2MB or smaller.")
      event.target.value = ""
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null
      if (!result) return
      setPhotoPreview(result)
      setPhotoError(null)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(photoStorageKey, result)
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  const handlePhotoRemove = () => {
    setPhotoPreview(null)
    setPhotoError(null)
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(photoStorageKey)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)
    try {
      await saveSupervisorOnboarding(form)
      router.replace("/dashboard/admin")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save onboarding details."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!onboardingBypass && (isAuthLoading || !user || user.role !== "supervisor")) {
    return null
  }

  return (
    <div
      style={internTheme}
      className="min-h-screen bg-[color:var(--dash-bg)] text-[color:var(--dash-ink)]"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
        <Card className="relative overflow-hidden border-[color:var(--dash-border)] bg-[color:var(--dash-card)] shadow-sm">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-700 via-blue-600 to-slate-900" />

          <div className="pointer-events-none absolute -right-24 -top-24 opacity-[0.06]">
            <Image
              src={pesoLogo}
              alt=""
              width={360}
              height={360}
              className="h-[360px] w-[360px] rotate-6 object-contain"
            />
          </div>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-[color:var(--dash-ink)]">
            Supervisor profile
          </CardTitle>
          <CardDescription className="text-[color:var(--dash-muted)]">
            Update your details and optional profile photo for approvals and
            intern coordination.
          </CardDescription>
        </CardHeader>
          <CardContent>
            {error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Submission failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[color:var(--dash-border)] bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
                      Profile photo (optional)
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                      <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-lg font-semibold text-slate-600">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Profile preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(form.full_name || user?.name || "SP")
                        )}
                      </div>
                      <div className="space-y-2">
                        <input
                          ref={photoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handlePhotoSelect}
                          >
                            Upload photo
                          </Button>
                          {photoPreview ? (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={handlePhotoRemove}
                            >
                              Remove
                            </Button>
                          ) : null}
                        </div>
                        <p className="text-xs text-[color:var(--dash-muted)]">
                          JPG/PNG, up to 2MB.
                        </p>
                        {photoError ? (
                          <p className="text-xs text-red-600">{photoError}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[color:var(--dash-border)] bg-white p-4 text-xs text-[color:var(--dash-muted)] shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
                      Profile summary
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Department</span>
                        <span className="font-semibold text-[color:var(--dash-ink)]">
                          {form.department || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Job title</span>
                        <span className="font-semibold text-[color:var(--dash-ink)]">
                          {form.job_title || "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Approval scope</span>
                        <span className="font-semibold text-[color:var(--dash-ink)]">
                          {form.approval_scope || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <section className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
                        Supervisor details
                      </p>
                      <p className="text-sm text-[color:var(--dash-muted)]">
                        These details are used to route approvals and updates.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label
                          htmlFor="full_name"
                          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          Full name
                        </Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={form.full_name}
                          onChange={updateField("full_name")}
                          placeholder="Juan Dela Cruz"
                          autoComplete="name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          Work email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={form.email}
                          onChange={updateField("email")}
                          placeholder="juan.delacruz@peso.gov"
                          autoComplete="email"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="phone"
                          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          Phone number
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={form.phone}
                          onChange={updateField("phone")}
                          placeholder="09xx xxx xxxx"
                          autoComplete="tel"
                          required
                        />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
                        Assignment details
                      </p>
                      <p className="text-sm text-[color:var(--dash-muted)]">
                        Tell us where you work and who you manage.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="department"
                          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          Department or office
                        </Label>
                        <Input
                          id="department"
                          name="department"
                          value={form.department}
                          onChange={updateField("department")}
                          placeholder="Employment Services Division"
                          autoComplete="organization"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="job_title"
                          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          Job title or role
                        </Label>
                        <Input
                          id="job_title"
                          name="job_title"
                          value={form.job_title}
                          onChange={updateField("job_title")}
                          placeholder="OJT Supervisor"
                          autoComplete="organization-title"
                          required
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label
                          htmlFor="work_location"
                          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          Work location or site
                        </Label>
                        <Input
                          id="work_location"
                          name="work_location"
                          value={form.work_location}
                          onChange={updateField("work_location")}
                          placeholder="PESO Main Office"
                          required
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label
                          htmlFor="approval_scope"
                          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          Default approval scope
                        </Label>
                        <Input
                          id="approval_scope"
                          name="approval_scope"
                          value={form.approval_scope}
                          onChange={updateField("approval_scope")}
                          placeholder="OJT interns from City College (IT, HRM)"
                          required
                        />
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[color:var(--dash-muted)]">
                  Approval scope can be updated later by an admin.
                </p>
                <Button
                  type="submit"
                  className="bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]"
                  disabled={!isFormValid || isSubmitting || isLoading}
                >
                  {isSubmitting ? "Saving..." : "Save and continue"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
