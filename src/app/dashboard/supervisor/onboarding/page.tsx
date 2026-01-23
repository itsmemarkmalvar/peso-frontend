import { Suspense } from "react"

import { SupervisorOnboarding } from "@/components/supervisor/SupervisorOnboarding/SupervisorOnboarding"

function SupervisorOnboardingFallback() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
      Loading supervisor onboarding...
    </div>
  )
}

export default function SupervisorOnboardingPage() {
  return (
    <Suspense fallback={<SupervisorOnboardingFallback />}>
      <SupervisorOnboarding />
    </Suspense>
  )
}
