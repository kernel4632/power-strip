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
import { MEASURED_GROUPS, MEASURED_TIMES } from '../data/measured'
import { formatEnergy } from '../lib/format'
import { measuredLabel } from '../lib/measuredTime'

/** 只收录场景里建了模型的设备，按 24 小时平均功率降序。 */
const BY_AVERAGE = [...MEASURED_GROUPS].sort((a, b) => b.avgW - a.avgW)

/**
 * 实测 24 小时负荷。曲线是那一天的记录，不随开关变化；
 * 场景里的设备取的是「当前时刻」那一格的读数。
 */
export function MeasuredLoad({ index }: { index: number }) {
  const [active, setActive] = useState<string>(BY_AVERAGE[0]?.id ?? '')
  const group = MEASURED_GROUPS.find((item) => item.id === active) ?? BY_AVERAGE[0]
  if (!group) return null
  const data = group.series.map((value, i) => ({
    label: MEASURED_TIMES[i] ?? '',
    value,
  }))
  const energy = formatEnergy(group.energyWh)
  return (
    <Card className="gap-3 rounded-none border-0 bg-transparent py-0 shadow-none">
      <CardHeader className="gap-2 px-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>实测 24 小时负荷</CardTitle>
          <Badge variant="secondary">{measuredLabel(index)} · 10 分钟</Badge>
        </div>
        <CardDescription>{group.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-2">
        <Sparkline data={data} unit="W" label="实测 24 小时功率曲线" />
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <CardDescription>平均</CardDescription>
            <div className="text-sm tabular-nums">{group.avgW.toFixed(0)} W</div>
          </div>
          <div className="space-y-1">
            <CardDescription>峰值</CardDescription>
            <div className="text-sm tabular-nums">{group.peakW} W</div>
          </div>
          <div className="space-y-1">
            <CardDescription>日耗电</CardDescription>
            <div className="text-sm tabular-nums">
              {energy.value} {energy.unit}
            </div>
          </div>
        </div>
        <Separator />
        <div className="space-y-1">
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
        </div>
      </CardContent>
    </Card>
  )
}
