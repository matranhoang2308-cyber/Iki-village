import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-xs font-medium tracking-widest uppercase transition-all duration-300 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#316817] focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[#316817] text-[#FAF7F2] hover:bg-[#275413] shadow-sm hover:shadow-[0_8px_20px_rgba(49,104,23,0.35)] hover:-translate-y-px focus-visible:ring-[#7AB463]",
        gold:
          "bg-gradient-to-br from-[#B8965A] to-[#CDA85A] text-[#FAF7F2] hover:from-[#275413] hover:to-[#9A7A44] shadow-sm hover:shadow-[0_8px_24px_rgba(184,150,90,0.35)] hover:-translate-y-px",
        outline:
          "border border-[#316817] bg-transparent text-[#275413] hover:bg-[#316817] hover:text-[#FAF7F2]",
        "outline-gold":
          "border border-[#B8965A] bg-transparent text-[#9A7A44] hover:bg-[#B8965A] hover:text-[#FAF7F2]",
        ghost:
          "bg-transparent text-[#7A6E60] hover:bg-[#F0EBE0] hover:text-[#2C2820]",
        destructive:
          "bg-[#C4714A] text-[#FAF7F2] hover:bg-[#A85A38]",
      },
      size: {
        default: "h-11 px-8 py-2",
        sm: "h-9 px-4 text-[10px]",
        lg: "h-13 px-10",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
