import type { ReactNode } from "react"

import { InternShell } from "@/components/intern/InternShell"

type InternLayoutProps = {
  children: ReactNode
}

export default function InternLayout({ children }: InternLayoutProps) {
  return <InternShell>{children}</InternShell>
}
