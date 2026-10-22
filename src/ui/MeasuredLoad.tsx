import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkline } from '@/components/ui/sparkline'
import { MEASURED_MAP, MEASURED_TIMES } from '../data/measured'
import {
  SCENE_MEASURED_GROUPS,
  SCENE_MEASURED_TOTAL,
} from '../data/sceneMeasured'
import type { DeviceSpec } from '../types'
import { DataSource } from './DataSource'
import { formatPower } from '@/lib/format'

const BY_AVERAGE = [
  SCENE_MEASURED_TOTAL,
  ...[...SCENE_MEASURED_GROUPS].sort((a, b) => b.avgW - a.avgW),
]

/**
 * 场景已建模设备的 24 小时负荷。曲线是那一天的记录，不随开关变化；
 * 该历史记录不参与当前场景的电源开关控制。
 */
export function MeasuredLoad({ device }: { device?: DeviceSpec }) {
  const [active, setActive] = useState<string>(BY_AVERAGE[0]?.id ?? '')
  const group = device
    ? MEASURED_MAP[device.measuredGroup]
    : (BY_AVERAGE.find((item) => item.id === active) ?? SCENE_MEASURED_TOTAL)
  const divisor = device?.measuredUnits ?? 1
  if (!group) return null
  const data = group.series.map((value, i) => ({
    label: MEASURED_TIMES[i] ?? '',
    value: value / divisor,
  }))
  const energy = (group.energyWh / divisor / 1000).toFixed(4)
  return (
    <div className="space-y-5">
      {!device && (
        <p className="text-sm font-medium">{group.name}</p>
      )}
      <Sparkline data={data} unit="W" label="24 小时功率记录" />
      <div className="grid grid-cols-3 gap-3 border-y border-rule py-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">平均</p>
          <p className="font-mono text-sm tabular-nums">
            {formatPower(group.avgW / divisor)}
            <span className="ml-1 text-xs text-muted-foreground">W</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">峰值</p>
          <p className="font-mono text-sm tabular-nums">
            {formatPower(group.peakW / divisor)}
            <span className="ml-1 text-xs text-muted-foreground">W</span>
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">日耗电</p>
          <p className="font-mono text-sm tabular-nums">
            {energy}
            <span className="ml-1 text-xs text-muted-foreground">kWh</span>
          </p>
        </div>
      </div>
      <DataSource groupId={group.id} device={device} />
      {!device && (
        <div className="divide-y divide-rule border-t border-rule">
          {BY_AVERAGE.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className="h-11 w-full justify-between gap-3 rounded-none px-0 font-normal hover:bg-transparent"
              aria-pressed={active === item.id}
              onClick={() => setActive(item.id)}
            >
              <span
                className={
                  active === item.id ? 'truncate' : 'truncate text-muted-foreground'
                }
              >
                {item.name}
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {formatPower(item.avgW)} W
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
