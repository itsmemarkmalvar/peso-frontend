import Link from "next/link"

import { InternBackButton } from "@/components/intern/InternBackButton"

type MenuItem = {
  title: string
  detail: string
  href: string
  external?: boolean
}

const menuItems: MenuItem[] = [
  {
    title: "Profile",
    detail: "Update personal details and contact information.",
    href: "/dashboard/intern/onboarding?profile=1",
  },
  {
    title: "Notifications",
    detail: "Manage alerts for approvals and schedules.",
    href: "/dashboard/intern/notifications",
  },
  {
    title: "Documents",
    detail: "View files and internship requirements.",
    href: "/dashboard/intern/documents",
  },
  {
    title: "Support",
    detail: "Contact your supervisor.",
    href: "mailto:pesocabuyaocity@gmail.com?subject=PESO%20OJT%20Attendance%20System%20-%20Intern%20Support",
    external: true,
  },
]

export default function InternMenuPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <InternBackButton href="/dashboard/intern" label="Back to dashboard" />
      <header className="rounded-2xl border border-(--dash-border) bg-(--dash-card) p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--dash-muted)">
          Menu
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Tools and settings</h1>
        <p className="mt-1 text-sm text-(--dash-muted)">
          Quickly access helpful resources for your internship.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {menuItems.map((item) => {
          const content = (
            <>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-2 text-xs text-(--dash-muted)">
                {item.detail}
              </p>
            </>
          )

          const cardClassName =
            "rounded-2xl border border-(--dash-border) bg-(--dash-card) p-6 shadow-sm transition hover:border-(--dash-accent) hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--dash-accent)"

          if (item.external) {
            return (
              <a key={item.title} href={item.href} className={cardClassName}>
                {content}
              </a>
            )
          }

          return (
            <Link key={item.title} href={item.href} className={cardClassName}>
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
