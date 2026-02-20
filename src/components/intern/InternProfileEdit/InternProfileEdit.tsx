"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/hooks/useAuth"
import { getInternOrGipRoleLabel } from "@/lib/constants"
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
import {
  getInternProfile,
  saveInternOnboarding,
  type InternOnboardingPayload,
  type InternWeeklyAvailability,
  type InternAvailabilityOption,
} from "@/lib/api/intern"
import pesoLogo from "@/assets/images/image-Photoroom.png"
import { cn } from "@/lib/utils"
import { InternBackButton } from "@/components/intern/InternBackButton"

type WeekdayKey = keyof InternWeeklyAvailability

type InternOnboardingForm = Omit<InternOnboardingPayload, "required_hours"> & {
  required_hours: string
}

const WEEKDAYS: { id: WeekdayKey; label: string }[] = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
]

const AVAILABILITY_OPTIONS: {
  value: InternAvailabilityOption
  label: string
}[] = [
  { value: "available", label: "Available" },
  { value: "not_available", label: "Not available" },
]

const DEFAULT_WEEKLY_AVAILABILITY: InternWeeklyAvailability = {
  monday: "available",
  tuesday: "available",
  wednesday: "available",
  thursday: "available",
  friday: "available",
}

const HOURS_PER_MONTH = 176
const REQUIRED_HOURS_MONTH_OPTIONS = [1, 2, 3, 4] as const

const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

/** Read image file as base64 data URL. Uses FileReader only (no canvas) for maximum reliability. */
function readImageAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null
      if (result) resolve(result)
      else reject(new Error("Failed to read file"))
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "IN"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const coerceAvailability = (value?: string | null): InternAvailabilityOption => {
  if (value === "not_available") {
    return "not_available"
  }
  return "available"
}

const normalizeAvailability = (
  availability?: Partial<Record<WeekdayKey, string>> | null
): InternWeeklyAvailability => ({
  monday: coerceAvailability(availability?.monday),
  tuesday: coerceAvailability(availability?.tuesday),
  wednesday: coerceAvailability(availability?.wednesday),
  thursday: coerceAvailability(availability?.thursday),
  friday: coerceAvailability(availability?.friday),
})

const EMPTY_FORM: InternOnboardingForm = {
  full_name: "",
  school: "",
  program: "",
  phone: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  required_hours: "",
  weekly_availability: DEFAULT_WEEKLY_AVAILABILITY,
}

