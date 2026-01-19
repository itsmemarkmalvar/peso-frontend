export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 via-white to-white" />
      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
        >
          <span aria-hidden="true">←</span>
          Back to Home
        </a>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-12 md:grid-cols-2">
        <div className="hidden md:block">
          <div className="rounded-3xl border border-blue-200 bg-white/70 p-8 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-700 text-white">
                P
              </div>
              <div>
                <p className="text-base font-semibold text-blue-700">PESO</p>
                <p className="-mt-1 text-sm text-slate-500">
                  OJT Attendance System
                </p>
              </div>
            </div>

            <h2 className="mt-8 text-3xl font-bold leading-tight text-slate-900">
              Transparent attendance,
              <span className="text-red-600"> empowered interns</span>.
            </h2>
            <p className="mt-3 text-slate-600">
              Clock-in/out verification, approvals, and reporting—built for
              Cabuyao PESO operations.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                "Web-based access (desktop + mobile browsers)",
                "Location + selfie verification (when enabled)",
                "Supervisor approval workflow and audit trail",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Tip: Use your official email to ensure your account is matched to
              your internship record.
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}