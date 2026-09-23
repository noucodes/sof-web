import * as React from "react"

import { cn } from "@/lib/utils"

// shadcn/ui input, mapped onto the Cobalt Ink tokens (the stock classes —
// border-input, ring-ring, … — have no matching colour in this palette).
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border-[1.5px] border-frame-input bg-white px-3 py-1 text-sm text-ink transition-[border-color,box-shadow] duration-[120ms] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:border-primary focus-visible:shadow-focus-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
