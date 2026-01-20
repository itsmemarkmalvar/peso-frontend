"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, type ReactNode } from "react"
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Home,
  Menu,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { internTheme } from "@/components/intern/internTheme"

type NavItem = {
  label: string
  href: string
  matches: readonly string[]
  icon: typeof Home
  exact?: boolean
}

const navItems: NavItem[] = [
  {
    label: "Home",
    href: "/dashboard/intern",
    matches: ["/dashboard/intern", "/dashboard/intern/home", "/intern/dashboard"],
    icon: Home,
    exact: true,
  },
  {
    label: "Time & Clock",
    href: "/dashboard/intern/time",
    matches: ["/dashboard/intern/time", "/dashboard/intern/clock"],
    icon: Clock,
  },
  {
    label: "Timesheets",
    href: "/dashboard/intern/timesheets",
    matches: ["/dashboard/intern/timesheets"],
    icon: FileText,
  },
  {
    label: "Approvals",
    href: "/dashboard/intern/approvals",
    matches: ["/dashboard/intern/approvals"],
    icon: CheckCircle2,
  },
  {
    label: "Menu",
    href: "/dashboard/intern/menu",
    matches: ["/dashboard/intern/menu"],
    icon: Settings,
  },
]

function isActiveRoute(pathname: string, item: NavItem) {
  return item.matches.some((match) => {
    if (item.exact) {
      return pathname === match
    }
    return pathname === match || pathname.startsWith(`${match}/`)
  })
}

type InternShellProps = {
  children: ReactNode
}

export function InternShell({ children }: InternShellProps) {
  const pathname = usePathname() ?? ""
  const normalizedPath =
    pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div
      style={internTheme}
      className="relative min-h-screen overflow-hidden bg-[color:var(--dash-bg)] text-[color:var(--dash-ink)]"
    >
      <div className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-red-200/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-4rem] h-72 w-72 rounded-full bg-yellow-200/50 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl" />

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
            "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[color:var(--dash-border)] bg-[color:var(--dash-card)]/95 px-4 py-5 backdrop-blur transition-[width,transform] lg:sticky lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            collapsed ? "lg:w-20" : "lg:w-64"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--dash-accent)] text-sm font-semibold text-white">
                PI
              </div>
              <div className={cn(collapsed ? "lg:hidden" : "opacity-100")}>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
                  Intern Portal
                </p>
                <p className="text-sm font-semibold">PESO Attendance</p>
              </div>
            </div>

            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setCollapsed((value) => !value)}
              className="hidden h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--dash-border)] text-[color:var(--dash-muted)] transition hover:text-[color:var(--dash-ink)] lg:inline-flex"
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>

          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const active = isActiveRoute(normalizedPath, item)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
                    collapsed ? "lg:justify-center lg:px-2" : "justify-start",
                    active
                      ? "bg-[color:var(--dash-accent-soft)] text-[color:var(--dash-accent-strong)]"
                      : "text-[color:var(--dash-muted)] hover:bg-slate-50 hover:text-[color:var(--dash-ink)]"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      active
                        ? "text-[color:var(--dash-accent)]"
                        : "text-[color:var(--dash-muted)] group-hover:text-[color:var(--dash-ink)]"
                    )}
                  />
                  <span className={cn(collapsed ? "lg:hidden" : "opacity-100")}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>

          <div
            className={cn(
              "mt-auto rounded-xl border border-[color:var(--dash-border)] bg-[color:var(--dash-accent-soft)] p-4 text-sm",
              collapsed ? "lg:hidden" : ""
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-accent-strong)]">
              Testing Mode
            </p>
            <p className="mt-2 text-sm font-semibold">
              Login is disabled for now.
            </p>
            <p className="text-xs text-[color:var(--dash-muted)]">
              Use the dashboard to preview flows.
            </p>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[color:var(--dash-border)] bg-white/90 px-6 py-4 backdrop-blur">
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
                  Intern Dashboard
                </p>
                <p className="text-sm font-semibold">
                  PESO OJT Attendance System
                </p>
              </div>
            </div>
            <span className="hidden rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700 sm:inline-flex">
              Testing build
            </span>
          </header>

          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
