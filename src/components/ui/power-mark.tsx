/** The product's mark: four bars, one per bed, read as a level meter.
 * Drawn for this project (four stations), not a generic dashboard icon. */
export function PowerMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <rect x="0" y="9" width="3" height="7" />
      <rect x="4.5" y="4" width="3" height="12" />
      <rect x="9" y="6.5" width="3" height="9.5" />
      <rect x="13.5" y="1" width="2.5" height="15" />
    </svg>
  )
}
