/** Integer powers do not need trailing zeroes. */
export function formatPower(watts: number) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(
    watts,
  )
}

export function formatEnergy(wattHours: number) {
  return { value: (wattHours / 1000).toFixed(4), unit: 'kWh' }
}

/** 负载占阈值比例，用于分级配色。 */
export function loadLevel(watts: number, limit: number) {
  const ratio = limit > 0 ? watts / limit : 0
  if (ratio > 1) return 'over' as const
  if (ratio > 0.75) return 'near' as const
  return 'calm' as const
}
