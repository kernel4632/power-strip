import { DEVICE_CATALOG } from './catalog'
import { MEASURED_MAP, MEASURED_TIMES, MEASURED_INTERVAL_MINUTES, type MeasuredGroup } from './measured'

// The catalogue defines the displayed scope. Source groups already include all
// their units; check:data verifies that these counts match the modeled devices.
export const SCENE_MEASURED_GROUPS = [...new Set(DEVICE_CATALOG.map(device => device.measuredGroup))]
  .map(id => MEASURED_MAP[id])

const series = MEASURED_TIMES.map((_, i) =>
  SCENE_MEASURED_GROUPS.reduce((sum, group) => sum + group.series[i], 0),
)
const sum = series.reduce((total, watts) => total + watts, 0)

export const SCENE_MEASURED_TOTAL: MeasuredGroup = {
  id: 'scene',
  name: '场景设备合计',
  units: DEVICE_CATALOG.length,
  avgW: sum / series.length,
  // Simultaneous peak, not the sum of peaks from different times.
  peakW: Math.max(...series),
  energyWh: sum * MEASURED_INTERVAL_MINUTES / 60,
  hours: SCENE_MEASURED_GROUPS.reduce((total, group) => total + group.hours, 0),
  series,
}
