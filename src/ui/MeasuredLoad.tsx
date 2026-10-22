import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Sparkline } from '@/components/ui/sparkline'
import { MEASURED_GROUPS, MEASURED_MAP, MEASURED_TIMES, MEASURED_TOTAL } from '../data/measured'
import type { DeviceSpec } from '../types'
import { measuredLabel } from '../lib/measuredTime'

const BY_AVERAGE = [MEASURED_TOTAL, ...[...MEASURED_GROUPS].sort((a, b) => b.avgW - a.avgW)]

/**
 * 原表 24 小时负荷。曲线是那一天的记录，不随开关变化；
 * 场景里的设备取的是「当前时刻」那一格的读数。
 */
export function MeasuredLoad({ index, device }: { index: number; device?: DeviceSpec }) {
  const [active, setActive] = useState<string>(BY_AVERAGE[0]?.id ?? '')
  const group = device ? MEASURED_MAP[device.measuredGroup] : BY_AVERAGE.find((item) => item.id === active) ?? MEASURED_TOTAL
  const divisor = device?.measuredUnits ?? 1
  if (!group) return null
  const data = group.series.map((value, i) => ({
    label: MEASURED_TIMES[i] ?? '',
    value: value / divisor,
  }))
  const energy = (group.energyWh / divisor / 1000).toFixed(4)
  return (
    <Card className="gap-3 rounded-none border-0 bg-transparent py-0 shadow-none">
      <CardHeader className="gap-2 px-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>24 小时记录</CardTitle>
          <Badge variant="secondary">{measuredLabel(index)} · 10 分钟</Badge>
        </div>
        <CardDescription>{device ? `${device.name} · ${group.units} 台均分` : group.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-2">
        <Sparkline data={data} unit="W" label="24 小时功率记录" />
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <CardDescription>平均</CardDescription>
            <div className="text-sm tabular-nums">{(group.avgW / divisor).toFixed(2)} W</div>
          </div>
          <div className="space-y-1">
            <CardDescription>峰值</CardDescription>
            <div className="text-sm tabular-nums">{group.peakW / divisor} W</div>
          </div>
          <div className="space-y-1">
            <CardDescription>日耗电</CardDescription>
            <div className="text-sm tabular-nums">
              {energy} kWh
            </div>
          </div>
        </div>
        {!device && <Separator />}
        {!device && <div className="space-y-1">
          {BY_AVERAGE.map((item) => (
            <Button
              key={item.id}
              variant={active === item.id ? 'secondary' : 'ghost'}
              className="h-auto w-full justify-between gap-2 py-2"
              onClick={() => setActive(item.id)}
            >
              <span className="truncate">{item.name}</span>
              <span className="shrink-0 text-xs tabular-nums">
                {item.avgW.toFixed(1)} W
              </span>
            </Button>
          ))}
        </div>}
      </CardContent>
    </Card>
  )
}
