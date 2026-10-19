import { useId, useState } from 'react'
import type { DeviceId, PowerSample, StationId } from '../types'

export function PowerChart({
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
  const gradientId = useId().replace(/:/g, '')
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const samples = history.slice(-60)
  const values = samples.map((sample) =>
    device
      ? sample.devices[device]
      : station
        ? sample.stations[station]
        : sample.total,
  )
  const max = Math.max(10, ...values) * 1.2
  const width = 300
  const height = compact ? 48 : 112
  const points = values.map((value, index) => [
    (index / Math.max(1, values.length - 1)) * width,
    height - 8 - (value / max) * (height - 18),
  ])
  const line = points
    .map(
      ([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`,
    )
    .join(' ')
  const area =
    points.length > 1 ? `${line} L${width},${height} L0,${height} Z` : ''
  const index =
    hoverIndex === null ? null : Math.min(hoverIndex, samples.length - 1)
  return (
    <div className={`power-chart ${compact ? 'power-chart--compact' : ''}`}>
      {!compact && (
        <div className="chart-caption">
          <span>
            {index !== null && samples[index]
              ? new Date(samples[index].time).toLocaleTimeString('zh-CN', {
                  hour12: false,
                })
              : '最近 60 秒'}
          </span>
          <b>
            {index !== null
              ? `${values[index]?.toFixed(1) ?? '0'} W`
              : `${Math.max(0, ...values).toFixed(0)} W 峰值`}
          </b>
        </div>
      )}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={
          device
            ? '设备模拟功率趋势'
            : station
              ? '床位模拟功率趋势'
              : '总模拟功率趋势'
        }
        onMouseLeave={() => setHoverIndex(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          setHoverIndex(
            Math.round(
              ((event.clientX - rect.left) / rect.width) * (samples.length - 1),
            ),
          )
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {!compact &&
          [0.25, 0.5, 0.75].map((y) => (
            <line
              key={y}
              x1="0"
              x2={width}
              y1={height * y}
              y2={height * y}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeDasharray="3 5"
            />
          ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={compact ? 2 : 2.2}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {index !== null && points[index] && (
          <>
            <line
              x1={points[index][0]}
              x2={points[index][0]}
              y1="0"
              y2={height}
              stroke="currentColor"
              strokeOpacity="0.3"
            />
            <circle
              cx={points[index][0]}
              cy={points[index][1]}
              r="3"
              fill="currentColor"
            />
          </>
        )}
      </svg>
      {!compact && (
        <div className="chart-axis">
          <span>
            {samples.length > 1 ? `${samples.length - 1} 秒前` : '采样开始'}
          </span>
          <span>现在</span>
        </div>
      )}
    </div>
  )
}
