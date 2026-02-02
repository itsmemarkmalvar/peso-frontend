"use client"

import { ReactNode, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  LayoutDashboard,
  LineChart,
  MapPin,
  Menu,
  Navigation2,
  Plane,
  Settings,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { internTheme } from "@/components/intern/internTheme"
import pesoLogo from "@/assets/images/image-Photoroom.png"

const NAV_ITEMS = [
  { href: "/dashboard/supervisor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/supervisor/timesheets", label: "Timesheets", icon: FileSpreadsheet },
  { href: "/dashboard/supervisor/approvals", label: "Approvals", icon: CheckCircle2 },
  { href: "/dashboard/supervisor/live-locations", label: "Live Locations", icon: MapPin },
  { href: "/dashboard/supervisor/geofences", label: "Geofences", icon: Navigation2 },
  { href: "/dashboard/supervisor/time-off", label: "Leave", icon: Plane },
  { href: "/dashboard/supervisor/reports", label: "Reports", icon: LineChart },
  { href: "/dashboard/supervisor/people", label: "People", icon: Users },
  { href: "/dashboard/supervisor/time-tracking", label: "Time Tracking", icon: Clock3 },
  { href: "/dashboard/supervisor/work-schedules", label: "Work Schedules", icon: CalendarDays },
  { href: "/dashboard/supervisor/settings", label: "Settings", icon: Settings },
] as const

export default function SupervisorLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isDevBypass = process.env.NODE_ENV === "development" && !user

  if (!isDevBypass && !isLoading && !user) {
    router.replace("/login")
    return null
  }

  return (
    <div
      style={internTheme}
      className="relative min-h-screen overflow-hidden bg-[color:var(--dash-bg)] text-[color:var(--dash-ink)]"
    >
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
                  Supervisor Portal
                </p>
                <p className="text-sm font-semibold">PESO Attendance</p>
              </div>
            </div>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-blue-200">
              Supervisor
            </span>
          </div>

          <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname?.startsWith(item.href)

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false)
                    router.push(item.href)
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
              )
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-[color:var(--dash-border)] bg-[color:var(--dash-accent-soft)] p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-accent-strong)]">
              Supervisor view
            </p>
            <p className="mt-2 text-xs text-[color:var(--dash-muted)]">
              Monitor interns, approvals, and schedule changes.
            </p>
          </div>
        </aside>

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
                  Supervisor Dashboard
                </p>
                <p className="text-sm font-semibold">PESO OJT Attendance System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 sm:inline-flex">
                {user?.name ? `Signed in as ${user.name}` : "Supervisor preview"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-[color:var(--dash-border)] px-3 text-xs text-[color:var(--dash-muted)] hover:text-[color:var(--dash-ink)]"
                onClick={() => {
                  logout()
                  router.replace("/login")
                }}
                disabled={isDevBypass}
              >
                Log out
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-[color:var(--dash-bg)]">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8">
              {children}
            </div>
          </main>

          <footer className="border-t border-[color:var(--dash-border)] bg-white/80 px-6 py-2 text-[11px] text-[color:var(--dash-muted)]">
            <div className="flex items-center justify-between gap-2">
              <span>
                PESO OJT Attendance - Supervisor view -{" "}
                <span className="font-medium">Internal use only</span>
              </span>
              <span className="hidden items-center gap-1 sm:inline-flex">
                <FileSpreadsheet className="h-3 w-3" />
                Attendance ready
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
