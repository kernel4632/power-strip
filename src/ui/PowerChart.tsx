import { Sparkline } from '@/components/ui/sparkline'
import { DEVICE_CATALOG } from '../data/catalog'
import type { DeviceId, PowerSample, StationId } from '../types'

/** Restored from 3c5b261^; updates on controls as well as the one-second tick. */
export function PowerChart({ history, device, station }: {
  history: PowerSample[]
  device?: DeviceId
  station?: StationId
}) {
  const data = history.map((sample) => ({
    label: new Date(sample.time).toLocaleTimeString('zh-CN', { hour12: false }),
    time: sample.time,
    value: device ? sample.devices[device] : station ? sample.stations[station] : sample.total,
  }))
  const maximum = DEVICE_CATALOG
    .filter((spec) => device ? spec.id === device : station ? spec.stationId === station : true)
    .reduce((sum, spec) => sum + spec.referenceWatts, 0)
  return (
    <section className="space-y-2">
      <h3 className="text-body text-muted-foreground">本次功率 · 模拟</h3>
      <Sparkline
        data={data}
        unit="W"
        maximum={maximum}
        showControls={false}
        label={device ? '设备本次功率' : station ? '床位本次功率' : '全寝本次功率'}
      />
    </section>
  )
}
