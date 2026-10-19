import { APPLIANCE_CATALOG } from '../data/catalog'
import { totalWatts, outletWatts, usePowerStore } from '../store/usePowerStore'
import type { ApplianceKind } from '../types'

const CIRCUIT_LIMIT = 2200

interface PowerPanelProps {
  selectedId: number | null
  onSelect: (id: number) => void
}

export function PowerPanel({ selectedId, onSelect }: PowerPanelProps) {
  const outlets = usePowerStore((state) => state.outlets)
  const toggle = usePowerStore((state) => state.toggle)
  const plug = usePowerStore((state) => state.plug)
  const unplug = usePowerStore((state) => state.unplug)
  const reset = usePowerStore((state) => state.reset)

  const total = totalWatts(outlets)
  const ratio = Math.min(1, total / CIRCUIT_LIMIT)
  const over = total > CIRCUIT_LIMIT

  const handlePlug = (id: number, kind: string) => {
    const spec = APPLIANCE_CATALOG.find((item) => item.kind === (kind as ApplianceKind))
    if (spec) plug(id, spec)
  }

  return (
    <aside className="panel">
      <header className="panel__header">
        <h1>宿舍排插功率可视化</h1>
        <p className="panel__sub">3D 电器交互 · 实时负载</p>
      </header>

      <section className={`gauge ${over ? 'gauge--over' : ''}`}>
        <div className="gauge__value">
          {total.toFixed(0)}
          <span>W</span>
        </div>
        <div className="gauge__track">
          <div
            className="gauge__fill"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <div className="gauge__meta">
          <span>回路上限 {CIRCUIT_LIMIT} W</span>
          <span>{(ratio * 100).toFixed(0)}%</span>
        </div>
      </section>

      <ul className="outlets">
        {outlets.map((outlet) => {
          const watts = outletWatts(outlet)
          return (
            <li
              key={outlet.id}
              className={`outlet ${outlet.id === selectedId ? 'outlet--active' : ''}`}
              onClick={() => onSelect(outlet.id)}
            >
              <div className="outlet__row">
                <span className="outlet__label">{outlet.label}</span>
                <span className="outlet__watts">{watts.toFixed(1)} W</span>
              </div>
              <div className="outlet__row">
                <select
                  value={outlet.appliance?.kind ?? ''}
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) => {
                    if (event.target.value === '') unplug(outlet.id)
                    else handlePlug(outlet.id, event.target.value)
                  }}
                >
                  <option value="">空插座</option>
                  {APPLIANCE_CATALOG.map((spec) => (
                    <option key={spec.kind} value={spec.kind}>
                      {spec.label} · {spec.ratedWatts}W
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!outlet.appliance}
                  className={outlet.on ? 'btn btn--on' : 'btn'}
                  onClick={(event) => {
                    event.stopPropagation()
                    toggle(outlet.id)
                  }}
                >
                  {outlet.on ? '开' : '关'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <button type="button" className="btn btn--reset" onClick={reset}>
        重置场景
      </button>
    </aside>
  )
}
