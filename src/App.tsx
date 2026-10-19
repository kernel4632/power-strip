import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import {
  CAMERA_VIEWS,
  DEVICE_CATALOG,
  SCENE_MODES,
  STATIONS,
  STATION_MAP,
  stationDevices,
} from './data/catalog'
import { usePowerStore } from './store/usePowerStore'
import { Icon } from './ui/Icon'
import { PowerChart } from './ui/PowerChart'
import { PowerPanel } from './ui/PowerPanel'
import { Hotspots } from './ui/Hotspots'
import type { CameraView } from './types'
const Scene = lazy(() =>
  import('./scene/Scene').then((m) => ({ default: m.Scene })),
)
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Scene failed', error, info.componentStack)
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback">
        <h2>场景暂时无法加载</h2>
        <p>请开启硬件加速后刷新，能源面板仍可使用。</p>
        <button onClick={() => location.reload()}>重新加载</button>
      </div>
    ) : (
      this.props.children
    )
  }
}
export default function App() {
  const state = usePowerStore(),
    [help, setHelp] = useState(false)
  const total = DEVICE_CATALOG.reduce(
    (n, d) => n + state.devices[d.id].watts,
    0,
  )
  const energy = DEVICE_CATALOG.reduce(
    (n, d) => n + state.devices[d.id].energyWh,
    0,
  )
  const activeCount = DEVICE_CATALOG.filter(
    (d) =>
      state.masterOn && state.strips[d.stationId] && state.devices[d.id].on,
  ).length
  const active = state.activeStation ? STATION_MAP[state.activeStation] : null
  useEffect(() => {
    let last = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      usePowerStore.getState().tick((now - last) / 1000, Date.now())
      last = now
    }, 1000)
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        usePowerStore.getState().closePanel()
        setHelp(false)
      }
      if (
        (e.target as HTMLElement).matches('input,select,textarea') ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      )
        return
      const s = usePowerStore.getState()
      if (/^[1-4]$/.test(e.key)) s.selectStation(STATIONS[Number(e.key) - 1].id)
      if (e.key === '0') s.setView('overview')
      if (e.key.toLowerCase() === 'f') s.toggleFlow()
      if (e.key.toLowerCase() === 'l') s.toggleNight()
      if (e.key.toLowerCase() === 'x') s.toggleCutaway()
    }
    window.addEventListener('keydown', key)
    return () => {
      clearInterval(timer)
      window.removeEventListener('keydown', key)
    }
  }, [])
  return (
    <main
      className={`experience ${state.night ? 'experience--night' : ''} ${state.selected ? 'experience--inspecting' : ''} ${active ? 'experience--station' : ''}`}
    >
      <div className="scene-stage">
        <SceneBoundary>
          <Suspense
            fallback={
              <div className="scene-loading">
                <span />
                <p>正在准备四人寝</p>
                <small>FOUR PLACES. ONE SHARED ROOM.</small>
              </div>
            }
          >
            <Scene />
          </Suspense>
        </SceneBoundary>
      </div>
      <div className="vignette" />
      <Hotspots />
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault()
            state.setView('overview')
          }}
          aria-label="返回四人寝全景"
        >
          <span className="brand-mark">
            <Icon name="home" size={23} />
          </span>
          <span>
            DORM<span className="brand-light">LAB</span>
            <small>四个位置，一起生活。</small>
          </span>
        </a>
        <div className="room-address">
          <span>BUILDING 06</span>
          <i />
          <b>ROOM 302</b>
          <span className="room-address__dot" />
          四人寝 · 上床下桌
        </div>
        <div className="topbar-actions">
          <button
            className="day-toggle"
            onClick={state.toggleNight}
            aria-label={state.night ? '切换日间场景' : '切换夜间场景'}
          >
            <Icon name={state.night ? 'moon' : 'sun'} size={16} />
            <span>{state.night ? '夜间宿舍' : '午后宿舍'}</span>
          </button>
          <button
            className="energy-button"
            aria-label="全寝能源面板"
            onClick={() =>
              state.select(state.selected === 'room' ? null : 'room')
            }
          >
            <Icon name="chart" size={17} />
            <span>全寝能源</span>
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </header>
      {!active && (
        <section className="intro-copy">
          <div className="eyebrow">
            <span />
            FOUR PLACES. ONE SHARED ROOM.
          </div>
          <h1>
            一间宿舍，
            <br />
            <em>四种生活。</em>
          </h1>
          <p>
            上床休息，下桌学习。
            <br />
            选择一个床位，探索属于它的用电日常。
          </p>
          <div className="intro-meta">
            <span>
              04<span>独立床位 · 独立插排</span>
            </span>
            <i />
            <span>
              16<span>不同组合的电器</span>
            </span>
          </div>
        </section>
      )}
      {active && (
        <div className="station-context">
          <button onClick={() => state.setView('overview')}>
            <Icon name="home" size={15} />
            全寝
          </button>
          <span>/</span>
          <b style={{ color: active.color }}>
            {active.number} {active.name}
          </b>
          <small>{active.theme}</small>
          {state.cutaway && <em>上铺透明检查视图</em>}
        </div>
      )}
      <nav className="scene-tools" aria-label="场景工具">
        <button
          className={`tool ${state.energyFlow ? 'active' : ''}`}
          onClick={state.toggleFlow}
          aria-label="切换能流"
          aria-pressed={state.energyFlow}
        >
          <Icon name="bolt" />
          <span>
            四路能流<kbd>F</kbd>
          </span>
        </button>
        <button
          className={`tool ${state.labels ? 'active' : ''}`}
          onClick={state.toggleLabels}
          aria-label="切换模型标记"
          aria-pressed={state.labels}
        >
          <Icon name="eye" />
          <span>床位与设备标记</span>
        </button>
        <button
          className={`tool ${state.cutaway ? 'active' : ''}`}
          onClick={state.toggleCutaway}
          aria-label="切换上铺透明检查"
          aria-pressed={state.cutaway}
        >
          <Icon name="layers" />
          <span>
            选中上铺透明<kbd>X</kbd>
          </span>
        </button>
        <div className="tool-divider" />
        <button
          className="tool"
          onClick={() => state.setView('overview')}
          aria-label="重置四人寝全景"
        >
          <Icon name="focus" />
          <span>
            全寝视角<kbd>0</kbd>
          </span>
        </button>
        <button
          className="tool"
          onClick={() => setHelp(!help)}
          aria-label="交互指南"
        >
          <Icon name="info" />
        </button>
      </nav>
      <section className="energy-summary" aria-label="全寝功率概览">
        <div className="summary-heading">
          <span>
            <i className="status-dot" />
            四个床位 · 总负载
          </span>
          <button
            onClick={() => state.select('room')}
            aria-label="打开全寝用电详情"
          >
            <Icon name="arrow" size={18} />
          </button>
        </div>
        <div className="summary-reading">
          <span>
            {total.toFixed(0)}
            <small>W</small>
          </span>
          <div>
            <b>
              {activeCount}
              <small> / 16</small>
            </b>
            <span>设备运行中</span>
          </div>
        </div>
        <PowerChart history={state.history} compact />
        <div className="summary-footer">
          <span>
            {(energy / 1000).toFixed(4)} kWh <small>本次</small>
          </span>
          <span className="simulation-tag">SIMULATED</span>
        </div>
      </section>
      <div
        className="station-selector"
        role="group"
        aria-label="选择四个独立床位"
      >
        {STATIONS.map((s) => {
          const watts = stationDevices(s.id).reduce(
            (n, d) => n + state.devices[d.id].watts,
            0,
          )
          return (
            <button
              key={s.id}
              className={state.activeStation === s.id ? 'selected' : ''}
              onClick={() => state.selectStation(s.id)}
              aria-label={`进入${s.name}`}
            >
              <i style={{ background: s.color }}>{s.number}</i>
              <span>
                {s.theme}
                <small>
                  {watts.toFixed(0)} W ·{' '}
                  {state.strips[s.id] && state.masterOn
                    ? '插排供电中'
                    : '插排断电'}
                </small>
              </span>
              <Icon name="arrow" size={13} />
            </button>
          )
        })}
      </div>
      <div className="view-selector" role="group" aria-label="公共镜头">
        {(Object.keys(CAMERA_VIEWS) as CameraView[]).map((view) => (
          <button
            key={view}
            className={!active && state.cameraView === view ? 'selected' : ''}
            onClick={() => state.setView(view)}
          >
            {CAMERA_VIEWS[view].label}
          </button>
        ))}
      </div>
      <footer className="bottom-bar">
        <div className="interaction-hint">
          <Icon name="mouse" size={17} />
          <span>拖动旋转 · 滚轮缩放 · 点击床位进入</span>
        </div>
        <div className="scene-modes" role="group" aria-label="生活模式">
          {SCENE_MODES.map((m, i) => (
            <button
              key={m.id}
              className={`mode ${state.mode === m.id ? 'selected' : ''}`}
              onClick={() => state.setMode(m.id)}
            >
              <Icon
                name={i === 0 ? 'sun' : i === 1 ? 'moon' : 'leaf'}
                size={15}
              />
              <span>{m.label}</span>
            </button>
          ))}
        </div>
        <span className="room-scale">4 LOFT BEDS / 4 DESKS / 4 STRIPS</span>
      </footer>
      {help && (
        <div className="help-popover">
          <div className="section-heading">
            <h3>四人寝交互指南</h3>
            <button
              className="icon-button"
              onClick={() => setHelp(false)}
              aria-label="关闭指南"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          <p>
            点击床位编号、床架或底部床位卡，进入该床位。选中床位的上铺可透明化，便于检查桌面，不移动或隐藏其他床位。
          </p>
          <p>
            每个插排对应四件设备，一孔一设备。可单独关闭某个床位的插排，不影响其他人。
          </p>
          <div className="shortcut-row">
            <kbd>1–4</kbd>床位<kbd>0</kbd>全景<kbd>X</kbd>透明<kbd>F</kbd>能流
            <kbd>Esc</kbd>关面板
          </div>
          <p className="panel-disclaimer">功率、耗电与曲线全部为模拟。</p>
        </div>
      )}
      <PowerPanel />
    </main>
  )
}
