import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DeviceId, PowerSample, StationId } from '../types'

const config = {
  watts: { label: '功率 (W)', color: 'var(--chart-2)' },
} satisfies ChartConfig
export function PowerChartContent({
  history,
  device,
  station,
  compact = false,
}: {
  history: PowerSample[]
  device?: DeviceId
  station?: StationId
  compact?: boolean
}) {
  const data = history.slice(-60).map((sample) => ({
    time: new Date(sample.time).toLocaleTimeString('zh-CN', { hour12: false }),
    watts: Number(
      (device
        ? sample.devices[device]
        : station
          ? sample.stations[station]
          : sample.total
      ).toFixed(1),
    ),
  }))
  if (!data.length) return <CardDescription>等待首次采样…</CardDescription>
  return (
    <ChartContainer
      config={config}
      className={cn('aspect-auto h-40 w-full', compact && 'h-16')}
      aria-label={
        device
          ? '设备模拟功率趋势'
          : station
            ? '床位模拟功率趋势'
            : '总模拟功率趋势'
      }
    >
      <AreaChart accessibilityLayer data={data}>
        {!compact && <CartesianGrid vertical={false} />}
        {!compact && (
          <XAxis
            dataKey="time"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
        )}
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="watts"
          type="monotone"
          fill="var(--color-watts)"
          fillOpacity={0.15}
          stroke="var(--color-watts)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
