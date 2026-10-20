import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DeviceId, PowerSample, StationId } from '../types'

const Chart = lazy(() =>
  import('./PowerChartContent').then((m) => ({ default: m.PowerChartContent })),
)

export function PowerChart(props: {
  history: PowerSample[]
  device?: DeviceId
  station?: StationId
  compact?: boolean
}) {
  return (
    <Suspense
      fallback={
        <Skeleton className={cn('h-40 w-full', props.compact && 'h-16')} />
      }
    >
      <Chart {...props} />
    </Suspense>
  )
}
