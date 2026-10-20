import { useEffect, useRef } from 'react'
import {
  CIRCUIT_LIMIT,
  DEVICE_CATALOG,
  DEVICE_MAP,
  STATIONS,
  STATION_MAP,
  stationDevices,
  VOLTAGE,
} from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'
import type { DeviceId, StationId } from '../types'
import { Icon } from './Icon'
import { PowerChart } from './PowerChart'
import { Button } from './Button'

export function PowerPanel() {
  const state = usePowerStore(),
    panel = useRef<HTMLElement>(null),
    close = useRef<HTMLButtonElement>(null)
  const open = state.selected !== null
  const spec = state.selected?.includes('-')
    ? DEVICE_MAP[state.selected as DeviceId]
    : null
  const station = spec
    ? STATION_MAP[spec.stationId]
    : state.selected && state.selected !== 'room'
      ? STATION_MAP[state.selected as StationId]
      : null
  const devices = station ? stationDevices(station.id) : DEVICE_CATALOG
  const device = spec ? state.devices[spec.id] : null
  const watts = device
    ? device.watts
    : devices.reduce((sum, d) => sum + state.devices[d.id].watts, 0)
  const energy = device
    ? device.energyWh
    : devices.reduce((sum, d) => sum + state.devices[d.id].energyWh, 0)
  const limit = spec?.ratedWatts ?? station?.limit ?? CIRCUIT_LIMIT
  const active =
    state.masterOn &&
    (station ? state.strips[station.id] : true) &&
    (device ? device.on : true)
  useEffect(() => {
    panel.current?.scrollTo({ top: 0 })
  }, [state.selected])
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    close.current?.focus({ preventScroll: true })
    return () => {
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [open])
  return (
    <aside
      ref={panel}
      className={`detail-panel ${open ? 'detail-panel--open' : ''}`}
      inert={!open}
      aria-hidden={!open}
      aria-label="床位与设备详情"
    >
      <div className="detail-panel__top">
        <span className="eyebrow">
          {station
            ? `BED ${station.number} / ${spec ? 'DEVICE' : 'POWER STRIP'}`
            : 'ROOM 302 / ENERGY'}
        </span>
        <Button
          ref={close}
          variant="ghost"
          size="icon"
          className="icon-button"
          onClick={state.closePanel}
          aria-label="关闭详情面板"
        >
          <Icon name="close" />
        </Button>
      </div>
      <div className="detail-heading">
        <div className="device-glyph" style={{ color: station?.color }}>
          {station && !spec ? (
            <b>{station.number}</b>
          ) : (
            <Icon name="bolt" size={28} />
          )}
        </div>
        <div>
          <h2>
            {spec?.name ??
              (station ? `${station.name} · 独立插排` : '全寝能源概览')}
          </h2>
          <p>
            {spec?.english ?? station?.theme ?? 'FOUR PLACES. ONE SHARED ROOM.'}
          </p>
        </div>
      </div>
      <div className="detail-status">
        <i className={active ? 'status-dot' : 'status-dot status-dot--off'} />
        {!state.masterOn
          ? '全寝总电源已关'
          : station && !state.strips[station.id]
            ? '本床位插排已关闭'
            : device && !device.on
              ? '设备待机'
              : '正在供电'}
        <span className="simulation-tag">模拟数据</span>
      </div>
      {spec && (
        <p className="socket-assignment">
          {station?.name} / 插孔 {spec.socket + 1} / 仅此床位回路
        </p>
      )}
      {spec && (
        <Button className="focus-button" onClick={state.focus}>
          <Icon name="focus" size={17} />
          近距离检查模型<span>DETAIL VIEW</span>
        </Button>
      )}
      <section className="detail-power">
        <span className="field-label">
          {spec ? '当前设备功率' : station ? '本床位总功率' : '全寝总功率'}
        </span>
        <div className="detail-power__value">
          {watts.toFixed(1)}
          <span>W</span>
        </div>
        <div className="thin-meter">
          <span
            style={{
              width: `${Math.min(100, (watts / limit) * 100)}%`,
              background: station?.color,
            }}
          />
        </div>
        <div className="meter-caption">
          <span>
            {spec ? '示例额定功率' : '演示负载阈值'} {limit} W
          </span>
          <b>{((watts / limit) * 100).toFixed(1)}%</b>
        </div>
      </section>
      <div className="power-switch-row">
        <div>
          <strong>
            {spec ? '设备电源' : station ? '此床位插排总开关' : '全寝总电源'}
          </strong>
          <p>
            {station ? '不改变其他三个床位的电源状态' : '控制所有床位上游电源'}
          </p>
        </div>
        <button
          role="switch"
          aria-label={
            spec
              ? `${spec.name}电源`
              : station
                ? `${station.name}插排电源`
                : '全寝总电源'
          }
          aria-checked={active}
          className={`toggle-switch ${active ? 'toggle-switch--on' : ''}`}
          disabled={
            (!!spec && (!state.masterOn || !state.strips[spec.stationId])) ||
            (!!station && !state.masterOn)
          }
          onClick={() =>
            spec
              ? state.toggle(spec.id)
              : station
                ? state.setStrip(station.id, !state.strips[station.id])
                : state.setMaster(!state.masterOn)
          }
        >
          <span />
        </button>
      </div>
      {spec && device && (
        <div className="level-control">
          <label htmlFor="device-level">
            {spec.kind === 'lamp'
              ? '灯光亮度'
              : spec.kind === 'fan'
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
            onChange={(e) =>
              state.setLevel(spec.id, Number(e.target.value) / 100)
            }
            disabled={!active}
          />
        </div>
      )}
      <section className="detail-section">
        <div className="section-heading">
          <h3>功率轨迹</h3>
          <span>LIVE · 1 Hz</span>
        </div>
        <PowerChart
          history={state.history}
          device={spec?.id}
          station={station?.id}
        />
      </section>
      <div className="detail-metrics">
        <div>
          <span>本次模拟耗电</span>
          <strong>
            {(energy / 1000).toFixed(4)}
            <small> kWh</small>
          </strong>
        </div>
        <div>
          <span>简化估算电流 · {VOLTAGE}V</span>
          <strong>
            {(watts / VOLTAGE).toFixed(2)}
            <small> A</small>
          </strong>
        </div>
      </div>
      {!spec && station && (
        <section className="detail-section">
          <div className="section-heading">
            <h3>四孔插排 · 连接明细</h3>
            <span>1 DEVICE / SOCKET</span>
          </div>
          <div className="device-breakdown">
            {devices.map((d) => (
              <button key={d.id} onClick={() => state.select(d.id)}>
                <span className="socket-number">{d.socket + 1}</span>
                <span>{d.name}</span>
                <span className="device-breakdown__track">
                  <i
                    style={{
                      width: `${watts ? (state.devices[d.id].watts / watts) * 100 : 0}%`,
                      background: station.color,
                    }}
                  />
                </span>
                <b>{state.devices[d.id].watts.toFixed(1)} W</b>
                <Icon name="arrow" size={13} />
              </button>
            ))}
          </div>
        </section>
      )}
      {!station && (
        <section className="detail-section">
          <div className="section-heading">
            <h3>四个独立床位</h3>
            <span>4 SEPARATE STRIPS</span>
          </div>
          <div className="station-breakdown">
            {STATIONS.map((s) => {
              const sum = stationDevices(s.id).reduce(
                (n, d) => n + state.devices[d.id].watts,
                0,
              )
              return (
                <button key={s.id} onClick={() => state.selectStation(s.id)}>
                  <i style={{ background: s.color }}>{s.number}</i>
                  <span>
                    {s.name}
                    <small>{s.theme}</small>
                  </span>
                  <b>{sum.toFixed(1)} W</b>
                  <Icon name="arrow" size={14} />
                </button>
              )
            })}
          </div>
        </section>
      )}
      {spec && (
        <>
          <p className="device-description">{spec.description}</p>
          <Button
            variant="ghost"
            className="back-overview"
            onClick={() => state.select(spec.stationId)}
          >
            返回本床位插排 <Icon name="arrow" size={14} />
          </Button>
        </>
      )}
      {station && !spec && (
        <div className="inspection-buttons">
          <Button
            className="focus-button"
            onClick={() => state.selectStation(station.id)}
          >
            <Icon name="focus" size={17} />
            查看完整床位<span>STATION</span>
          </Button>
          <Button
            className="focus-button"
            onClick={() => {
              state.inspect('strip')
              state.closePanel()
            }}
          >
            <Icon name="bolt" size={17} />
            近看插头与走线<span>WIRING</span>
          </Button>
          <Button
            className="focus-button"
            onClick={() => {
              state.inspect('bed')
              state.closePanel()
            }}
          >
            <Icon name="layers" size={17} />
            近看上铺与护栏<span>LOFT BED</span>
          </Button>
        </div>
      )}
      {watts > limit && (
        <div className="overload-note">
          当前负载超过演示阈值，仅作提示，不模拟真实断路保护。
        </div>
      )}
      {station && (
        <Button
          variant="ghost"
          className="back-overview"
          onClick={() => state.select('room')}
        >
          查看全寝总用电 <Icon name="arrow" size={14} />
        </Button>
      )}
      <p className="panel-disclaimer">
        全部功耗均为模拟值。四个插排各自控制四件设备；仅用于空间交互演示，不作为真实用电安全依据。
      </p>
    </aside>
  )
}