export function InternProfileEdit() {
  const router = useRouter()
  const { user } = useAuth()
  const isGip = user?.role === "gip"
  const [form, setForm] = useState<InternOnboardingForm>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let active = true

    getInternProfile()
      .then((profile) => {
        if (!active || !profile) return
        setForm({
          full_name: profile.full_name ?? "",
          school: profile.school ?? "",
          program: profile.program ?? "",
          phone: profile.phone ?? "",
          emergency_contact_name: profile.emergency_contact_name ?? "",
          emergency_contact_phone: profile.emergency_contact_phone ?? "",
          required_hours:
            profile.required_hours === null
              ? ""
              : String(profile.required_hours),
          weekly_availability: normalizeAvailability(
            profile.weekly_availability
          ),
        })
        if (profile.profile_photo) {
          setPhotoPreview(profile.profile_photo)
        }
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
  }, [])

  const requiredHours = Number(form.required_hours)
  const hasValidRequiredHours =
    form.required_hours.trim().length > 0 &&
    Number.isFinite(requiredHours) &&
    requiredHours > 0
  const hasAvailability = Object.values(form.weekly_availability).every(
    (value) => Boolean(value)
  )
  const selectedRequiredHours = Number(form.required_hours)
  const hasRequiredHoursOption = REQUIRED_HOURS_MONTH_OPTIONS.some(
    (months) => months * HOURS_PER_MONTH === selectedRequiredHours
  )
  const requiredHoursOptions = hasValidRequiredHours && !hasRequiredHoursOption
    ? [selectedRequiredHours, ...REQUIRED_HOURS_MONTH_OPTIONS.map((months) => months * HOURS_PER_MONTH)]
    : REQUIRED_HOURS_MONTH_OPTIONS.map((months) => months * HOURS_PER_MONTH)

  const isFormValid = Boolean(
    form.full_name.trim() &&
      (isGip || (form.school.trim() && form.program.trim())) &&
      form.phone.trim() &&
      form.emergency_contact_name.trim() &&
      form.emergency_contact_phone.trim() &&
      hasValidRequiredHours &&
      hasAvailability
  )

  const updateField =
    (field: keyof InternOnboardingForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setForm((prev) => ({ ...prev, [field]: value }))
    }

  const updateAvailability =
    (day: WeekdayKey, value: InternAvailabilityOption) => () => {
      setForm((prev) => ({
        ...prev,
        weekly_availability: {
          ...prev.weekly_availability,
          [day]: value,
        },
      }))
    }

  const handlePhotoSelect = () => {
    photoInputRef.current?.click()
  }

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please upload an image file (JPG, PNG).")
      event.target.value = ""
      return
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoError("Image must be 5MB or smaller.")
      event.target.value = ""
      return
    }
    setPhotoError(null)
    try {
      const result = await readImageAsBase64(file)
      setPhotoPreview(result)
    } catch {
      setPhotoError("Failed to read image. Use JPG or PNG format, up to 5MB.")
    }
    event.target.value = ""
  }

  const handlePhotoRemove = () => {
    setPhotoPreview(null)
    setPhotoError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)
    try {
      const payload: InternOnboardingPayload = {
        full_name: form.full_name?.trim() ?? "",
        phone: form.phone?.trim() ?? "",
        emergency_contact_name: form.emergency_contact_name?.trim() ?? "",
        emergency_contact_phone: form.emergency_contact_phone?.trim() ?? "",
        required_hours: requiredHours,
        weekly_availability: form.weekly_availability,
        ...(photoPreview ? { profile_photo: photoPreview } : {}),
      }
      if (!isGip) {
        payload.school = form.school?.trim() ?? ""
        payload.program = form.program?.trim() ?? ""
      }
      await saveInternOnboarding(payload)
      router.replace("/dashboard/intern")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save profile details."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <InternBackButton href="/dashboard/intern" label="Back to dashboard" />
      {/* Header Card */}
      <Card className="relative overflow-hidden border-(--dash-border) bg-(--dash-card) shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-700 via-blue-600 to-slate-900" />

        <div className="pointer-events-none absolute -right-24 -top-24 opacity-[0.06]">
          <Image
            src={pesoLogo}
            alt=""
            width={360}
            height={360}
            loading="eager"
            className="h-[360px] w-[360px] rotate-6 object-contain"
          />
        </div>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl text-(--dash-ink)">
            Update your profile
          </CardTitle>
          <CardDescription className="text-(--dash-muted)">
            Keep your information current and up to date.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Profile Photo Section */}
      <Card className="relative overflow-hidden border-(--dash-border) bg-(--dash-card) shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-linear-to-br from-blue-100 to-slate-100 text-3xl font-semibold text-slate-700 shadow-md">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(form.full_name || user?.name || "IN")
                )}
              </div>
              <div className="space-y-2 text-center">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePhotoSelect}
                    className="text-sm"
                  >
                    Upload photo
                  </Button>
                  {photoPreview ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handlePhotoRemove}
                      className="text-sm"
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-(--dash-muted)">
                  JPG/PNG, up to 5MB
                </p>
                {photoError ? (
                  <p className="text-xs text-red-600">{photoError}</p>
                ) : null}
              </div>
            </div>

            {/* Profile Summary */}
            <div className="flex-1 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-(--dash-muted)">
                Your account details
              </p>
              <div className="grid gap-4 grid-cols-2">
                <div className="rounded-xl border border-(--dash-border) bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--dash-muted)">
                    Role
                  </p>
                  <p className="mt-2 font-semibold text-(--dash-ink)">
                    {getInternOrGipRoleLabel(user?.role)}
                  </p>
                </div>
                {!isGip ? (
                  <div className="rounded-xl border border-(--dash-border) bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-(--dash-muted)">
                      School
                    </p>
                    <p className="mt-2 font-semibold text-(--dash-ink)">
                      {form.school || "-"}
                    </p>
                  </div>
                ) : null}
                {!isGip ? (
                  <div className="rounded-xl border border-(--dash-border) bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-(--dash-muted)">
                      Program
                    </p>
                    <p className="mt-2 font-semibold text-(--dash-ink)">
                      {form.program || "-"}
                    </p>
                  </div>
                ) : null}
                <div className="rounded-xl border border-(--dash-border) bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-(--dash-muted)">
                    Required hours
                  </p>
                  <p className="mt-2 font-semibold text-(--dash-ink)">
                    {form.required_hours || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Update failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Basic Details Section */}
        <Card className="border-(--dash-border) bg-(--dash-card) shadow-sm">
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Basic details</CardTitle>
              <CardDescription className="text-(--dash-muted)">
                Information used in your attendance records and communications.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
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
            {!isGip ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="school" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    School
                  </Label>
                  <Input
                    id="school"
                    name="school"
                    value={form.school}
                    onChange={updateField("school")}
                    placeholder="City College"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Program
                  </Label>
                  <Input
                    id="program"
                    name="program"
                    value={form.program}
                    onChange={updateField("program")}
                    placeholder="BS Information Technology"
                    required
                  />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Contact Details */}
        <Card className="border-(--dash-border) bg-(--dash-card) shadow-sm">
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Contact information</CardTitle>
              <CardDescription className="text-(--dash-muted)">
                Used for official communications and emergency contact.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Phone number
              </Label>
              <Input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={updateField("phone")}
                placeholder="09xx xxx xxxx"
                type="tel"
                autoComplete="tel"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Emergency contact name
                </Label>
                <Input
                  id="emergency_contact_name"
                  name="emergency_contact_name"
                  value={form.emergency_contact_name}
                  onChange={updateField("emergency_contact_name")}
                  placeholder="Maria Dela Cruz"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Emergency phone
                </Label>
                <Input
                  id="emergency_contact_phone"
                  name="emergency_contact_phone"
                  value={form.emergency_contact_phone}
                  onChange={updateField("emergency_contact_phone")}
                  placeholder="09xx xxx xxxx"
                  type="tel"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Internship Details */}
        <Card className="border-(--dash-border) bg-(--dash-card) shadow-sm">
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Internship details</CardTitle>
              <CardDescription className="text-(--dash-muted)">
                Required hours and weekly schedule information.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="required_hours" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Required hours
              </Label>
              {isGip ? (
                <select
                  id="required_hours"
                  name="required_hours"
                  value={form.required_hours}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, required_hours: event.target.value }))
                  }
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  required
                >
                  <option value="">Select required hours</option>
                  {requiredHoursOptions.map((hours) => {
                    const months = hours / HOURS_PER_MONTH
                    const isBaseOption = Number.isInteger(months) && REQUIRED_HOURS_MONTH_OPTIONS.includes(months as (typeof REQUIRED_HOURS_MONTH_OPTIONS)[number])
                    return (
                      <option key={hours} value={String(hours)}>
                        {isBaseOption
                          ? `${months} ${months === 1 ? "Month" : "Months"} (${hours} hours)`
                          : `${hours} hours (current record)`}
                      </option>
                    )
                  })}
                </select>
              ) : (
                <Input
                  id="required_hours"
                  name="required_hours"
                  value={form.required_hours}
                  onChange={updateField("required_hours")}
                  placeholder="500"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  required
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Availability Section */}
        <Card className="border-(--dash-border) bg-(--dash-card) shadow-sm">
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Weekly availability</CardTitle>
              <CardDescription className="text-(--dash-muted)">
                Select the weekdays you can attend OJT (Monday to Friday).
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {WEEKDAYS.map((day) => {
                const value = form.weekly_availability[day.id]
                return (
                  <div
                    key={day.id}
                    className="rounded-xl border border-(--dash-border) bg-white p-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-(--dash-ink)">
                        {day.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABILITY_OPTIONS.map((option) => {
                          const isActive = value === option.value
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={updateAvailability(day.id, option.value)}
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-semibold transition",
                                isActive
                                  ? "border-(--dash-accent) bg-(--dash-accent) text-white"
                                  : "border-(--dash-border) bg-white text-(--dash-muted) hover:border-slate-300"
                              )}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-(--dash-accent) text-white hover:bg-(--dash-accent-strong)"
            disabled={!isFormValid || isSubmitting || isLoading}
          >
            {isSubmitting ? "Saving changes..." : "Save changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
