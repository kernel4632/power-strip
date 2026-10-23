/** 整数功率不补零，非整数最多一位小数。 */
export function formatPower(watts: number) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(
    watts,
  )
}

/** 一次会话通常只有几百 Wh，用 Wh 才读得出变化；满 1 kWh 再换算。
 * 若统一放进 kWh 就得靠四位小数撑着，秒级刷新时末位会一直跳。
 */
export function formatEnergy(wattHours: number) {
  if (wattHours < 1000)
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
