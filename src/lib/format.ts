/** 小电量用 Wh 更易读，超过 100 Wh 再换算成 kWh。 */
export function formatPower(watts: number) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(
    watts,
  )
}

export function formatEnergy(wattHours: number) {
  if (wattHours < 100)
    return { value: wattHours.toFixed(wattHours < 10 ? 2 : 1), unit: 'Wh' }
  return { value: (wattHours / 1000).toFixed(2), unit: 'kWh' }
}

/** 负载占阈值比例，用于分级配色。 */
export function loadLevel(watts: number, limit: number) {
  const ratio = limit > 0 ? watts / limit : 0
  if (ratio > 1) return 'over' as const
  if (ratio > 0.75) return 'near' as const
  return 'calm' as const
}
