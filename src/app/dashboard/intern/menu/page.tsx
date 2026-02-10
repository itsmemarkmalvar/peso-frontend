import Link from "next/link"

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
    href: "/dashboard/intern/timesheets",
  },
  {
    title: "Support",
    detail: "Contact your coordinator or supervisor.",
    href: "mailto:pesocabuyaocity@gmail.com?subject=PESO%20OJT%20Attendance%20System%20-%20Intern%20Support",
    external: true,
  },
]

export default function InternMenuPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--dash-muted)]">
          Menu
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Tools and settings</h1>
        <p className="mt-1 text-sm text-[color:var(--dash-muted)]">
          Quickly access helpful resources for your internship.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {menuItems.map((item) => {
          const content = (
            <>
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-2 text-xs text-[color:var(--dash-muted)]">
                {item.detail}
              </p>
            </>
          )

          const cardClassName =
            "rounded-2xl border border-[color:var(--dash-border)] bg-[color:var(--dash-card)] p-6 shadow-sm transition hover:border-[color:var(--dash-accent)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--dash-accent)]"

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
