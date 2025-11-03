import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-novu-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-novu-500/10 text-novu-400 hover:bg-novu-500/20",
        secondary:
          "border-transparent bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
        success:
          "border-transparent bg-green-500/10 text-green-400 hover:bg-green-500/20",
        destructive:
          "border-transparent bg-pink-500/10 text-pink-400 hover:bg-pink-500/20",
        outline: "border-border-primary text-text-secondary hover:bg-bg-tertiary",
        glow: "border-novu-500/30 bg-novu-500/10 text-novu-400 shadow-lg shadow-novu-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
