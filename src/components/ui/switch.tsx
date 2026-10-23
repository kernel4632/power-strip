import * as React from "react"
import { cn } from "cn"
import { Switch as SwitchPrimitive } from "radix-ui"

/** A 44×24 pill inside a 56×44 hit area; Radix retains the switch semantics. */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group/switch relative inline-flex h-11 w-14 shrink-0 cursor-pointer items-center rounded-full outline-none focus-visible:ring-(length:--focus-ring-width) focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-1.5 inset-y-2.5 rounded-full bg-input transition-colors duration-(--motion-control) ease-ui group-hover/switch:bg-muted-foreground/40 group-data-[state=checked]/switch:bg-primary"
      />
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "absolute top-1/2 left-2 block size-5 -translate-y-1/2 rounded-full bg-card shadow-sm ring-0 transition-[transform,background-color] duration-(--motion-control) ease-ui data-[state=checked]:translate-x-5 data-[state=checked]:bg-primary-foreground data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
