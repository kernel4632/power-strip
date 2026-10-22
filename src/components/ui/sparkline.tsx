import { useId, useState } from 'react'
import { cn } from 'cn'
import { Slider } from './slider'
import { formatPower } from '@/lib/format'

export type SparklinePoint = { label: string; value: number }

/**
 * 轻量折线图，呈现本次 60 点与历史 144 点记录，不引入图表库：
 * 用 viewBox 归一化坐标 + non-scaling-stroke 保持线宽，纵轴按数据自适应并留白。
 */
export function Sparkline({
  data,
  compact = false,
  unit = '',
  label,
  className,
}: {
  data: SparklinePoint[]
  compact?: boolean
  unit?: string
  label: string
  className?: string
}) {
  const summaryId = useId()
  const [active, setActive] = useState<number | null>(null)
  const count = data.length

  if (count < 2)
    return (
      <div
        className={cn(
          'grid place-items-center text-xs text-muted-foreground',
          compact ? 'h-16' : 'h-40',
          className,
        )}
      >
        无记录
      </div>
    )

  const values = data.map((point) => point.value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const spread = rawMax - rawMin
  // 变化幅度不足量程 5% 时按 5% 展开，否则半瓦的抖动会被放大成陡坡
  const scale = Math.max(spread * 1.5, Math.abs(rawMax) * 0.05, 2)
  const slack = (scale - spread) / 2
  const low = Math.max(0, rawMin - slack)
  const high = Math.max(low + 1, rawMax + slack)
  const domain = high - low || 1
  const digits = domain >= 10 ? 0 : 1

  const x = (index: number) => (index / (count - 1)) * 100
  const y = (value: number) => 100 - ((value - low) / domain) * 100
  const line = data
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${x(index).toFixed(2)},${y(point.value).toFixed(2)}`,
    )
    .join(' ')
  const activePoint = active === null ? null : data[active]
  const activeOffset = active === null ? 0 : x(active)
  const readingIndex = Math.min(active ?? count - 1, count - 1)
  const reading = data[readingIndex]

  return (
    <div
      role={compact ? 'img' : 'group'}
      aria-label={label}
      aria-describedby={summaryId}
      className={cn(
        'relative w-full select-none',
        compact ? 'h-16' : 'space-y-2',
        className,
      )}
    >
      <p id={summaryId} className="sr-only">
        {data[0].label} 至 {data[count - 1].label}，最低 {formatPower(rawMin)}{' '}
        {unit}，最高 {formatPower(rawMax)} {unit}。
        {!compact && '可用下方时间滑块和方向键读取每个时间点。'}
      </p>
      <div
        className={cn(
          compact ? 'h-full' : 'grid h-40 grid-rows-[1fr_auto] pl-9',
        )}
      >
        <div
          className={cn('relative touch-pan-y', compact ? 'h-full' : 'min-h-0')}
          onPointerDown={
            compact
              ? undefined
              : (event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  if (rect.width)
                    setActive(
                      Math.round(
                        Math.max(
                          0,
                          Math.min(1, (event.clientX - rect.left) / rect.width),
                        ) *
                          (count - 1),
                      ),
                    )
                }
          }
          onPointerMove={
            compact
              ? undefined
              : (event) => {
                  const rect = event.currentTarget.getBoundingClientRect()
                  if (!rect.width) return
                  const ratio = Math.min(
                    1,
                    Math.max(0, (event.clientX - rect.left) / rect.width),
                  )
                  setActive(Math.round(ratio * (count - 1)))
                }
          }
        >
          {!compact && (
            <div className="absolute inset-y-0 -left-9 flex w-8 flex-col justify-between text-right text-xs tabular-nums text-muted-foreground">
              <span>{high.toFixed(digits)}</span>
              <span>{((high + low) / 2).toFixed(digits)}</span>
              <span>{low.toFixed(digits)}</span>
            </div>
          )}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full text-chart-2"
            aria-hidden="true"
          >
            {!compact &&
              [0, 50, 100].map((offset) => (
                <line
                  key={offset}
                  x1="0"
                  y1={offset}
                  x2="100"
                  y2={offset}
                  className="stroke-border"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            <path
              d={line}
              fill="none"
              className="stroke-chart-2"
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {active !== null && !compact && (
              <line
                x1={activeOffset}
                y1="0"
                x2={activeOffset}
                y2="100"
                className="stroke-chart-2"
                strokeOpacity={0.6}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          {activePoint && !compact && (
            <div
              className={cn(
                'pointer-events-none absolute top-0 whitespace-nowrap border border-border bg-popover px-2 py-1 font-sans text-xs text-popover-foreground',
                activeOffset < 15
                  ? 'translate-x-0'
                  : activeOffset > 85
                    ? '-translate-x-full'
                    : '-translate-x-1/2',
              )}
              style={{ left: `${activeOffset}%` }}
            >
              <span className="tabular-nums">
                {formatPower(activePoint.value)}
                {unit && ` ${unit}`}
              </span>
              <span className="ml-2 text-muted-foreground">
                {activePoint.label}
              </span>
            </div>
          )}
        </div>
        {!compact && (
          <div className="flex justify-between pt-2 text-xs tabular-nums text-muted-foreground">
            <span>{data[0].label}</span>
            <span className="hidden sm:inline">
              {data[Math.floor((count - 1) / 2)].label}
            </span>
            <span>{data[count - 1].label}</span>
          </div>
        )}
      </div>
      {!compact && (
        <div>
          <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
            <span className="text-muted-foreground">{reading.label}</span>
            <output className="font-sans tabular-nums">
              {formatPower(reading.value)} {unit}
            </output>
          </div>
          <Slider
            min={0}
            max={count - 1}
            step={1}
            value={[readingIndex]}
            onValueChange={([value]) => setActive(value)}
            aria-label={`${label}时间点`}
            aria-valuetext={`${reading.label}，${formatPower(reading.value)} ${unit}`}
          />
        </div>
      )}
    </div>
  )
}
