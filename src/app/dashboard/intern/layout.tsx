import { Suspense, type ReactNode } from "react"

import { InternShell } from "@/components/intern/InternShell"

type InternLayoutProps = {
  children: ReactNode
}

export default function InternLayout({ children }: InternLayoutProps) {
  return (
    <Suspense fallback={null}>
      <InternShell>{children}</InternShell>
    </Suspense>
  )
}
