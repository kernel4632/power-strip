import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

const RANKED = [...MEASURED_GROUPS].sort((a, b) => b.share - a.share)

/**
 * 实测 24 小时负荷。数据来自宿舍 10 分钟粒度的功率记录，
 * 与场景里的实时模拟是两套东西：这里读的是记录，不随开关变化。
 */
export function MeasuredLoad() {
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
          <Badge variant="secondary">10 分钟 × 144</Badge>
        </div>
        <CardDescription>
          {group ? group.name : '全寝 12 类设备合计'}
        </CardDescription>
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
            <AlertDescription>
              记录到的最高功率 {peak} W，高于本设计的 {CIRCUIT_LIMIT} W
              单路上限，出现于空调、电吹风与电煮锅同时运行。
            </AlertDescription>
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
        <CardDescription>
          占全部耗电量比例；点击任一设备查看它自己的 24 小时曲线。
        </CardDescription>
      </CardContent>
    </Card>
  )
}
