import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
            variant={state.selected === s.id ? 'default' : 'outline'}
            className="pointer-events-auto rounded-sm"
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
            variant={state.selected === d.id ? 'default' : 'outline'}
            className="pointer-events-auto h-11 min-w-11 gap-2 rounded-sm px-3 text-xs"
            aria-label={`查看${STATIONS.find((s) => s.id === d.stationId)!.name}${d.name}`}
            aria-pressed={state.selected === d.id}
            title={`${d.name} · ${formatPower(state.devices[d.id].watts)} W`}
            onClick={() => state.select(d.id)}
          >
            <span>{d.name}</span>
            <span className="font-mono">
              {formatPower(state.devices[d.id].watts)} W
            </span>
          </Button>
        </div>
      ))}
    </div>
  )
}
