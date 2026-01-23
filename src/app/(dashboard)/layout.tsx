"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
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
  UserPlus,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { internTheme } from "@/components/intern/internTheme";
import pesoLogo from "@/assets/images/image-Photoroom.png";

const NAV_ITEMS = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/timesheets", label: "Timesheets", icon: FileSpreadsheet },
  { href: "/dashboard/approvals", label: "Approvals", icon: CheckCircle2 },
  { href: "/dashboard/live-locations", label: "Live Locations", icon: MapPin },
  { href: "/dashboard/geofences", label: "Geofences", icon: Navigation2 },
  { href: "/dashboard/time-off", label: "Leave", icon: Plane },
  { href: "/dashboard/reports", label: "Reports", icon: LineChart },
  { href: "/dashboard/people", label: "People", icon: Users },
  { href: "/dashboard/promote", label: "New Users", icon: UserCheck },
  { href: "/dashboard/time-tracking", label: "Time Tracking", icon: Clock3 },
  { href: "/dashboard/work-schedules", label: "Work Schedules", icon: CalendarDays },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!user || user.role !== "admin") {
      router.replace("/login");
      return;
    }
  }, [isLoading, user, router]);

  const isAuthorized = !!user && user.role === "admin";

  // Show loading state to prevent layout from disappearing
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render layout if not authorized (will redirect)
  if (!isAuthorized) {
    return null;
  }

  const currentNavItem =
    NAV_ITEMS.find((item) => pathname?.startsWith(item.href)) ?? NAV_ITEMS[0];

  return (
    <div
      style={internTheme}
      className="relative min-h-screen overflow-hidden bg-[color:var(--dash-bg)] text-[color:var(--dash-ink)]"
    >
      {/* subtle background accents */}
      <div className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-4rem] h-72 w-72 rounded-full bg-sky-100/60 blur-3xl" />

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden"
        />
      ) : null}

      <div className="relative flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[color:var(--dash-border)] bg-[color:var(--dash-card)]/95 px-4 py-5 backdrop-blur transition-transform lg:sticky lg:translate-x-0 lg:z-auto",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white p-1.5 shadow-sm">
                <Image
                  src={pesoLogo}
                  alt="PESO Logo"
                  width={32}
                  height={32}
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
                  Admin Portal
                </p>
                <p className="text-sm font-semibold">PESO Attendance</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-200">
              Admin
            </span>
          </div>

          <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    router.push(item.href);
                  }}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
                    isActive
                      ? "bg-[color:var(--dash-accent-soft)] text-[color:var(--dash-accent-strong)]"
                      : "text-[color:var(--dash-muted)] hover:bg-slate-50 hover:text-[color:var(--dash-ink)]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive
                        ? "text-[color:var(--dash-accent)]"
                        : "text-[color:var(--dash-muted)] group-hover:text-[color:var(--dash-ink)]"
                    )}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-[color:var(--dash-border)] bg-[color:var(--dash-accent-soft)] p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-accent-strong)]">
              Admin view
            </p>
            <p className="mt-2 text-xs text-[color:var(--dash-muted)]">
              Review attendance, approvals, and schedules in one place.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex h-screen flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[color:var(--dash-border)] bg-white/90 px-6 py-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--dash-border)] text-[color:var(--dash-muted)] transition hover:text-[color:var(--dash-ink)] lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
                  Admin Dashboard
                </p>
                <p className="text-sm font-semibold">
                  PESO OJT Attendance System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 sm:inline-flex">
                Signed in as {user?.name ?? "Admin"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-[color:var(--dash-border)] px-3 text-xs text-[color:var(--dash-muted)] hover:text-[color:var(--dash-ink)]"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
              >
                Log out
              </Button>
            </div>
          </header>

          {/* Access control + content */}
          <main className="flex-1 overflow-y-auto bg-[color:var(--dash-bg)]">
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
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
                {children}
              </div>
            )}
          </main>

          {/* Subtle footer strip */}
          <footer className="border-t border-[color:var(--dash-border)] bg-white/80 px-6 py-2 text-[11px] text-[color:var(--dash-muted)]">
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

