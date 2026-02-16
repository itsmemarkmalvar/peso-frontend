"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"

type InternBackButtonProps = {
  href: string
  label?: string
  className?: string
}

export function InternBackButton({
  href,
  label = "Back",
  className = "",
}: InternBackButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-(--dash-muted) transition hover:text-(--dash-ink) ${className}`}
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  )
}
