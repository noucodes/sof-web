"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

// shadcn/ui calendar (react-day-picker), mapped onto the Cobalt Ink tokens.
// Range days: ends are solid primary, the days between get primary-wash.
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex flex-col gap-3",
        month_caption: "flex h-8 items-center justify-center",
        caption_label: "text-sm font-medium text-ink",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-muted"),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-muted"),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-[0.75rem] font-normal text-muted",
        week: "mt-1 flex w-full",
        day: "relative h-9 w-9 p-0 text-center text-sm",
        day_button:
          "inline-flex h-9 w-9 items-center justify-center rounded-md font-normal text-ink transition-colors hover:bg-surface-hover focus-visible:shadow-focus-ring focus-visible:outline-none",
        range_start: "rounded-l-md bg-primary-wash [&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary-deep",
        range_end: "rounded-r-md bg-primary-wash [&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary-deep",
        range_middle: "bg-primary-wash [&>button]:rounded-none [&>button]:text-primary [&>button]:hover:bg-primary-wash",
        selected: "",
        today: "[&>button]:font-semibold [&>button]:underline [&>button]:underline-offset-4",
        outside: "[&>button]:text-muted [&>button]:opacity-50",
        disabled: "[&>button]:text-muted [&>button]:opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />,
      }}
      {...props}
    />
  )
}

export { Calendar }
