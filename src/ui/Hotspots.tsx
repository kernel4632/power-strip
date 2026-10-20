import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DEVICE_CATALOG, STATIONS } from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'

export function Hotspots() {
  const state = usePowerStore()
  // Only these anchors receive pixel transforms from the 3D projection; their UI uses theme tokens.
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {STATIONS.map((s) => (
        <div
          className="absolute left-0 top-0"
          id={`anchor-strip-${s.id}`}
          key={`strip-${s.id}`}
        >
          <Button
            hidden={state.activeStation !== s.id || !state.labels}
            size="sm"
            className="pointer-events-auto"
            onClick={() => state.select(s.id)}
            aria-label={`查看${s.name}插排`}
          >
            <Zap />
            {s.number} 独立插排
          </Button>
        </div>
      ))}
      {DEVICE_CATALOG.map((d) => (
        <div className="absolute left-0 top-0" id={`anchor-${d.id}`} key={d.id}>
          <Button
            hidden={
              state.activeStation !== d.stationId ||
              !state.labels ||
              state.inspectionPart === 'bed' ||
              state.inspectionPart === 'strip'
            }
            variant={state.selected === d.id ? 'secondary' : 'outline'}
            size="sm"
            className="pointer-events-auto gap-2 text-xs"
            onClick={() => state.select(d.id)}
            aria-label={`查看${STATIONS.find((s) => s.id === d.stationId)!.name}${d.name}`}
          >
            {d.name}
            <Badge variant="secondary" className="tabular-nums">
              {state.devices[d.id].watts.toFixed(0)} W
            </Badge>
          </Button>
        </div>
      ))}
    </div>
  )
}
