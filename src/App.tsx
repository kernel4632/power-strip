import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import {
  CAMERA_VIEWS,
  CIRCUIT_LIMIT,
  DEVICE_CATALOG,
  SCENE_MODES,
} from './data/catalog'
import { usePowerStore } from './store/usePowerStore'
import { Icon } from './ui/Icon'
import { PowerChart } from './ui/PowerChart'
import { PowerPanel } from './ui/PowerPanel'
import { Hotspots } from './ui/Hotspots'
import type { CameraView } from './types'

const Scene = lazy(() =>
  import('./scene/Scene').then((module) => ({ default: module.Scene })),
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
    console.error('Scene rendering failed', error, info.componentStack)
  }
  render() {
    return this.state.failed ? (
      <div className="scene-fallback">
        <h2>3D 场景暂时无法启动</h2>
        <p>请开启浏览器硬件加速后刷新。你仍可使用右上角的能源面板操作设备。</p>
        <button onClick={() => window.location.reload()}>重新加载</button>
      </div>
    ) : (
      this.props.children
    )
  }
}

export default function App() {
  const state = usePowerStore()
  const [help, setHelp] = useState(false)
  const [devicesOpen, setDevicesOpen] = useState(false)
  const total = Object.values(state.devices).reduce(
    (sum, item) => sum + item.watts,
    0,
  )
  const activeCount = state.masterOn
    ? Object.values(state.devices).filter((item) => item.on).length
    : 0
  const energyWh = Object.values(state.devices).reduce(
    (sum, item) => sum + item.energyWh,
    0,
  )
  const overloaded = total > CIRCUIT_LIMIT
  useEffect(() => {
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      usePowerStore.getState().tick((now - last) / 1000, Date.now())
      last = now
    }, 1000)
    const onKey = (event: KeyboardEvent) => {
      if (
        (event.target as HTMLElement).matches('input,select,textarea') ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      )
        return
      const current = usePowerStore.getState()
      if (event.key === 'Escape') {
        current.select(null)
        setHelp(false)
        setDevicesOpen(false)
      }
      if (event.key.toLowerCase() === 'f') current.toggleFlow()
      if (event.key.toLowerCase() === 'l') current.toggleNight()
      const views: CameraView[] = ['overview', 'desk', 'living', 'top']
      if (/^[1-4]$/.test(event.key))
        current.setView(views[Number(event.key) - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [])
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        usePowerStore.getState().select(null)
        setHelp(false)
        setDevicesOpen(false)
      }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])
  return (
    <main
      className={`experience ${state.night ? 'experience--night' : ''} ${state.selected ? 'experience--inspecting' : ''}`}
    >
      <div className="scene-stage">
        <SceneBoundary>
          <Suspense
            fallback={
              <div className="scene-loading">
                <span />
                <p>正在布置你的宿舍</p>
                <small>BUILDING YOUR LITTLE WORLD</small>
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
          onClick={(event) => {
            event.preventDefault()
            state.setView('overview')
          }}
          aria-label="返回宿舍全景"
        >
          <span className="brand-mark">
            <Icon name="home" size={23} />
          </span>
          <span>
            DORM<span className="brand-light">LAB</span>
            <small>生活，每一瓦都值得看见。</small>
          </span>
        </a>
        <div className="room-address">
          <span>BUILDING 06</span>
          <i />
          <b>ROOM 302</b>
          <span className="room-address__dot" />
          在线体验
        </div>
        <div className="topbar-actions">
          <button
            className="day-toggle"
            onClick={state.toggleNight}
            aria-label={state.night ? '切换日间场景' : '切换夜间场景'}
          >
            <Icon name={state.night ? 'moon' : 'sun'} size={16} />
            <span>{state.night ? '月色时分' : '午后日光'}</span>
          </button>
          <button
            className="energy-button"
            aria-label="能源面板"
            onClick={() =>
              state.select(state.selected === 'strip' ? null : 'strip')
            }
          >
            <Icon name="chart" size={17} />
            <span>能源面板</span>
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </header>
      <section className="intro-copy">
        <div className="eyebrow">
          <span />A LITTLE ROOM. A BIG WORLD.
        </div>
        <h1>
          把生活，
          <br />
          <em>看得更近一点。</em>
        </h1>
        <p>
          探索你的大学宿舍。
          <br />
          触碰每一件电器，看见能量如何流动。
        </p>
        <div className="intro-meta">
          <span>
            08<span>可交互设备</span>
          </span>
          <i />
          <span>
            01<span>属于你的空间</span>
          </span>
        </div>
      </section>
      <div className="scene-caption">
        <span className="caption-line" />
        <span>302 / THE EVERYDAY STUDIO</span>
        <small>
          {state.night
            ? 'EVENING · WIND DOWN'
            : 'AFTERNOON · MAKE YOURSELF AT HOME'}
        </small>
      </div>
      <nav className="scene-tools" aria-label="场景工具">
        <button
          className={state.energyFlow ? 'tool active' : 'tool'}
          onClick={state.toggleFlow}
          aria-pressed={state.energyFlow}
          aria-label="切换能量流动可视化"
        >
          <Icon name="bolt" />
          <span>
            能量流动<kbd>F</kbd>
          </span>
        </button>
        <button
          className={state.labels ? 'tool active' : 'tool'}
          onClick={state.toggleLabels}
          aria-pressed={state.labels}
          aria-label="显示或隐藏设备标记"
        >
          <Icon name="eye" />
          <span>设备标记</span>
        </button>
        <button
          className={state.autoRotate ? 'tool active' : 'tool'}
          onClick={state.toggleRotate}
          aria-pressed={state.autoRotate}
          aria-label="切换自动环绕"
        >
          <Icon name="rotate" />
          <span>慢速环绕</span>
        </button>
        <div className="tool-divider" />
        <button
          className="tool"
          onClick={() => state.setView('overview')}
          aria-label="重置全景视角"
        >
          <Icon name="focus" />
          <span>
            回到全景<kbd>1</kbd>
          </span>
        </button>
        <button
          className={devicesOpen ? 'tool active' : 'tool'}
          onClick={() => setDevicesOpen(!devicesOpen)}
          aria-expanded={devicesOpen}
          aria-label="展开设备列表"
        >
          <Icon name="grid" />
          <span>全部设备</span>
        </button>
      </nav>
      {devicesOpen && (
        <div className="device-menu">
          <div className="section-heading">
            <h3>探索设备</h3>
            <button
              className="icon-button"
              onClick={() => setDevicesOpen(false)}
              aria-label="关闭设备列表"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          {DEVICE_CATALOG.map((device) => (
            <button
              key={device.id}
              onClick={() => {
                state.select(device.id)
                setDevicesOpen(false)
              }}
            >
              <span style={{ background: device.color }} />
              {device.name}
              <b>{state.devices[device.id].watts.toFixed(0)} W</b>
            </button>
          ))}
        </div>
      )}
      <section
        className={`energy-summary ${overloaded ? 'energy-summary--warning' : ''}`}
        aria-label="实时功率概览"
      >
        <div className="summary-heading">
          <span>
            <i className="status-dot" />
            {overloaded ? '负载超出演示阈值' : '正在发生的能量'}
          </span>
          <button
            onClick={() => state.select('strip')}
            aria-label="打开能源详情"
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
              <small> / 8</small>
            </b>
            <span>设备运行中</span>
          </div>
        </div>
        <PowerChart history={state.history} compact />
        <div className="summary-footer">
          <span>
            <Icon name="leaf" size={13} />
            {(energyWh / 1000).toFixed(4)} kWh <small>本次</small>
          </span>
          <span className="simulation-tag">SIMULATED</span>
        </div>
      </section>
      <div className="view-selector" role="group" aria-label="镜头预设">
        {(Object.keys(CAMERA_VIEWS) as CameraView[]).map((view, i) => (
          <button
            key={view}
            className={state.cameraView === view ? 'selected' : ''}
            onClick={() => state.setView(view)}
          >
            <span>0{i + 1}</span>
            {CAMERA_VIEWS[view].label}
          </button>
        ))}
      </div>
      <footer className="bottom-bar">
        <div className="interaction-hint">
          <Icon name="mouse" size={17} />
          <span>
            拖动旋转<span>·</span>滚轮缩放<span>·</span>点击电器探索
          </span>
        </div>
        <div className="scene-modes" role="group" aria-label="生活场景模式">
          {SCENE_MODES.map((mode, i) => (
            <button
              key={mode.id}
              className={state.mode === mode.id ? 'mode selected' : 'mode'}
              onClick={() => state.setMode(mode.id)}
            >
              <Icon
                name={i === 0 ? 'sun' : i === 1 ? 'moon' : 'leaf'}
                size={16}
              />
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
        <button
          className="help-button"
          aria-label="交互指南"
          onClick={() => setHelp(!help)}
          aria-expanded={help}
        >
          <Icon name="info" size={17} />
          <span>交互指南</span>
        </button>
      </footer>
      {help && (
        <div className="help-popover">
          <div className="section-heading">
            <h3>欢迎来到 302</h3>
            <button
              className="icon-button"
              onClick={() => setHelp(false)}
              aria-label="关闭交互指南"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          <p>拖动空白处环绕场景，滚轮缩放；触屏可单指旋转、双指缩放。</p>
          <p>
            点击电器或标记打开详情，开关电源、调节负载，点击「聚焦此设备」靠近观察。
          </p>
          <div className="shortcut-row">
            <kbd>1–4</kbd>切换镜头<kbd>F</kbd>能流<kbd>L</kbd>昼夜<kbd>Esc</kbd>
            关闭
          </div>
          <p className="panel-disclaimer">
            所有电器功率、曲线与耗电均为模拟。本次数据仅保留在页面会话中。
          </p>
        </div>
      )}
      <PowerPanel />
    </main>
  )
}
