"use client";

import { Clock3, QrCode, Smartphone, Webcam, ListTree } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RECENT_ACTIVITY = [
  {
    intern: "Dela Cruz, Juan",
    id: "INT-2026-014",
    action: "Clock in",
    time: "08:03 AM",
    method: ["QR", "Selfie", "Device"],
  },
  {
    intern: "Santos, Maria",
    id: "INT-2026-032",
    action: "Clock out",
    time: "05:01 PM",
    method: ["Selfie"],
  },
];

export default function TimeTrackingPage() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Time tracking</h1>
        <p className="text-sm text-slate-600">
          Inspect recent tracking activity and review audit trail entries.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.4fr)_minmax(0,2.6fr)]">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>
              Sample clock-in events with QR, selfie, and device details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-700">
            {RECENT_ACTIVITY.map((entry) => (
              <div
                key={entry.id + entry.time + entry.action}
                className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-white px-3 py-2 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-slate-900">
                    {entry.intern}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {entry.id} · {entry.action} at {entry.time}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.method.includes("QR") && (
                    <Badge className="bg-slate-900 text-white">
                      <QrCode className="mr-1 h-3 w-3" />
                      QR
                    </Badge>
                  )}
                  {entry.method.includes("Selfie") && (
                    <Badge className="bg-sky-50 text-sky-800 ring-1 ring-sky-100">
                      <Webcam className="mr-1 h-3 w-3" />
                      Selfie
                    </Badge>
                  )}
                  {entry.method.includes("Device") && (
                    <Badge className="bg-blue-50 text-blue-800 ring-1 ring-blue-200">
                      <Smartphone className="mr-1 h-3 w-3" />
                      Device
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Audit trail</CardTitle>
            <CardDescription>
              Placeholder for a chronological log of changes, approvals, and
              security-related events.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
              <div className="flex flex-col items-center gap-2 text-center">
                <ListTree className="h-5 w-5 text-slate-400" />
                <p>
                  Display audit log entries here. Use the Laravel activity logs
                  table or a dedicated audit trail table.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

