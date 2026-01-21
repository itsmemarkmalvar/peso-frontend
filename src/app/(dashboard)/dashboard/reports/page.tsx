"use client";

import { BarChart3, Download, FileText } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Reports</h1>
        <p className="text-sm text-slate-600">
          Generate attendance summaries, DTRs, and export-ready files.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,2.8fr)]">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Attendance summary</CardTitle>
              <CardDescription>
                Placeholder for a Chart.js visualization of present, late, and
                absent trends.
              </CardDescription>
            </div>
            <Badge className="bg-slate-900 text-white">Chart.js</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500">
              <div className="flex flex-col items-center gap-2 text-center">
                <BarChart3 className="h-5 w-5 text-slate-400" />
                <p>
                  Chart component goes here. Connect to aggregated attendance
                  data from the Laravel API.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Quick export options</CardTitle>
            <CardDescription>
              One-click access to the most common attendance reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ExportRow
              title="Daily Time Record (DTR)"
              description="Per intern or per group, ready for printing or digital submission."
            />
            <ExportRow
              title="Late / Absent Summary"
              description="List of late arrivals and absences for a selected period."
            />
            <ExportRow
              title="Hours Rendered"
              description="Total hours per intern per date range, grouped by company or supervisor."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ExportRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white px-3 py-3 text-xs text-slate-700 md:flex-row md:items-center md:justify-between">
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-[11px] text-slate-500">{description}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-full border-slate-200 text-xs"
        >
          <FileText className="h-3.5 w-3.5" />
          Preview
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 rounded-full border-slate-200 text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>
    </div>
  );
}

