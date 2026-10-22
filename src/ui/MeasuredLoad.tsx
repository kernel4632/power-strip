import { useState } from 'react'
import { Alert, AlertTitle } from '@/components/ui/alert'
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
import { CIRCUIT_LIMIT } from '../data/catalog'
import {
  MEASURED_GROUPS,
  MEASURED_TIMES,
  MEASURED_TOTAL,
} from '../data/measured'
import { formatEnergy } from '../lib/format'
import { measuredLabel } from '../lib/measuredTime'

const RANKED = [...MEASURED_GROUPS].sort((a, b) => b.share - a.share)

/**
 * 实测 24 小时负荷。曲线固定为记录值，不随开关变化；
 * 设备实际取的是「当前时刻」那一格的读数。
 */
export function MeasuredLoad({ index }: { index: number }) {
  const [active, setActive] = useState<string>('total')
  const group =
    active === 'total'
      ? null
      : (MEASURED_GROUPS.find((item) => item.id === active) ?? null)
  const series = group ? group.series : MEASURED_TOTAL.series
  const data = series.map((value, index) => ({
    label: MEASURED_TIMES[index] ?? '',
    value,
  }))
  const average = group ? group.avgW : MEASURED_TOTAL.avgW
  const peak = group ? group.peakW : MEASURED_TOTAL.peakW
  const energy = formatEnergy(group ? group.energyWh : MEASURED_TOTAL.energyWh)
  return (
    <Card className="gap-3 rounded-none border-0 bg-transparent py-0 shadow-none">
      <CardHeader className="gap-2 px-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>实测 24 小时负荷</CardTitle>
          <Badge variant="secondary">
            {measuredLabel(index)} · 10 分钟
          </Badge>
        </div>
        {group && <CardDescription>{group.name}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4 px-2">
        <Sparkline data={data} unit="W" label="实测 24 小时功率曲线" />
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <CardDescription>平均</CardDescription>
            <div className="text-sm tabular-nums">{average.toFixed(0)} W</div>
          </div>
          <div className="space-y-1">
            <CardDescription>峰值</CardDescription>
            <div className="text-sm tabular-nums">{peak} W</div>
          </div>
          <div className="space-y-1">
            <CardDescription>日耗电</CardDescription>
            <div className="text-sm tabular-nums">
              {energy.value} {energy.unit}
            </div>
          </div>
        </div>
        {peak > CIRCUIT_LIMIT && (
          <Alert>
            <AlertTitle>实测峰值超过线路限值</AlertTitle>
          </Alert>
        )}
        <Separator />
        <div className="space-y-1">
          <Button
            variant={active === 'total' ? 'secondary' : 'ghost'}
            className="h-auto w-full justify-between gap-2 py-2"
            onClick={() => setActive('total')}
          >
            <span>全寝合计</span>
            <span className="text-xs tabular-nums">
              {MEASURED_TOTAL.avgW.toFixed(0)} W
            </span>
          </Button>
          {RANKED.map((item) => (
            <Button
              key={item.id}
              variant={active === item.id ? 'secondary' : 'ghost'}
              className="h-auto w-full justify-between gap-2 py-2"
              onClick={() => setActive(item.id)}
            >
              <span className="truncate">{item.name}</span>
              <span className="shrink-0 text-xs tabular-nums">
                {(item.share * 100).toFixed(1)}%
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
