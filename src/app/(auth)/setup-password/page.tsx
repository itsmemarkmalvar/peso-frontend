import { Suspense } from "react"

import { SetupPasswordClient } from "./SetupPasswordClient"

function SetupPasswordFallback() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
      Loading setup form...
    </div>
  )
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<SetupPasswordFallback />}>
      <SetupPasswordClient />
    </Suspense>
  )
}
