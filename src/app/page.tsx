export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-white">
              P
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700">PESO</p>
              <p className="-mt-1 text-xs text-slate-500">OJT Attendance</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-blue-700">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-blue-700">
              How It Works
            </a>
            <a href="#reports" className="hover:text-blue-700">
              Reports
            </a>
            <a href="#contact" className="hover:text-blue-700">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 md:inline-flex"
            >
              Log In
            </a>
            <button className="inline-flex rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
              Request Demo
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 via-white to-white" />
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2 md:items-center md:py-24">
            <div>
              <p className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                Web-Based OJT Attendance
              </p>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                Track intern attendance with accuracy, speed, and trust.
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                A modern attendance system for PESO that handles clock-in/out,
                approvals, schedules, and reports in one secure platform.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button className="inline-flex items-center justify-center rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800">
                  Get Started
                </button>
                <button className="inline-flex items-center justify-center rounded-full border border-red-200 px-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-50">
                  View Features
                </button>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4">
                  <p className="text-2xl font-bold text-blue-700">100%</p>
                  <p className="text-slate-500">Web-based</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4">
                  <p className="text-2xl font-bold text-red-600">24/7</p>
                  <p className="text-slate-500">Availability</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-4">
                  <p className="text-2xl font-bold text-blue-700">Secure</p>
                  <p className="text-slate-500">Verification</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Today&apos;s Snapshot
                  </p>
                  <p className="text-xs text-slate-500">
                    Intern attendance overview
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Live
                </span>
              </div>
              <div className="mt-6 grid gap-4">
                {[
                  {
                    label: "Clocked In",
                    value: "48",
                    color: "text-blue-700",
                  },
                  {
                    label: "Pending Approvals",
                    value: "7",
                    color: "text-red-600",
                  },
                  {
                    label: "Late Arrivals",
                    value: "3",
                    color: "text-blue-700",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                  >
                    <span className="text-sm text-slate-600">{stat.label}</span>
                    <span className={`text-lg font-semibold ${stat.color}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Location + selfie verification enabled for all interns.
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
              Key Features
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Everything PESO needs to manage OJT attendance
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Clock In/Out",
                desc: "Web-based time tracking with geolocation and selfie verification.",
                accent: "border-blue-200",
              },
              {
                title: "Approval Workflow",
                desc: "Supervisors can review and approve daily attendance logs.",
                accent: "border-red-200",
              },
              {
                title: "Reports & DTR",
                desc: "Generate DTRs, hours rendered, and attendance summaries.",
                accent: "border-blue-200",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`rounded-3xl border ${feature.accent} bg-white p-6 shadow-sm`}
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="about"
          className="mx-auto w-full max-w-6xl px-6 pb-6 pt-4"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-blue-200 bg-blue-50 px-6 py-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Mission
              </p>
              <p className="mt-3 text-slate-700">
                Upliftment of the quality of lives of Cabuyeños through the
                sustainable delivery of efficient and effective economic,
                educational, ecological, physical and all basic social and
                cultural services in an industrial and entrepreneurial community
                setting.
              </p>
            </div>
            <div className="rounded-3xl border border-red-200 bg-white px-6 py-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
                Vision
              </p>
              <p className="mt-3 text-slate-700">
                An entrepreneurial industrialized, progressive, service-driven
                and environment-friendly Cabuyao with God-loving citizens.
              </p>
            </div>
          </div>
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white px-6 py-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Corporate Values
            </p>
            <p className="mt-3 text-slate-700">
              Cabuyao PESO connects job seekers and employment prospects by
              upholding honesty, innovation, and service excellence. Transparency
              and moral principles guide all office dealings, while technology is
              continuously adapted to enhance service delivery. Collaboration
              with employers, government agencies, and community stakeholders
              strengthens meaningful employment linkages and inclusive growth
              for all sectors, especially vulnerable populations. These values
              reflect professionalism, respect, and a commitment to workforce
              empowerment.
            </p>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto w-full max-w-6xl px-6 py-16"
        >
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                How It Works
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                Simple flow for interns and supervisors
              </h2>
              <p className="mt-3 text-slate-600">
                Interns clock in from any browser. Supervisors review
                attendance, add notes, and approve records. Coordinators can
                generate reports at any time.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                {
                  step: "01",
                  title: "Intern clocks in",
                  desc: "Location + selfie captured for verification.",
                },
                {
                  step: "02",
                  title: "Supervisor reviews",
                  desc: "Approve or flag irregularities with comments.",
                },
                {
                  step: "03",
                  title: "Generate reports",
                  desc: "Export DTR and hours rendered instantly.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4"
                >
                  <span className="text-lg font-bold text-red-600">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="reports"
          className="mx-auto w-full max-w-6xl px-6 py-16"
        >
          <div className="rounded-3xl border border-blue-200 bg-blue-50 px-8 py-10 text-center">
            <h2 className="text-3xl font-bold text-slate-900">
              Reports that keep everyone aligned
            </h2>
            <p className="mt-3 text-slate-600">
              Generate DTR, attendance summaries, and hours rendered reports in
              seconds. Export to PDF or Excel for easy submission.
            </p>
            <button className="mt-6 inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700">
              Explore Reporting
            </button>
          </div>
        </section>

        <section
          id="history"
          className="mx-auto w-full max-w-6xl px-6 py-16"
        >
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
              History and Profile
            </p>
            <p className="mt-3 text-slate-700">
              Under Republic Act No. 8759 (PESO Act of 1999), the Cabuyao Public
              Employment Service Office (PESO) was founded to institutionalize
              employment facilitation services for local government units. Based
              in Cabuyao City, Laguna, it serves as a bridge between employers,
              job seekers, and national employment initiatives in a rapidly
              industrializing community.
            </p>
            <p className="mt-3 text-slate-700">
              Cabuyao PESO offers livelihood training, career counseling, job
              matching, and programs such as job fairs, TUPAD, and SPES. It
              partners with private businesses, government agencies (DOLE,
              TESDA), and academic institutions to strengthen workforce
              development.
            </p>
            <p className="mt-3 text-slate-700">
              By leveraging digital channels for recruitment and job
              advertising, Cabuyao PESO supports inclusive employment for youth,
              displaced workers, persons with disabilities (PWDs), and other
              vulnerable groups in line with sustainable economic growth goals.
            </p>
          </div>
        </section>

        <section
          id="contact"
          className="mx-auto w-full max-w-6xl px-6 py-16"
        >
          <div className="grid gap-8 rounded-3xl border border-slate-200 bg-white px-8 py-10 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Ready to launch?
              </h2>
              <p className="mt-3 text-slate-600">
                Let&apos;s build a reliable, transparent attendance system for
                Cabuyao PESO interns.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <button className="inline-flex items-center justify-center rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800">
                Schedule a Demo
              </button>
              <button className="inline-flex items-center justify-center rounded-full border border-blue-200 px-6 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                Contact PESO Team
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-slate-500 md:flex-row">
          <p>© 2026 City of Cabuyao PESO. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-blue-700">pesocabuyaocity@gmail.com</span>
            <span className="text-red-600">3/F Government Office</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
