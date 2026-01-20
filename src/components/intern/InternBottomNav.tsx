"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CheckCircle2, Clock, FileText, Home, Menu } from "lucide-react"

import { cn } from "@/lib/utils"

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
    label: "Time/Clock",
    href: "/dashboard/intern/time",
    matches: ["/dashboard/intern/time", "/dashboard/intern/clock"],
    icon: Clock,
  },
  {
    label: "Timesheet",
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
    icon: Menu,
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

export function InternBottomNav() {
  const pathname = usePathname() ?? ""
  const normalizedPath =
    pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[color:var(--dash-border)] bg-[color:var(--dash-card)]/95 backdrop-blur">
      <nav className="mx-auto grid w-full max-w-4xl grid-cols-5 gap-1 px-3 py-2">
        {navItems.map((item) => {
          const active = isActiveRoute(normalizedPath, item)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition",
                active
                  ? "bg-[color:var(--dash-accent-soft)] text-[color:var(--dash-accent-strong)]"
                  : "text-[color:var(--dash-muted)] hover:text-[color:var(--dash-ink)]"
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
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
