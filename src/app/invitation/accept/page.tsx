import { Suspense } from "react"

import { InvitationAcceptClient } from "./InvitationAcceptClient"

function InvitationAcceptFallback() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
      Loading invitation details...
    </div>
  )
}

export default function InvitationAcceptPage() {
  return (
    <Suspense fallback={<InvitationAcceptFallback />}>
      <InvitationAcceptClient />
    </Suspense>
  )
}
