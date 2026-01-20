"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Clock3,
  FileText,
  HelpCircle,
  MapPin,
  Menu,
  Settings,
  Smartphone,
  Users,
  LayoutDashboard,
  FileSpreadsheet,
  Plane,
  LineChart,
  UserCircle2,
  Navigation2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/timesheets", label: "Timesheets", icon: FileSpreadsheet },
  { href: "/dashboard/live-locations", label: "Live Locations", icon: MapPin },
  { href: "/dashboard/geofences", label: "Geofences", icon: Navigation2 },
  { href: "/dashboard/time-off", label: "Time Off", icon: Plane },
  { href: "/dashboard/reports", label: "Reports", icon: LineChart },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/people", label: "People", icon: Users },
  { href: "/dashboard/time-tracking", label: "Time Tracking", icon: Clock3 },
  { href: "/dashboard/work-schedules", label: "Work Schedules", icon: CalendarDays },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== "admin") {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  const isAuthorized = !!user && user.role === "admin";

  const currentNavItem =
    NAV_ITEMS.find((item) => pathname?.startsWith(item.href)) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-[1600px] gap-0 px-2 py-3 sm:px-3">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 flex-col rounded-2xl border border-slate-200 bg-white/90 px-3 py-4 shadow-sm lg:flex">
          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                PESO Attendance
              </p>
              <p className="text-sm font-semibold text-slate-900">
                Admin Console
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-200">
              Admin
            </span>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-medium transition-colors",
                    "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    isActive &&
                      "bg-slate-900 text-white hover:bg-slate-900 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Today&apos;s summary</p>
            <p className="mt-1 text-[11px] leading-relaxed">
              Review attendance, approvals, and schedules in one place.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-h-[calc(100vh-24px)] flex-1 flex-col rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
          {/* Mobile header */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 lg:hidden">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                className="shrink-0 border-slate-200"
              >
                <Menu className="h-4 w-4" />
              </Button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  PESO Attendance
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {currentNavItem.label}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-200">
              Admin
            </span>
          </div>

          {/* Top header bar */}
          <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div className="flex flex-1 items-center gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Admin dashboard
                </p>
                <h1 className="text-lg font-semibold text-slate-900">
                  {currentNavItem.label}
                </h1>
              </div>

              <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium text-slate-600 sm:flex">
                <button className="rounded-full px-2 py-1 hover:bg-white">
                  Day
                </button>
                <button className="rounded-full bg-white px-2 py-1 shadow-xs">
                  Week
                </button>
                <button className="rounded-full px-2 py-1 hover:bg-white">
                  Month
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 md:flex">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-full border-slate-200 bg-white text-xs"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  All Locations
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-full border-slate-200 bg-white text-xs"
                >
                  <Users className="h-3.5 w-3.5" />
                  All Groups
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 rounded-full border-slate-200 bg-white text-xs"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  All Schedules
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              <Button
                size="sm"
                className="h-8 rounded-full bg-blue-700 px-3 text-xs font-semibold text-white hover:bg-blue-800"
              >
                <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                Start tracking
              </Button>

              <Button
                variant="outline"
                size="icon-sm"
                className="h-8 w-8 rounded-full border-slate-200 bg-white"
              >
                <Bell className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                className="h-8 w-8 rounded-full border-slate-200 bg-white"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>

              <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700">
                <UserCircle2 className="h-5 w-5 text-slate-500" />
                <span className="hidden sm:inline">
                  {user?.name ?? "Admin"}
                </span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            </div>
          </header>

          {/* Access control + content */}
          <main className="flex-1 overflow-y-auto bg-slate-50/80">
            {!isAuthorized ? (
              <div className="flex h-full items-center justify-center px-4 py-10">
                <div className="max-w-md rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900 shadow-sm">
                  <p className="font-semibold">Admin access only</p>
                  <p className="mt-1 text-xs leading-relaxed">
                    You must be signed in as an administrator to view this
                    dashboard. Redirecting to the login page…
                  </p>
                </div>
              </div>
            ) : (
              children
            )}
          </main>

          {/* Subtle footer strip */}
          <footer className="border-t border-slate-200 bg-white/80 px-4 py-2 text-[11px] text-slate-500">
            <div className="flex items-center justify-between gap-2">
              <span>
                PESO OJT Attendance · Admin view ·{" "}
                <span className="font-medium">Internal use only</span>
              </span>
              <span className="hidden items-center gap-1 sm:inline-flex">
                <FileText className="h-3 w-3" />
                Audit-ready records
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

