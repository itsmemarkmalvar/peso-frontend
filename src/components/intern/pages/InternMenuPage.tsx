const menuItems = [
  {
    title: "Profile",
    detail: "Update personal details and contact information.",
  },
  {
    title: "Notifications",
    detail: "Manage alerts for approvals and schedules.",
  },
  {
    title: "Documents",
    detail: "View files and internship requirements.",
    href: "/dashboard/intern/documents",
  },
  {
    title: "Support",
    detail: "Contact your supervisor.",
  },
] as const

export default function InternMenuPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
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
        {menuItems.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-(--dash-border) bg-(--dash-card) p-6 shadow-sm"
          >
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="mt-2 text-xs text-(--dash-muted)">
              {item.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
