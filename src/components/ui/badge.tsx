import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center font-sans text-[10px] font-medium tracking-widest uppercase transition-colors rounded-lg",
  {
    variants: {
      variant: {
        default:  "bg-[#316817] text-white px-3 py-1",
        gold:     "bg-[#B8965A] text-white px-3 py-1",
        outline:  "border border-[#316817] text-[#316817] px-3 py-1",
        "outline-gold": "border border-[#B8965A] text-[#B8965A] px-3 py-1",
        muted:    "bg-[#F0F7EC] text-[#1D400E] border border-[#AACF97] px-3 py-1",
        pending:  "bg-[#FDF8F0] text-[#7C5E30] border border-[#EDD4AC] px-3 py-1",
        success:  "bg-[#F0F7EC] text-[#1D400E] border border-[#AACF97] px-3 py-1",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
