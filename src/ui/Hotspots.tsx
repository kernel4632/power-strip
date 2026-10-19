import { DEVICE_CATALOG, STATIONS } from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'
export function Hotspots() {
  const state = usePowerStore()
  return (
    <div className="hotspot-layer">
      {STATIONS.map((s) => (
        <div
          className="hotspot-anchor"
          id={`anchor-station-${s.id}`}
          key={s.id}
        >
          <button
            hidden={!!state.activeStation || !state.labels}
            className="hotspot station-hotspot"
            onClick={() => state.selectStation(s.id)}
            aria-label={`进入${s.name}`}
          >
            <span
              className="station-hotspot__number"
              style={{ background: s.color }}
            >
              {s.number}
            </span>
            <span>
              <strong>{s.name}</strong>
              <small>{s.theme} · 独立插排</small>
            </span>
          </button>
        </div>
      ))}
      {STATIONS.map((s) => (
        <div
          className="hotspot-anchor"
          id={`anchor-strip-${s.id}`}
          key={`strip-${s.id}`}
        >
          <button
            hidden={state.activeStation !== s.id || !state.labels}
            className="hotspot hotspot--strip"
            onClick={() => state.select(s.id)}
            aria-label={`查看${s.name}插排`}
          >
            <span className="hotspot__dot" />
            <span className="hotspot__text">{s.number} 独立插排</span>
          </button>
        </div>
      ))}
      {DEVICE_CATALOG.map((d) => (
        <div className="hotspot-anchor" id={`anchor-${d.id}`} key={d.id}>
          <button
            hidden={
              state.activeStation !== d.stationId ||
              !state.labels ||
              state.inspectionPart === 'bed' ||
              state.inspectionPart === 'strip'
            }
            className={`hotspot ${state.selected === d.id ? 'hotspot--selected hotspot--expanded' : ''}`}
            onClick={() => state.select(d.id)}
            aria-label={`查看${STATIONS.find((s) => s.id === d.stationId)!.name}${d.name}`}
          >
            <span className="hotspot__dot" />
            <span className="hotspot__text">
              {d.name}
              <b>
                {state.devices[d.id].watts.toFixed(0)}
                <small> W</small>
              </b>
            </span>
          </button>
        </div>
      ))}
    </div>
  )
}
