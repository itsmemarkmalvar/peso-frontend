"use client";

import { CheckSquare, Clock3, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600">
          Configure attendance rules, verification methods, and guardrails.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,2.8fr)]">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Attendance rules</CardTitle>
            <CardDescription>
              Mock configuration fields. Wire these to your settings API and
              enforce in the Laravel backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-700">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Grace period (minutes)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Allowable delay before an intern is marked late.
                  </p>
                </div>
              </div>
              <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs tabular-nums">
                10
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Minimum overtime (minutes)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Minimum extra time before overtime is recorded.
                  </p>
                </div>
              </div>
              <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs tabular-nums">
                30
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              These values are placeholders. Store them in a settings table and
              apply in your attendance validation logic.
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Verification methods</CardTitle>
            <CardDescription>
              Choose which verification options are required for clock in/out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-700">
            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
              <Checkbox
                id="gps"
                defaultChecked
                className="mt-0.5"
                aria-label="GPS verification"
              />
              <div>
                <p className="flex items-center gap-1 text-sm font-medium text-slate-900">
                  GPS location
                </p>
                <p className="text-[11px] text-slate-500">
                  Require browser location on every clock in/out.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
              <Checkbox
                id="selfie"
                defaultChecked
                className="mt-0.5"
                aria-label="Selfie verification"
              />
              <div>
                <p className="flex items-center gap-1 text-sm font-medium text-slate-900">
                  Selfie capture
                </p>
                <p className="text-[11px] text-slate-500">
                  Capture a webcam photo for identity verification.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
              <Checkbox
                id="qr"
                defaultChecked
                className="mt-0.5"
                aria-label="QR verification"
              />
              <div>
                <p className="flex items-center gap-1 text-sm font-medium text-slate-900">
                  QR code
                </p>
                <p className="text-[11px] text-slate-500">
                  Scan a location-specific QR code using the browser.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
              <Checkbox
                id="device-fingerprint"
                className="mt-0.5"
                aria-label="Device fingerprint verification"
              />
              <div>
                <p className="flex items-center gap-1 text-sm font-medium text-slate-900">
                  Device fingerprint
                </p>
                <p className="text-[11px] text-slate-500">
                  Limit interns to approved devices to reduce multiple logins.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
              <span>
                These toggles are UI-only. Store final configuration in a
                settings service and enforce on the API.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

