"use client";

import { CheckCircle2, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PEOPLE = [
  {
    name: "Dela Cruz, Juan",
    role: "Intern",
    status: "Active",
    company: "Cabuyao PESO Office",
  },
  {
    name: "Santos, Maria",
    role: "Intern",
    status: "Active",
    company: "Cabuyao PESO Office",
  },
  {
    name: "Reyes, Carla",
    role: "Supervisor",
    status: "Active",
    company: "Cabuyao PESO Office",
  },
  {
    name: "Admin, System",
    role: "Administrator",
    status: "Active",
    company: "PESO System",
  },
];

export default function PeoplePage() {
  return (
    <div className="flex flex-col gap-6 px-4 pb-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">People</h1>
        <p className="text-sm text-slate-600">
          Directory of interns, supervisors, coordinators, and administrators.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Directory</CardTitle>
          <CardDescription>
            Connect this list to your users and interns endpoints to show live
            directory data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-700">
          {PEOPLE.map((person) => (
            <div
              key={person.name + person.role}
              className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-white px-3 py-2 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-slate-900">
                  {person.name}
                </p>
                <p className="text-[11px] text-slate-500">{person.company}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[11px]">
                  {person.role}
                </Badge>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 ring-1 ring-blue-200">
                  <CheckCircle2 className="h-3 w-3 text-blue-700" />
                  {person.status}
                </span>
              </div>
            </div>
          ))}

          <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>
              You can later add filters for role, company, and status, and link
              each person to their detailed profile.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

