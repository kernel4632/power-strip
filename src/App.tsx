import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import {
  Home,
  Sun,
  Moon,
  Leaf,
  SunMoon,
  ChartNoAxesCombined,
  Focus,
  Zap,
  Eye,
  Layers,
  Info,
  Mouse,
  ChevronDown,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Toggle } from '@/components/ui/toggle'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { cn } from '@/lib/utils'
import { formatEnergy } from '@/lib/format'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  CAMERA_VIEWS,
  DEVICE_CATALOG,
  SCENE_MODES,
  STATIONS,
  STATION_MAP,
  stationDevices,
} from './data/catalog'
import { usePowerStore } from './store/usePowerStore'
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
      <div className="grid h-full place-items-center p-4">
        <Alert className="max-w-sm">
          <Info />
          <AlertTitle>场景暂时无法加载</AlertTitle>
          <AlertDescription>
            请开启硬件加速后刷新，能源面板仍可使用。
            <Button variant="outline" onClick={() => location.reload()}>
              重新加载
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    ) : (
      this.props.children
    )
  }
}

export default function App() {
  const isMobile = useIsMobile()
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
  const energyText = formatEnergy(energy)
  const activeCount = DEVICE_CATALOG.filter(
    (d) =>
      state.masterOn && state.strips[d.stationId] && state.devices[d.id].on,
  ).length
  const active = state.activeStation ? STATION_MAP[state.activeStation] : null
  const panelOpen = state.selected !== null
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.night)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      const token = state.night ? '--scene-night' : '--scene-day'
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(token)
        .trim()
      if (value) meta.setAttribute('content', value)
    }
  }, [state.night])
  useEffect(() => {
    let last = performance.now()
    const timer = setInterval(() => {
      const now = performance.now()
      usePowerStore.getState().tick((now - last) / 1000, Date.now())
      last = now
    }, 1000)
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      if (
        (e.target as HTMLElement).closest(
          'input,select,textarea,[contenteditable="true"],[role="slider"],[data-slot="popover-content"]',
        )
      )
        return
      const s = usePowerStore.getState()
      if (e.key === 'Escape') {
        s.closePanel()
        setMenu(null)
      }
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
    <TooltipProvider>
      <main className="relative isolate h-dvh overflow-hidden bg-background text-foreground">
        <div
          className={cn(
            'absolute inset-0',
            panelOpen && 'max-md:bottom-1/2 md:right-96',
          )}
        >
          <SceneBoundary>
            <Suspense
              fallback={
                <div className="grid h-full place-items-center p-4">
                  <Card className="w-72">
                    <CardHeader>
                      <CardTitle>正在准备你的宿舍</CardTitle>
                      <CardDescription>ROOM 302 · DORM LAB</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                </div>
              }
            >
              <Scene />
            </Suspense>
          </SceneBoundary>
        </div>
        <Hotspots />
        <header
          className={cn(
            'pointer-events-none absolute inset-x-4 top-4 z-30 flex flex-wrap items-center justify-between gap-2 md:gap-4',
            panelOpen && 'md:right-100',
          )}
        >
          <Button
            variant="outline"
            className="pointer-events-auto h-auto gap-3 py-2"
            aria-label="返回四人寝全景"
            onClick={() => state.setView('overview')}
          >
            <Home />
            <span className="text-left">
              DORM LAB
              <span className="hidden text-xs font-normal text-muted-foreground sm:block">
                302 · 四人寝用电实验室
              </span>
            </span>
          </Button>
          <ToggleGroup
            type="single"
            variant="outline"
            className="pointer-events-auto order-last mx-auto bg-background md:order-none md:mx-0"
            value={state.mode}
            onValueChange={(value) => {
              if (value) state.setMode(value as SceneMode)
            }}
            aria-label="生活模式"
          >
            {SCENE_MODES.map((mode, i) => {
              const ModeIcon = [Sun, Moon, Leaf][i]
              return (
                <ToggleGroupItem
                  key={mode.id}
                  value={mode.id}
                  aria-label={mode.label}
                >
                  <ModeIcon />
                  <span className="hidden lg:inline">{mode.label}</span>
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
          <div className="pointer-events-auto flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={state.toggleNight}
                  aria-label={state.night ? '切换日间场景' : '切换夜间场景'}
                >
                  <SunMoon />
                </Button>
              </TooltipTrigger>              <TooltipContent>日夜切换 · L</TooltipContent>
            </Tooltip>
            <Button
              variant="outline"
              onClick={() =>
                state.select(state.selected === 'room' ? null : 'room')
              }
              aria-label="全寝能源面板"
              aria-expanded={state.selected === 'room'}
            >
              <ChartNoAxesCombined />
              <span className="hidden sm:inline">能源概览</span>
            </Button>
          </div>
        </header>
        <Card
          className={cn(
            'pointer-events-none absolute left-4 top-24 z-20 hidden w-72 gap-3 md:flex',
            panelOpen && 'md:hidden',
          )}
        >
          <CardHeader className="gap-2">
            <CardDescription>
              {active ? `BED ${active.number}` : 'ROOM 302'}
            </CardDescription>
            <CardTitle>
              {active ? active.theme : '四个位置，一起生活。'}
            </CardTitle>
            <CardDescription>
              {active
                ? `${active.name} · 独立四孔插排`
                : '选择床位，看看每一瓦流向哪里。'}
            </CardDescription>
          </CardHeader>
          {active && state.cutaway && (
            <CardContent>
              <Badge variant="secondary">
                <Layers />
                上铺透明检查
              </Badge>
            </CardContent>
          )}
        </Card>
        <Collapsible
          open={expandedEnergy}
          onOpenChange={setExpandedEnergy}
          asChild
        >
          <Card
            className={cn(
              'absolute bottom-32 left-4 z-20 w-44 gap-3 py-4 md:bottom-4 md:w-56',
              panelOpen && 'hidden',
            )}
            aria-label="全寝功率概览"
          >
            <CardHeader className="gap-2 px-4">
              <div className="flex items-center justify-between gap-2">
                <CardDescription>全寝实时功率</CardDescription>
                <Badge variant="outline">模拟</Badge>
              </div>
              <CardTitle className="text-3xl tabular-nums">
                {total.toFixed(0)}{' '}
                <span className="text-sm font-normal text-muted-foreground">
                  W
                </span>
              </CardTitle>
              <CardDescription>
                {activeCount} / {DEVICE_CATALOG.length} 件设备运行
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4">
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  aria-label={expandedEnergy ? '收起功率趋势' : '展开功率趋势'}
                >
                  {expandedEnergy ? '收起趋势' : '查看趋势'}
                  <ChevronDown />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3">
                <PowerChart history={state.history} compact />
                <CardDescription className="tabular-nums">
                  本次 {energyText.value} {energyText.unit}
                </CardDescription>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => state.select('room')}
                >
                  查看用电详情
                </Button>
              </CollapsibleContent>
            </CardContent>
          </Card>
        </Collapsible>
        <Card
          className={cn(
            'absolute right-4 top-20 z-30 gap-2 p-2 md:top-1/2 md:-translate-y-1/2',
            panelOpen && 'md:right-100',
          )}
        >
          <nav
            className="flex flex-row gap-2 md:flex-col"
            aria-label="场景工具"
          >
            <Popover
              open={menu === 'camera'}
              onOpenChange={(open) => setMenu(open ? 'camera' : null)}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="镜头与模型检查">
                  <Focus />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side={isMobile ? 'bottom' : 'left'}
                align="end"
                className="w-64"
                aria-label="观察角度"
              >
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>观察角度</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="关闭镜头菜单"
                    onClick={() => setMenu(null)}
                  >
                    <X />
                  </Button>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  {Object.entries(CAMERA_VIEWS).map(([id, view]) => (
                    <Button
                      key={id}
                      variant={
                        !active && state.cameraView === id
                          ? 'secondary'
                          : 'ghost'
                      }
                      className="justify-start"
                      onClick={() => {
                        state.setView(id as CameraView)
                        setMenu(null)
                      }}
                    >
                      {view.label}
                    </Button>
                  ))}
                  {active && (
                    <>
                      <Separator />
                      <CardDescription>
                        {active.name} · 模型细节
                      </CardDescription>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          state.selectStation(active.id)
                          state.closePanel()
                          setMenu(null)
                        }}
                      >
                        完整床位
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          state.inspect('strip')
                          state.closePanel()
                          setMenu(null)
                        }}
                      >
                        插头与走线
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          state.inspect('bed')
                          state.closePanel()
                          setMenu(null)
                        }}
                      >
                        上铺与护栏
                      </Button>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={state.energyFlow}
                  onPressedChange={state.toggleFlow}
                  aria-label="切换能流"
                >
                  <Zap />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>四路能流 · F</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={state.labels}
                  onPressedChange={state.toggleLabels}
                  aria-label="切换模型标记"
                >
                  <Eye />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>床位与设备标记</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  disabled={!active}
                  pressed={!!active && state.cutaway}
                  onPressedChange={state.toggleCutaway}
                  aria-label="切换上铺透明检查"
                >
                  <Layers />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>上铺透明检查 · X</TooltipContent>
            </Tooltip>
            <Popover
              open={menu === 'help'}
              onOpenChange={(open) => setMenu(open ? 'help' : null)}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="交互指南">
                  <Info />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side={isMobile ? 'bottom' : 'left'}
                align="end"
                aria-label="交互指南"
                className="w-72"
              >
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>从一个床位开始</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="关闭指南"
                    onClick={() => setMenu(null)}
                  >
                    <X />
                  </Button>
                </div>
                <div className="mt-4 space-y-4">
                  <CardDescription>
                    点击床位进入桌面，点电器查看功率、开关和负载。每个床位独立供电。
                  </CardDescription>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <KbdGroup>
                      <Kbd>1</Kbd>–<Kbd>4</Kbd>
                    </KbdGroup>
                    <span>切换床位</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <KbdGroup>
                      <Kbd>0</Kbd>
                      <Kbd>Esc</Kbd>
                    </KbdGroup>
                    <span>回全景 / 关闭详情</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <KbdGroup>
                      <Kbd>F</Kbd>
                      <Kbd>X</Kbd>
                      <Kbd>L</Kbd>
                    </KbdGroup>
                    <span>能流 / 透视 / 昼夜</span>
                  </div>
                  <CardDescription>
                    拖动旋转，滚轮缩放。数据均为模拟值。
                  </CardDescription>
                </div>
              </PopoverContent>
            </Popover>
          </nav>
        </Card>
        <div
          className={cn(
            'pointer-events-none absolute inset-x-4 bottom-4 z-30 flex flex-col items-center gap-2',
            panelOpen && 'md:right-100',
          )}
        >
          <Card className="pointer-events-auto w-full max-w-full gap-2 p-2 lg:w-auto">
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={1}
              className="w-full"
              value={active?.id ?? 'room'}
              onValueChange={(value) => {
                if (value === 'room') state.setView('overview')
                else if (value) state.selectStation(value as StationId)
              }}
              aria-label="选择四个独立床位"
            >
              <ToggleGroupItem
                value="room"
                className="h-auto min-w-0 flex-1 flex-col gap-1 px-1 py-2 lg:flex-none lg:px-4"
                aria-label="返回四人寝全景"
              >
                <Home />
                <span className="text-xs">全寝</span>
              </ToggleGroupItem>
              {STATIONS.map((station) => {
                const watts = stationDevices(station.id).reduce(
                  (sum, d) => sum + state.devices[d.id].watts,
                  0,
                )
                const powered = state.masterOn && state.strips[station.id]
                return (
                  <ToggleGroupItem
                    key={station.id}
                    value={station.id}
                    className="h-auto min-w-0 flex-1 flex-col gap-1 px-1 py-2 lg:flex-none lg:px-4"
                    aria-label={`进入${station.name}`}
                  >
                    <span className="max-w-full truncate">
                      {station.number}
                      <span className="ml-2 hidden lg:inline">
                        {station.theme}
                      </span>
                    </span>
                    <span className="max-w-full truncate text-xs font-normal text-muted-foreground tabular-nums">
                      {powered ? `${watts.toFixed(0)} W` : '已断电'}
                    </span>
                  </ToggleGroupItem>
                )
              })}
            </ToggleGroup>
          </Card>
          <Badge variant="secondary" className="hidden gap-2 md:inline-flex">
            <Mouse />
            拖动旋转 · 滚轮缩放 · 点击设备探索
          </Badge>
        </div>
        <PowerPanel />
      </main>
    </TooltipProvider>
  )
}
