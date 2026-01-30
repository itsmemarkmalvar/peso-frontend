"use client"

import Image from "next/image"
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
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

export function InternOnboarding() {
  const router = useRouter()
  const { user } = useAuth()
  const [form, setForm] = useState<InternOnboardingForm>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const isFormValid = Boolean(
    form.full_name.trim() &&
      form.school.trim() &&
      form.program.trim() &&
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!isFormValid || isSubmitting) return

    setIsSubmitting(true)
    try {
      const payload: InternOnboardingPayload = {
        ...form,
        required_hours: requiredHours,
      }
      await saveInternOnboarding(payload)
      router.replace("/dashboard/intern")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save onboarding details."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
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
            {getInternOrGipRoleLabel(user?.role)} onboarding
          </CardTitle>
          <CardDescription className="text-[color:var(--dash-muted)]">
            Confirm your details so PESO can activate your attendance profile.
            Your coordinator will complete the remaining fields later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Submission failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="required_hours" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Internship duration (hours)
              </Label>
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
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Weekly availability (Mon - Fri)
                </Label>
                <p className="text-xs text-[color:var(--dash-muted)]">
                  Let us know which weekdays you can report for OJT.
                </p>
              </div>
              <div className="space-y-3">
                {WEEKDAYS.map((day) => {
                  const value = form.weekly_availability[day.id]
                  return (
                    <div
                      key={day.id}
                      className="rounded-xl border border-[color:var(--dash-border)] bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-[color:var(--dash-ink)]">
                            {day.label}
                          </p>
                          <p className="text-xs text-[color:var(--dash-muted)]">
                            Select if you can attend OJT on this day.
                          </p>
                        </div>
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
                                    ? "border-[color:var(--dash-accent)] bg-[color:var(--dash-accent)] text-white"
                                    : "border-[color:var(--dash-border)] bg-white text-[color:var(--dash-muted)] hover:border-slate-300"
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="emergency_contact_phone" className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Emergency contact phone
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

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[color:var(--dash-muted)]">
                OJT start date is your first clock-in. End date is set once you
                complete the required hours.
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
  )
}
