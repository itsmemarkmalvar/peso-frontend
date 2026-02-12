import Image from "next/image"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { internTheme } from "@/components/intern/internTheme"
import pesoLogo from "@/assets/images/image-Photoroom.png"

const WEEKDAYS = [
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
]

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available" },
  { value: "not_available", label: "Not available" },
]

export default function InternOnboardingPreviewPage() {
  return (
    <div
      style={internTheme}
      className="min-h-screen bg-[color:var(--dash-bg)] text-[color:var(--dash-ink)]"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
          Preview mode only. Form actions are disabled.
        </div>

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
              Intern onboarding
            </CardTitle>
            <CardDescription className="text-[color:var(--dash-muted)]">
              Confirm your details so PESO can activate your attendance profile.
              Your supervisor will complete the remaining fields later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="full_name"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Full name
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  placeholder="Juan Dela Cruz"
                  autoComplete="name"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="school"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    School
                  </Label>
                  <Input
                    id="school"
                    name="school"
                    placeholder="City College"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="program"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Program
                  </Label>
                  <Input
                    id="program"
                    name="program"
                    placeholder="BS Information Technology"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="required_hours"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Internship duration (hours)
                </Label>
                <Input
                  id="required_hours"
                  name="required_hours"
                  placeholder="500"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
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
                  {WEEKDAYS.map((day) => (
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
                            const isActive = option.value === "available"
                            return (
                              <button
                                key={option.value}
                                type="button"
                                disabled
                                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                  isActive
                                    ? "border-[color:var(--dash-accent)] bg-[color:var(--dash-accent)] text-white"
                                    : "border-[color:var(--dash-border)] bg-white text-[color:var(--dash-muted)]"
                                }`}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                    placeholder="09xx xxx xxxx"
                    type="tel"
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="emergency_contact_name"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Emergency contact name
                  </Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    placeholder="Maria Dela Cruz"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="emergency_contact_phone"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Emergency contact phone
                  </Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    placeholder="09xx xxx xxxx"
                    type="tel"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[color:var(--dash-muted)]">
                  OJT start date is your first clock-in. End date is set once you
                  complete the required hours.
                </p>
                <Button
                  type="button"
                  className="bg-[color:var(--dash-accent)] text-white hover:bg-[color:var(--dash-accent-strong)]"
                  disabled
                >
                  Save and continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
