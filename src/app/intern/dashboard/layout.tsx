import type { ReactNode } from "react"

import { InternShell } from "@/components/intern/InternShell"

type InternAliasLayoutProps = {
  children: ReactNode
}

export default function InternAliasLayout({
  children,
}: InternAliasLayoutProps) {
  return <InternShell>{children}</InternShell>
}
