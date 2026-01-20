import * as React from "react";

import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
        variant === "default" &&
          "border-transparent bg-slate-900 text-white shadow-sm",
        variant === "secondary" &&
          "border-transparent bg-slate-100 text-slate-800",
        variant === "outline" &&
          "border-slate-200 bg-transparent text-slate-700",
        className
      )}
      {...props}
    />
  );
}

export { Badge };

