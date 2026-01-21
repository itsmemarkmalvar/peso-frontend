"use client";

import { useEffect, useState } from "react";
import { Clock3, QrCode, Smartphone, Webcam } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminInterns, type AdminIntern } from "@/lib/api/intern";

type ActivityRow = {
  intern: string;
  id: string;
  action: string;
  time: string;
  method: ("QR" | "Selfie" | "Device")[];
};

function buildActivityRows(interns: AdminIntern[]): ActivityRow[] {
  if (!interns.length) return [];

  const patterns: Omit<ActivityRow, "intern" | "id">[] = [
    {
      action: "Clock in",
      time: "08:03 AM",
      method: ["QR", "Selfie", "Device"],
    },
    {
      action: "Clock out",
      time: "05:01 PM",
      method: ["Selfie"],
    },
  ];

  return interns.slice(0, 20).map((intern, index) => {
    const pattern = patterns[index % patterns.length];
    return {
      intern: intern.name,
      id: intern.id.toString(),
      action: pattern.action,
      time: pattern.time,
      method: pattern.method,
    };
  });
}

export default function TimeTrackingPage() {
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getAdminInterns()
      .then((interns) => {
        if (!active) return;
        setActivity(buildActivityRows(interns));
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
        <h1 className="text-lg font-semibold text-slate-900">Time tracking</h1>
        <p className="text-sm text-slate-600">
          Inspect recent tracking activity from OJT interns.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
          <CardDescription>
            Sample clock-in events for real OJT accounts. Replace with live
            attendance data when available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700">
          {isLoading && (
            <p className="text-[11px] text-slate-500">Loading activity…</p>
          )}
          {error && !isLoading && (
            <p className="text-[11px] text-red-600">
              {error} Unable to load recent activity.
            </p>
          )}
          <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
            {!isLoading &&
              !error &&
              activity.map((entry) => (
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
            {!isLoading && !error && activity.length === 0 && (
              <p className="text-[11px] text-slate-500">
                No recent activity yet. Once interns start clocking in, events
                will appear here.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

