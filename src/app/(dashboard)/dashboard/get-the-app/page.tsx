"use client";

import { Chrome, Globe2, QrCode, Smartphone } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const SUPPORTED_BROWSERS = [
  "Google Chrome (latest)",
  "Microsoft Edge (latest)",
  "Mozilla Firefox (latest)",
  "Safari (latest, on iOS/macOS)",
];

export default function GetTheAppPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Get the app</h1>
        <p className="text-sm text-slate-600">
          PESO OJT Attendance runs entirely in the browser—no native install
          required.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Use on your phone</CardTitle>
          <CardDescription>
            Interns can clock in/out using their mobile browser. For convenience
            you can save it to the home screen like an app.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[minmax(0,2.2fr)_minmax(0,2.8fr)]">
          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <Smartphone className="mt-0.5 h-4 w-4 text-slate-500" />
              <p>
                Open the PESO OJT Attendance URL in your mobile browser and log
                in with your assigned account.
              </p>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <Globe2 className="mt-0.5 h-4 w-4 text-slate-500" />
              <p>
                For a PWA-like experience, you can later enable &ldquo;Add to
                Home Screen&rdquo; support and offline caching.
              </p>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Supported browsers
              </p>
              <ul className="space-y-1 text-xs text-slate-700">
                {SUPPORTED_BROWSERS.map((browser) => (
                  <li key={browser} className="flex items-center gap-2">
                    <Chrome className="h-3.5 w-3.5 text-slate-400" />
                    {browser}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <Badge variant="secondary">Web-based only</Badge>
              <span>
                No native install is required. All features run in the
                browser-based system.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="flex h-48 w-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
              <QrCode className="h-10 w-10 text-slate-400" />
              <p className="px-4">
                QR code placeholder. Later, generate unique QR codes pointing to
                the login or clock page.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

