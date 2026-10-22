import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatPower } from '@/lib/format'
import { HotspotLine } from '@/components/ui/hotspot-line'
import { DEVICE_CATALOG, STATIONS } from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'

export function Hotspots() {
  const state = usePowerStore()
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-label="场景设备标记"
    >
      {STATIONS.map((s) => (
        <HotspotLine key={s.id} id={`strip-${s.id}`} />
      ))}
      {DEVICE_CATALOG.map((d) => (
        <HotspotLine key={d.id} id={d.id} />
      ))}
      {STATIONS.map((s) => (
        <div
          className="absolute left-0 top-0"
          id={`anchor-strip-${s.id}`}
          key={s.id}
        >
          <Button
            hidden={
              state.panelExpanded ||
              state.activeStation !== s.id ||
              !state.labels ||
              state.inspectionPart === 'bed'
            }
            size="icon"
            variant="ghost"
            className={cn(
              'pointer-events-auto rounded-none border border-border border-b-2 bg-card text-card-foreground hover:bg-card',
              state.selected === s.id
                ? 'border-b-foreground'
                : 'border-b-transparent',
            )}
            aria-label={`查看${s.name}插排`}
            title={`${s.name}插排`}
            onClick={() => state.select(s.id)}
          >
            <Zap />
          </Button>
        </div>
      ))}
      {DEVICE_CATALOG.map((d) => (
        <div className="absolute left-0 top-0" id={`anchor-${d.id}`} key={d.id}>
          <Button
            hidden={
              state.panelExpanded ||
              state.activeStation !== d.stationId ||
              !state.labels ||
              state.inspectionPart === 'bed' ||
              state.inspectionPart === 'strip'
            }
            variant="ghost"
            className={cn(
              'pointer-events-auto h-11 min-w-11 gap-2 rounded-none border border-border border-b-2 bg-card px-2.5 text-xs text-card-foreground hover:bg-card',
              state.selected === d.id
                ? 'border-b-foreground'
                : 'border-b-transparent',
            )}
            aria-label={`查看${STATIONS.find((s) => s.id === d.stationId)!.name}${d.name}`}
            aria-pressed={state.selected === d.id}
            title={`${d.name} · ${formatPower(state.devices[d.id].watts)} W`}
            onClick={() => state.select(d.id)}
          >
            <span>{d.name}</span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {formatPower(state.devices[d.id].watts)} W
            </span>
          </Button>
        </div>
      ))}
    </div>
  )
}
