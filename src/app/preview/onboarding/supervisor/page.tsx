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

export default function SupervisorOnboardingPreviewPage() {
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
              Supervisor onboarding
            </CardTitle>
            <CardDescription className="text-[color:var(--dash-muted)]">
              Provide your work details so PESO can assign you to the correct
              interns and approval scope.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                    placeholder="juan.delacruz@peso.gov"
                    autoComplete="email"
                  />
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
                    type="tel"
                    placeholder="09xx xxx xxxx"
                    autoComplete="tel"
                  />
                </div>

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
                    placeholder="Employment Services Division"
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                    placeholder="OJT Supervisor"
                    autoComplete="organization-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="work_location"
                    className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    Work location or site
                  </Label>
                  <Input
                    id="work_location"
                    name="work_location"
                    placeholder="PESO Main Office"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="approval_scope"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Default approval scope
                </Label>
                <Input
                  id="approval_scope"
                  name="approval_scope"
                  placeholder="OJT interns from City College (IT, HRM)"
                />
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-[color:var(--dash-muted)]">
                  Approval scope can be updated later by an admin.
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
