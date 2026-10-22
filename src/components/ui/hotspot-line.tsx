/** Projection updates the line endpoints together with its label; decorative only. */
export function HotspotLine({ id }: { id: string }) {
  return (
    <svg
      id={`line-${id}`}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full overflow-visible text-muted-foreground/70"
    >
      <line stroke="currentColor" strokeWidth="1" />
      <circle r="2.5" fill="currentColor" />
    </svg>
  )
}
