"use client";

import { CheckCircle2, MapPin, Smartphone, Webcam, AlertTriangle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LIVE_LOCATIONS = [
  {
    intern: "Dela Cruz, Juan",
    id: "INT-2026-014",
    status: "Clocked in",
    lastSeen: "2 min ago",
    location: "Cabuyao City Hall · PESO Office",
    verification: ["GPS", "Selfie"],
  },
  {
    intern: "Santos, Maria",
    id: "INT-2026-032",
    status: "Clocked in (off-site)",
    lastSeen: "8 min ago",
    location: "Home-based internship · Verified",
    verification: ["GPS", "Selfie", "Off-site"],
  },
  {
    intern: "Garcia, Paulo",
    id: "INT-2026-041",
    status: "Offline",
    lastSeen: "Yesterday · 5:03 PM",
    location: "No active session",
    verification: [],
  },
];

export default function LiveLocationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Live locations</h1>
        <p className="text-sm text-slate-600">
          View clocked-in interns, last seen activity, and verification signals.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Clocked-in interns</CardTitle>
          <CardDescription>
            This view uses mock data. Connect to your attendance API and
            geolocation endpoints for real-time monitoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {LIVE_LOCATIONS.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-3 py-3 text-xs text-slate-700 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {row.intern}
                    </p>
                    <span className="font-mono text-[11px] text-slate-500">
                      {row.id}
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {row.location}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Last seen: <span className="font-medium">{row.lastSeen}</span>
                  </p>
                </div>

                  <div className="flex flex-col items-start gap-2 md:items-end">
                  <StatusPill status={row.status} />
                  <div className="flex flex-wrap gap-1.5">
                    {row.verification.includes("GPS") && (
                      <Badge className="bg-blue-50 text-blue-800 ring-1 ring-blue-200">
                        <Smartphone className="mr-1 h-3 w-3" />
                        GPS
                      </Badge>
                    )}
                    {row.verification.includes("Selfie") && (
                      <Badge className="bg-sky-50 text-sky-800 ring-1 ring-sky-100">
                        <Webcam className="mr-1 h-3 w-3" />
                        Selfie
                      </Badge>
                    )}
                    {row.verification.includes("Off-site") && (
                      <Badge className="bg-red-50 text-red-800 ring-1 ring-red-200">
                        Off-site
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500">
            Location data should respect privacy and only be used for official
            attendance verification.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "Clocked in" || status.startsWith("Clocked in")) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 ring-1 ring-blue-200">
        <CheckCircle2 className="h-3 w-3 text-blue-700" />
        {status}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
      <AlertTriangle className="h-3 w-3" />
      {status}
    </span>
  );
}

