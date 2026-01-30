"use client";

import { useEffect, useState } from "react";
import { Clock3, Loader2, ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getSettings, updateSettings } from "@/lib/api/settings";
import type { SystemSettings } from "@/types";

const DEFAULT_SETTINGS: SystemSettings = {
  grace_period_minutes: 10,
  verification_gps: true,
  verification_selfie: true,
};

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    setError(null);
    getSettings()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load settings");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = () => {
    if (!isAdmin) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    updateSettings(settings)
      .then((data) => {
        setSettings(data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to save settings");
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-600">
            Configure attendance rules, verification methods, and guardrails.
          </p>
        </div>
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-600">
            Configure attendance rules and verification methods. These apply to
            interns and GIP when clocking in/out.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="shrink-0"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Settings saved. Rules are now applied for attendance and verification.
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Attendance rules</CardTitle>
            <CardDescription>
              Stored and enforced in the backend for late calculation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-700">
            <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Grace period (minutes)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Allowable delay before an intern is marked late.
                  </p>
                </div>
              </div>
              {isAdmin ? (
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={settings.grace_period_minutes}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      grace_period_minutes: Math.min(
                        120,
                        Math.max(0, parseInt(e.target.value, 10) || 0)
                      ),
                    }))
                  }
                  className="h-8 w-20 font-mono tabular-nums"
                />
              ) : (
                <span className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-xs tabular-nums">
                  {settings.grace_period_minutes}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Verification methods</CardTitle>
            <CardDescription>
              Choose which verification options are required for clock in/out.
              Enforced by the API for interns and GIP.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-700">
            <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
              <Checkbox
                id="gps"
                checked={settings.verification_gps}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({
                    ...s,
                    verification_gps: checked === true,
                  }))
                }
                disabled={!isAdmin}
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
                checked={settings.verification_selfie}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({
                    ...s,
                    verification_selfie: checked === true,
                  }))
                }
                disabled={!isAdmin}
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

            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              <span>
                Configuration is stored in the backend and applied by role:
                interns and GIP receive these rules when clocking in/out.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
