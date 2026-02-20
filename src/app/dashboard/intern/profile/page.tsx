"use client"

import { Suspense } from "react"
import { InternProfileEdit } from "@/components/intern/InternProfileEdit/InternProfileEdit"

export default function InternProfilePage() {
  return (
    <Suspense fallback={null}>
      <InternProfileEdit />
    </Suspense>
  )
}
