import type { CSSProperties } from "react"

export type CSSVars = CSSProperties & Record<`--${string}`, string>

export const internTheme: CSSVars = {
  "--dash-bg": "#ffffff",
  "--dash-card": "#ffffff",
  "--dash-ink": "#0f172a",
  "--dash-muted": "#64748b",
  "--dash-border": "#e2e8f0",
  "--dash-accent": "#2563eb",
  "--dash-accent-strong": "#1d4ed8",
  "--dash-accent-soft": "#dbeafe",
  "--dash-warn": "#f59e0b",
  "--dash-warn-soft": "#fef3c7",
  "--dash-alert": "#dc2626",
  "--dash-alert-soft": "#fee2e2",
}
