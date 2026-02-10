"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { InternOnboarding } from "@/components/intern/InternOnboarding/InternOnboarding"
import { InternProfileEdit } from "@/components/intern/InternProfileEdit/InternProfileEdit"

function InternOnboardingPageContent() {
  const searchParams = useSearchParams()
  const isEditMode = searchParams?.get("profile") === "1" || searchParams?.get("edit") === "1"

  return isEditMode ? <InternProfileEdit /> : <InternOnboarding />
}

export default function InternOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <InternOnboardingPageContent />
    </Suspense>
  )
}
