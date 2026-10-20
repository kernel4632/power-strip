import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { CSSProperties, ErrorInfo, ReactElement, ReactNode } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Popover from '@radix-ui/react-popover'
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
import { Button } from './ui/Button'
import { PowerChart } from './ui/PowerChart'
import { PowerPanel } from './ui/PowerPanel'
import { Hotspots } from './ui/Hotspots'
import type { CameraView, SceneMode, StationId } from './types'

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
function Tip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="ui-tooltip"
          sideOffset={10}
          collisionPadding={12}
        >
          {label}
          <Tooltip.Arrow />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
export default function App() {
  const state = usePowerStore()
  const [menu, setMenu] = useState<'camera' | 'help' | null>(null)
  const [expandedEnergy, setExpandedEnergy] = useState(false)
  const total = DEVICE_CATALOG.reduce(
    (sum, d) => sum + state.devices[d.id].watts,
    0,
  )
  const energy = DEVICE_CATALOG.reduce(
    (sum, d) => sum + state.devices[d.id].energyWh,
    0,
  )
  const activeCount = DEVICE_CATALOG.filter(
    (d) =>
      state.masterOn && state.strips[d.stationId] && state.devices[d.id].on,
  ).length
  const active = state.activeStation ? STATION_MAP[state.activeStation] : null
  const panelOpen = state.selected !== null
  useEffect(() => {
    let last = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      usePowerStore.getState().tick((now - last) / 1000, Date.now())
      last = now
    }, 1000)
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.key === 'Escape') {
        usePowerStore.getState().closePanel()
        setMenu(null)
      }
      if (
        (e.target as HTMLElement).closest(
          'input,select,textarea,[contenteditable="true"],[data-radix-popper-content-wrapper]',
        ) ||
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
      if (e.key.toLowerCase() === 'x' && s.activeStation) s.toggleCutaway()
    }
    window.addEventListener('keydown', key)
    return () => {
      clearInterval(timer)
      window.removeEventListener('keydown', key)
    }
  }, [])
  return (
    <Tooltip.Provider delayDuration={250}>
      <main
        className={`experience ${state.night ? 'experience--night' : ''} ${panelOpen ? 'experience--inspecting' : ''}`}
      >
        <div className="scene-stage">
          <SceneBoundary>
            <Suspense
              fallback={
                <div className="scene-loading">
                  <span />
                  <p>正在准备你的宿舍</p>
                  <small>ROOM 302 · DORM LAB</small>
                </div>
              }
            >
              <Scene />
            </Suspense>
          </SceneBoundary>
        </div>
        <div className="scene-shade" />
        <Hotspots />
        <header className="workspace-header">
          <a
            className="workspace-brand"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              state.setView('overview')
            }}
            aria-label="返回四人寝全景"
          >
            <span className="brand-symbol">
              <Icon name="home" size={22} />
            </span>
            <span>
              DORM<span className="brand-light">LAB</span>
              <small>302 / 四人寝用电实验室</small>
            </span>
          </a>
          <ToggleGroup.Root
            className="mode-segment glass"
            type="single"
            value={state.mode}
            onValueChange={(value) => {
              if (value) state.setMode(value as SceneMode)
            }}
            aria-label="生活模式"
          >
            {SCENE_MODES.map((mode, i) => (
              <ToggleGroup.Item
                key={mode.id}
                value={mode.id}
                aria-label={mode.label}
              >
                <Icon
                  name={i === 0 ? 'sun' : i === 1 ? 'moon' : 'leaf'}
                  size={16}
                />
                <span>{mode.label}</span>
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
          <div className="header-actions">
            <Tip label={state.night ? '切换至日间 · L' : '切换至夜间 · L'}>
              <button
                className="round-button glass"
                onClick={state.toggleNight}
                aria-label={state.night ? '切换日间场景' : '切换夜间场景'}
              >
                <Icon name={state.night ? 'moon' : 'sun'} size={18} />
              </button>
            </Tip>
            <Button
              variant="primary"
              className={`energy-entry ${state.selected === 'room' ? 'is-active' : ''}`}
              onClick={() =>
                state.select(state.selected === 'room' ? null : 'room')
              }
              aria-label="全寝能源面板"
              aria-expanded={state.selected === 'room'}
            >
              <Icon name="chart" size={17} />
              <span>能源概览</span>
              <Icon name="arrow" size={16} />
            </Button>
          </div>
        </header>
        <div className="workspace-context">
          <span className="context-eyebrow">
            {active
              ? `PERSONAL SPACE / ${active.number}`
              : 'EXPLORE YOUR EVERYDAY'}
          </span>
          <h1>{active ? active.theme : '四个位置，一起生活。'}</h1>
          <p>
            {active
              ? `${active.name} · 独立四孔插排`
              : '选择床位，看看每一瓦流向哪里。'}
          </p>
          {active && state.cutaway && (
            <span className="cutaway-badge">
              <Icon name="layers" size={12} />
              上铺透明检查
            </span>
          )}
        </div>
        <section
          className={`live-energy glass ${expandedEnergy ? 'live-energy--expanded' : ''}`}
          aria-label="全寝功率概览"
        >
          <button
            className="live-energy__toggle"
            onClick={() => setExpandedEnergy(!expandedEnergy)}
            aria-expanded={expandedEnergy}
            aria-controls="live-energy-detail"
            aria-label={expandedEnergy ? '收起功率趋势' : '展开功率趋势'}
          >
            <span className="live-heading">
              <i className="status-dot" />
              全寝实时功率<small>模拟</small>
            </span>
            <span className="live-reading">
              <strong>{total.toFixed(0)}</strong>
              <span>W</span>
              <Icon name="chart" size={18} />
            </span>
            <span className="live-caption">
              {activeCount} / {DEVICE_CATALOG.length} 件设备运行
              <span>
                {expandedEnergy ? '收起' : '查看趋势'}{' '}
                {expandedEnergy ? '−' : '+'}
              </span>
            </span>
          </button>
          {expandedEnergy && (
            <div id="live-energy-detail" className="live-energy__detail">
              <PowerChart history={state.history} compact />
              <div>
                <span>{(energy / 1000).toFixed(4)} kWh</span>
                <button
                  onClick={() => state.select('room')}
                  aria-label="打开全寝用电详情"
                >
                  详情 <Icon name="arrow" size={13} />
                </button>
              </div>
            </div>
          )}
        </section>
        <nav className="workspace-tools glass" aria-label="场景工具">
          <Popover.Root
            open={menu === 'camera'}
            onOpenChange={(open) => setMenu(open ? 'camera' : null)}
          >
            <Popover.Trigger asChild>
              <button className="rail-button" aria-label="镜头与模型检查">
                <Icon name="focus" />
                <span>镜头</span>
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="ui-popover"
                aria-label="观察角度"
                data-theme={state.night ? 'night' : 'day'}
                side="left"
                align="start"
                sideOffset={12}
                collisionPadding={12}
              >
                <div className="popover-heading">
                  <h2>观察角度</h2>
                  <Popover.Close
                    className="icon-button"
                    aria-label="关闭镜头菜单"
                  >
                    <Icon name="close" size={16} />
                  </Popover.Close>
                </div>
                <div className="camera-options">
                  {(Object.keys(CAMERA_VIEWS) as CameraView[]).map((view) => (
                    <button
                      key={view}
                      className={
                        !active && state.cameraView === view ? 'selected' : ''
                      }
                      onClick={() => {
                        state.setView(view)
                        setMenu(null)
                      }}
                    >
                      <Icon
                        name={
                          view === 'overview'
                            ? 'home'
                            : view === 'top'
                              ? 'grid'
                              : 'focus'
                        }
                        size={17}
                      />
                      {CAMERA_VIEWS[view].label}
                      {!active && state.cameraView === view && (
                        <Icon name="check" size={14} />
                      )}
                    </button>
                  ))}
                </div>
                {active && (
                  <>
                    <div className="popover-caption">
                      {active.name} · 模型细节
                    </div>
                    <div className="camera-options">
                      <button
                        onClick={() => {
                          state.selectStation(active.id)
                          setMenu(null)
                        }}
                      >
                        <Icon name="home" size={17} />
                        完整床位
                      </button>
                      <button
                        onClick={() => {
                          state.inspect('strip')
                          state.closePanel()
                          setMenu(null)
                        }}
                      >
                        <Icon name="bolt" size={17} />
                        插头与走线
                      </button>
                      <button
                        onClick={() => {
                          state.inspect('bed')
                          state.closePanel()
                          setMenu(null)
                        }}
                      >
                        <Icon name="layers" size={17} />
                        上铺与护栏
                      </button>
                    </div>
                  </>
                )}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <div className="rail-divider" />
          <Tip label="显示四路能量流动 · F">
            <button
              className="rail-button"
              onClick={state.toggleFlow}
              aria-pressed={state.energyFlow}
              aria-label="切换能流"
            >
              <Icon name="bolt" />
              <span>能流</span>
            </button>
          </Tip>
          <Tip label="显示床位与设备标记">
            <button
              className="rail-button"
              onClick={state.toggleLabels}
              aria-pressed={state.labels}
              aria-label="切换模型标记"
            >
              <Icon name="eye" />
              <span>标记</span>
            </button>
          </Tip>
          <Tip label="选中床位的上铺透明检查 · X">
            <button
              className="rail-button"
              disabled={!active}
              onClick={state.toggleCutaway}
              aria-pressed={!!active && state.cutaway}
              aria-label="切换上铺透明检查"
            >
              <Icon name="layers" />
              <span>透视</span>
            </button>
          </Tip>
          <div className="rail-divider" />
          <Popover.Root
            open={menu === 'help'}
            onOpenChange={(open) => setMenu(open ? 'help' : null)}
          >
            <Popover.Trigger asChild>
              <button
                className="rail-button help-trigger"
                aria-label="交互指南"
              >
                <Icon name="info" size={18} />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                className="ui-popover help-content"
                aria-label="交互指南"
                data-theme={state.night ? 'night' : 'day'}
                side="left"
                sideOffset={12}
                collisionPadding={12}
              >
                <div className="popover-heading">
                  <h2>从一个床位开始</h2>
                  <Popover.Close className="icon-button" aria-label="关闭指南">
                    <Icon name="close" size={16} />
                  </Popover.Close>
                </div>
                <p>
                  点击底部床位，进入你的桌面。点电器查看功率、开关电源和调节负载。
                </p>
                <p>
                  每个床位独立供电。镜头菜单里可以近看插头、走线和上铺结构。
                </p>
                <dl className="shortcut-list">
                  <div>
                    <dt>拖动 / 滚轮</dt>
                    <dd>旋转 / 缩放</dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>1</kbd> – <kbd>4</kbd>
                    </dt>
                    <dd>切换床位</dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>0</kbd> / <kbd>Esc</kbd>
                    </dt>
                    <dd>回全景 / 关详情</dd>
                  </div>
                  <div>
                    <dt>
                      <kbd>F</kbd> / <kbd>X</kbd> / <kbd>L</kbd>
                    </dt>
                    <dd>能流 / 透视 / 昼夜</dd>
                  </div>
                </dl>
                <small>所有功率与耗电均为模拟数据。</small>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </nav>
        <div className="workspace-dock">
          <ToggleGroup.Root
            className="station-dock glass"
            type="single"
            value={active?.id ?? 'room'}
            onValueChange={(value) => {
              if (value === 'room') state.setView('overview')
              else if (value) state.selectStation(value as StationId)
            }}
            aria-label="选择四个独立床位"
          >
            <ToggleGroup.Item
              className="dock-home"
              value="room"
              aria-label="返回四人寝全景"
            >
              <Icon name="home" size={21} />
              <span>全寝</span>
            </ToggleGroup.Item>
            {STATIONS.map((station) => {
              const watts = stationDevices(station.id).reduce(
                (sum, d) => sum + state.devices[d.id].watts,
                0,
              )
              const powered = state.masterOn && state.strips[station.id]
              return (
                <ToggleGroup.Item
                  key={station.id}
                  value={station.id}
                  aria-label={`进入${station.name}`}
                  style={{ '--station-color': station.color } as CSSProperties}
                >
                  <span className="dock-number">{station.number}</span>
                  <span className="dock-label">
                    {station.theme}
                    <small>
                      <i
                        className={powered ? 'dock-status' : 'dock-status off'}
                      />
                      {powered ? `${watts.toFixed(0)} W` : '已断电'}
                    </small>
                  </span>
                </ToggleGroup.Item>
              )
            })}
          </ToggleGroup.Root>
          <p className="dock-hint">
            <Icon name="mouse" size={13} />
            <span>拖动旋转 · 滚轮缩放 · 点击设备探索</span>
          </p>
        </div>
        <PowerPanel />
      </main>
    </Tooltip.Provider>
  )
}
