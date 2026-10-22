import * as React from "react"
import { cn } from "cn"
import { Switch as SwitchPrimitive } from "radix-ui"

/** A squared rocker: 40×28 track, 20px square thumb travelling 12px, 56×44 hit area. */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer group/switch relative inline-flex h-11 w-14 shrink-0 items-center outline-none focus-visible:ring-(length:--focus-ring-width) focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-2 inset-y-2 border border-border bg-muted transition-colors duration-(--motion-control) ease-ui group-data-[state=checked]/switch:border-foreground group-data-[state=checked]/switch:bg-foreground"
      />
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "absolute top-1/2 left-3 block size-5 -translate-y-1/2 bg-card ring-0 transition-transform duration-(--motion-control) ease-ui data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0 data-[state=unchecked]:bg-foreground"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
