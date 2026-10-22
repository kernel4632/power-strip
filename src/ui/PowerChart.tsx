import { Sparkline } from '@/components/ui/sparkline'
import type { DeviceId, PowerSample, StationId } from '../types'

export function PowerChart({
  history,
  device,
  station,
  compact,
}: {
  history: PowerSample[]
  device?: DeviceId
  station?: StationId
  compact?: boolean
}) {
  const data = history.slice(-60).map((sample) => ({
    label: new Date(sample.time).toLocaleTimeString('zh-CN', { hour12: false }),
    value: device
      ? sample.devices[device]
      : station
        ? sample.stations[station]
        : sample.total,
  }))
  return (
    <Sparkline
      data={data}
      compact={compact}
      unit="W"
      label={
        device
          ? '设备本次功率'
          : station
            ? '床位本次功率'
            : '全寝本次功率'
      }
    />
  )
}
