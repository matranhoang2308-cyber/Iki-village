import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        // `leading-none` made the value sit low against the absolutely-centred
        // leading icon: Myriad Pro's box has far more room below the baseline
        // than above the caps. `leading-normal` lets the browser distribute
        // that space evenly inside the fixed-height field.
        "flex h-11 w-full bg-[#FAF7F2] border border-[#E0D8CC] px-4 py-2 font-sans text-[0.9375rem] leading-normal text-[#2C2820] placeholder:text-[#A89C8E] transition-all duration-200 focus-visible:outline-none focus-visible:border-[#316817] focus-visible:shadow-[0_0_0_3px_rgba(213,234,203,0.6)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }
