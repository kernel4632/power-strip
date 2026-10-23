import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Toggle as TogglePrimitive } from "radix-ui"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[background-color,color,box-shadow,translate] duration-(--motion-fast) ease-ui motion-safe:active:translate-y-0.5 outline-none hover:bg-glass-hover hover:text-foreground focus-visible:border-ring focus-visible:ring-(length:--focus-ring-width) focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[state=on]:bg-glass-selected data-[state=on]:text-accent-foreground data-[state=on]:ring-1 data-[state=on]:ring-inset data-[state=on]:ring-glass-edge dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        tool: "relative rounded-lg bg-transparent text-muted-foreground hover:bg-muted data-[state=on]:bg-muted data-[state=on]:text-foreground data-[state=on]:ring-0 after:absolute after:inset-x-4 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-foreground after:opacity-0 after:transition-opacity after:duration-(--motion-fast) data-[state=on]:after:opacity-100",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-11 min-w-11 px-2",
        sm: "h-8 min-w-8 px-1.5",
        lg: "h-10 min-w-10 px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
