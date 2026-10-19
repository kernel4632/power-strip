import { useEffect, useRef } from 'react'
import {
  CIRCUIT_LIMIT,
  DEVICE_CATALOG,
  DEVICE_MAP,
  VOLTAGE,
} from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'
import { Icon } from './Icon'
import { PowerChart } from './PowerChart'

export function PowerPanel() {
  const state = usePowerStore()
  const closeButton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const open = state.selected !== null
  useEffect(() => {
    panel.current?.scrollTo({ top: 0 })
  }, [state.selected])
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    closeButton.current?.focus({ preventScroll: true })
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [open])
  const spec =
    state.selected && state.selected !== 'strip'
      ? DEVICE_MAP[state.selected]
      : null
  const device = spec ? state.devices[spec.id] : null
  const total = Object.values(state.devices).reduce(
    (sum, item) => sum + item.watts,
    0,
  )
  const energy = Object.values(state.devices).reduce(
    (sum, item) => sum + item.energyWh,
    0,
  )
  const watts = device?.watts ?? total
  const limit = spec?.ratedWatts ?? CIRCUIT_LIMIT
  const active = device ? device.on && state.masterOn : state.masterOn
  const over = total > CIRCUIT_LIMIT
  return (
    <aside
      ref={panel}
      className={`detail-panel ${open ? 'detail-panel--open' : ''}`}
      inert={!open}
      aria-hidden={!open}
      aria-label="设备与能源详情"
    >
      <div className="detail-panel__top">
        <span className="eyebrow">
          {spec ? `DEVICE / ${spec.name}` : 'ENERGY INSIGHTS'}
        </span>
        <button
          ref={closeButton}
          className="icon-button"
          onClick={() => state.select(null)}
          aria-label="关闭详情面板"
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="detail-heading">
        <div className="device-glyph">
          <Icon
            name={
              spec?.id === 'lamp'
                ? 'sun'
                : spec?.id === 'ac' || spec?.id === 'fan'
                  ? 'rotate'
                  : 'bolt'
            }
            size={29}
          />
        </div>
        <div>
          <h2>{spec?.name ?? '宿舍能源中枢'}</h2>
          <p>{spec?.english ?? 'EVERY WATT TELLS A STORY'}</p>
        </div>
      </div>
      <div className="detail-status">
        <span
          className={active ? 'status-dot' : 'status-dot status-dot--off'}
        />
        {active
          ? '正在运行'
          : state.masterOn
            ? '待机 / 已关闭'
            : '总电源已断开'}
        <span className="simulation-tag">模拟数据</span>
      </div>
      <section
        className={`detail-power ${over && !spec ? 'detail-power--warning' : ''}`}
      >
        <span className="field-label">
          {spec ? '当前设备功率' : '当前总功率'}
        </span>
        <div className="detail-power__value">
          {watts.toFixed(1)}
          <span>W</span>
        </div>
        <div className="thin-meter">
          <span style={{ width: `${Math.min(100, (watts / limit) * 100)}%` }} />
        </div>
        <div className="meter-caption">
          <span>
            {spec ? `示例额定功率 ${limit} W` : `演示回路阈值 ${limit} W`}
          </span>
          <b>{((watts / limit) * 100).toFixed(1)}%</b>
        </div>
      </section>
      <div className="power-switch-row">
        <div>
          <strong>{spec ? '设备电源' : '总电源开关'}</strong>
          <p>
            {spec ? '同步控制场景中的电器状态' : '控制演示能源网络内的全部设备'}
          </p>
        </div>
        <button
          className={`toggle-switch ${active ? 'toggle-switch--on' : ''}`}
          role="switch"
          aria-checked={active}
          aria-label={spec ? `${spec.name}电源` : '总电源'}
          onClick={() =>
            spec ? state.toggle(spec.id) : state.setMaster(!state.masterOn)
          }
          disabled={!!spec && !state.masterOn}
        >
          <span />
        </button>
      </div>
      {spec && device && (
        <div className="level-control">
          <label htmlFor="device-level">
            {spec.id === 'lamp'
              ? '灯光亮度'
              : spec.id === 'fan'
                ? '风扇转速'
                : '模拟负载'}
            <b>{Math.round(device.level * 100)}%</b>
          </label>
          <input
            id="device-level"
            type="range"
            min="10"
            max="100"
            step="5"
            value={Math.round(device.level * 100)}
            onChange={(event) =>
              state.setLevel(spec.id, Number(event.target.value) / 100)
            }
            disabled={!active}
          />
          <div className="range-labels">
            <span>轻柔 · 10%</span>
            <span>满载 · 100%</span>
          </div>
        </div>
      )}
      <section className="detail-section">
        <div className="section-heading">
          <h3>功率轨迹</h3>
          <span>
            <i className="status-dot" /> LIVE
          </span>
        </div>
        <PowerChart history={state.history} device={spec?.id} />
      </section>
      <div className="detail-metrics">
        <div>
          <span>本次模拟耗电</span>
          <strong>
            {((device?.energyWh ?? energy) / 1000).toFixed(4)}
            <small> kWh</small>
          </strong>
        </div>
        <div>
          <span>估算电流 · {VOLTAGE}V</span>
          <strong>
            {(watts / VOLTAGE).toFixed(2)}
            <small> A</small>
          </strong>
        </div>
      </div>
      {!spec && (
        <section className="detail-section">
          <div className="section-heading">
            <h3>设备负载分布</h3>
            <span>8 DEVICES</span>
          </div>
          <div className="device-breakdown">
            {DEVICE_CATALOG.map((item) => (
              <button key={item.id} onClick={() => state.select(item.id)}>
                <span
                  className="device-breakdown__dot"
                  style={{ background: item.color }}
                />
                <span>{item.name}</span>
                <span className="device-breakdown__track">
                  <i
                    style={{
                      width: `${total ? (state.devices[item.id].watts / total) * 100 : 0}%`,
                      background: item.color,
                    }}
                  />
                </span>
                <b>{state.devices[item.id].watts.toFixed(0)} W</b>
                <Icon name="arrow" size={13} />
              </button>
            ))}
          </div>
        </section>
      )}
      {over && (
        <div className="overload-note">
          <Icon name="info" size={17} />
          <span>
            总负载已超过演示阈值。可关闭水壶或空调观察负载回落。这里只作提示，不模拟真实保护开关。
          </span>
        </div>
      )}
      {spec && (
        <>
          <p className="device-description">{spec.description}</p>
          <button
            className="focus-button"
            onClick={() => {
              state.focus()
              panel.current?.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            <Icon name="focus" size={17} />
            聚焦此设备<span>FOCUS VIEW</span>
          </button>
          <button
            className="back-overview"
            onClick={() => state.select('strip')}
          >
            查看全屋能源概览 <Icon name="arrow" size={15} />
          </button>
        </>
      )}
      <p className="panel-disclaimer">
        数值由本地模型生成，仅供交互可视化。非真实电表读数，非用电安全依据。
      </p>
    </aside>
  )
}
