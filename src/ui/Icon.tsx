export type IconName =
  | 'bolt'
  | 'sun'
  | 'moon'
  | 'close'
  | 'focus'
  | 'arrow'
  | 'power'
  | 'grid'
  | 'layers'
  | 'rotate'
  | 'eye'
  | 'chart'
  | 'mouse'
  | 'leaf'
  | 'check'
  | 'info'
  | 'home'

const paths: Record<IconName, React.ReactNode> = {
  bolt: <path d="m13 2-8 12h6l-1 8 9-13h-6l1-7Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
    </>
  ),
  moon: <path d="M20 14A8 8 0 0 1 10 4a8.5 8.5 0 1 0 10 10Z" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  focus: (
    <>
      <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  power: (
    <>
      <path d="M12 2v9M6 5a9 9 0 1 0 12 0" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 10 5-10 5L2 8l10-5Zm-9 9 9 5 9-5M3 16l9 5 9-5" />
    </>
  ),
  rotate: (
    <>
      <path d="M20 8a8 8 0 1 0 .2 7M20 3v5h-5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  chart: (
    <>
      <path d="M3 3v18h18M6 15l4-5 4 3 6-8" />
    </>
  ),
  mouse: (
    <>
      <rect x="6" y="2" width="12" height="20" rx="6" />
      <path d="M12 6v4" />
    </>
  ),
  leaf: (
    <>
      <path d="M20 3C7 1 1 7 5 15s18 5 15-12ZM5 20l11-12" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6m0-10v.2" />
    </>
  ),
  home: (
    <>
      <path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3V10Z" />
    </>
  ),
}

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
