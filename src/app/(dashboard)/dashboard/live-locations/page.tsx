"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MapPin, Smartphone, Webcam, AlertTriangle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminInterns, type AdminIntern } from "@/lib/api/intern";

type LiveLocationRow = {
  intern: string;
  id: string;
  status: string;
  lastSeen: string;
  location: string;
  verification: string[];
};

function buildLiveLocationRows(interns: AdminIntern[]): LiveLocationRow[] {
  if (!interns.length) return [];

  const patterns: Omit<LiveLocationRow, "intern" | "id" | "location">[] = [
    {
      status: "Clocked in",
      lastSeen: "2 min ago",
      verification: ["GPS", "Selfie"],
    },
    {
      status: "Clocked in (off-site)",
      lastSeen: "8 min ago",
      verification: ["GPS", "Selfie", "Off-site"],
    },
    {
      status: "Offline",
      lastSeen: "Yesterday · 5:03 PM",
      verification: [],
    },
  ];

  return interns.slice(0, 20).map((intern, index) => {
    const pattern = patterns[index % patterns.length];
    return {
      intern: intern.name,
      id: intern.id.toString(),
      status: pattern.status,
      lastSeen: pattern.lastSeen,
      location: `${intern.company_name} · OJT placement`,
      verification: pattern.verification,
    };
  });
}

export default function LiveLocationsPage() {
  const [rows, setRows] = useState<LiveLocationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAdminInterns()
      .then((interns) => {
        if (!active) return;
        setRows(buildLiveLocationRows(interns));
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load interns.");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
            Live list of OJT interns. Hook this to your attendance API and
            geolocation endpoints for real-time monitoring.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading && (
            <p className="text-[11px] text-slate-500">Loading interns…</p>
          )}
          {error && !isLoading && (
            <p className="text-[11px] text-slate-500">
              {error} Unable to load live locations.
            </p>
          )}
          <div className="overflow-x-auto">
            <div className="grid min-w-[960px] grid-cols-[minmax(0,2.4fr)_minmax(0,1.4fr)_minmax(0,2.4fr)_minmax(0,1.4fr)] gap-3 rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-medium text-slate-500">
              <span>Intern</span>
              <span className="text-right">Last seen</span>
              <span>Location</span>
              <span className="text-right">Status</span>
            </div>
            <div className="mt-2 max-h-[420px] min-w-[960px] space-y-2 overflow-y-auto pr-1">
              {!isLoading &&
                !error &&
                rows.map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[minmax(0,2.4fr)_minmax(0,1.4fr)_minmax(0,2.4fr)_minmax(0,1.4fr)] items-center gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs text-slate-700"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-slate-900">
                        {row.intern}
                      </p>
                      <p className="text-[11px] text-slate-500">{row.id}</p>
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      {row.lastSeen}
                    </div>
                    <p className="text-[11px] text-slate-500">{row.location}</p>
                    <div className="flex flex-col items-end gap-1">
                      <StatusPill status={row.status} />
                      <div className="flex flex-wrap justify-end gap-1.5">
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
              {!isLoading && !error && rows.length === 0 && (
                <p className="text-[11px] text-slate-500">
                  No interns available yet. Seed the database to see sample data.
                </p>
              )}
            </div>
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

