import { DEVICE_CATALOG } from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'

export function Hotspots() {
  const state = usePowerStore()
  return (
    <div className="hotspot-layer">
      {DEVICE_CATALOG.map((spec) => (
        <div className="hotspot-anchor" id={`anchor-${spec.id}`} key={spec.id}>
          <button
            hidden={!state.labels && state.selected !== spec.id}
            className={`hotspot ${state.selected === spec.id ? 'hotspot--selected hotspot--expanded' : ''} ${state.devices[spec.id].on && state.masterOn ? 'hotspot--on' : ''}`}
            onClick={() => state.select(spec.id)}
            aria-label={`查看${spec.name}`}
          >
            <span className="hotspot__dot" />
            <span className="hotspot__text">
              {spec.name}
              <b>
                {state.devices[spec.id].watts.toFixed(0)}
                <small> W</small>
              </b>
            </span>
          </button>
        </div>
      ))}
      <div className="hotspot-anchor" id="anchor-strip">
        <button
          hidden={!state.labels && state.selected !== 'strip'}
          className={`hotspot hotspot--strip ${state.selected === 'strip' ? 'hotspot--selected' : ''}`}
          onClick={() => state.select('strip')}
          aria-label="查看能源中枢"
        >
          <span className="hotspot__dot" />
          <span className="hotspot__text">
            能源中枢{' '}
            <b>
              8<small> DEVICES</small>
            </b>
          </span>
        </button>
      </div>
    </div>
  )
}
