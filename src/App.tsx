import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import {
  Home,
  SunMoon,
  ChartNoAxesCombined,
  Focus,
  Zap,
  Eye,
  Info,
  ChevronDown,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassSurface } from '@/components/ui/glass-surface'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { formatEnergy, formatPower } from '@/lib/format'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  CAMERA_VIEWS,
  DEVICE_CATALOG,
  STATIONS,
  STATION_MAP,
} from './data/catalog'
import { usePowerStore } from './store/usePowerStore'
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
            'absolute bottom-3 left-3 right-3 top-16 overflow-hidden rounded-xl border',
            panelOpen && 'md:right-94',
            panelOpen &&
              (state.panelExpanded ? 'max-md:bottom-3/4' : 'max-md:bottom-1/2'),
          )}
        >
          <SceneBoundary>
            <Suspense
              fallback={
                <div className="grid h-full place-items-center p-4">
                  <Card className="w-72">
                    <CardHeader>
                      <CardTitle>加载中</CardTitle>
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
          <Hotspots />
        </div>
        <header
          className={cn(
            'pointer-events-none absolute inset-x-3 top-0 z-30 flex h-16 items-center justify-between gap-2',
          )}
        >
          <div className="pointer-events-auto flex items-center gap-5">
            <Button
              variant="ghost"
              className="gap-2 px-1 text-primary md:gap-3"
              aria-label="返回四人寝全景"
              onClick={() => state.setView('overview')}
            >
              <Home />
              <h1 className="text-base font-semibold">宿舍用电观察</h1>
            </Button>
            <span className="hidden text-xs text-muted-foreground lg:inline">
              四个床位，一起生活
            </span>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    onClick={state.toggleNight}
                    aria-label={state.night ? '切换日间场景' : '切换夜间场景'}
                  >
                    <SunMoon
                      className={cn(
                        'transition-transform duration-(--motion-panel) ease-ui',
                        state.night && 'rotate-180',
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>日夜切换 · L</TooltipContent>
              </Tooltip>
            </div>
            <div>
              <Button
                variant="outline"
                className="px-3"
                onClick={() =>
                  state.select(state.selected === 'room' ? null : 'room')
                }
                aria-label="全寝能源面板"
                aria-expanded={state.selected === 'room'}
              >
                <ChartNoAxesCombined />
                <span>全寝用电</span>
              </Button>
            </div>
          </div>
        </header>
        <Collapsible
          open={expandedEnergy}
          onOpenChange={setExpandedEnergy}
          asChild
        >
          <section
            className={cn(
              'absolute bottom-7 left-7 z-20 flex w-52 flex-col gap-3 rounded-lg border bg-card/95 py-4 md:bottom-8 md:left-8 md:w-64',
              panelOpen && 'hidden',
            )}
            aria-label="场景设备功率概览"
          >
            <CardHeader className="gap-2 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                当前模拟 / 全寝功率
              </CardTitle>
              <CardTitle className="font-mono text-5xl font-normal tracking-tight text-primary md:text-6xl">
                {formatPower(total)}{' '}
                <span className="text-sm font-normal">W</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between rounded-none border-t px-0 text-xs"
                  aria-label={expandedEnergy ? '收起功率趋势' : '展开功率趋势'}
                >
                  {expandedEnergy ? '收起趋势' : '查看趋势'}
                  <ChevronDown
                    className={cn(
                      'transition-transform duration-(--motion-control) ease-ui',
                      expandedEnergy && 'rotate-180',
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-hidden data-[state=open]:animate-disclosure-open data-[state=closed]:animate-disclosure-close">
                <div className="space-y-3 pt-3">
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
                </div>
              </CollapsibleContent>
            </CardContent>
          </section>
        </Collapsible>
        <GlassSurface
          className={cn(
            'absolute right-5 top-20 z-30 rounded-md p-0 md:right-8 md:top-20',
            panelOpen && 'md:right-98',
          )}
        >
          <nav
            className="flex flex-row divide-x divide-border"
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
              <TooltipContent>设备标记</TooltipContent>
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
                      <Kbd>L</Kbd>
                    </KbdGroup>
                    <span>能流 / 昼夜</span>
                  </div>
                  <CardDescription>拖动旋转，滚轮缩放。</CardDescription>
                </div>
              </PopoverContent>
            </Popover>
          </nav>
        </GlassSurface>
        {!panelOpen && (
          <p className="pointer-events-none absolute left-7 top-36 z-10 text-xs leading-relaxed text-muted-foreground md:left-8 md:top-24">
            点选桌面，探索设备用电
            <br />
            <span className="hidden md:inline">拖动旋转 · 滚轮缩放</span>
          </p>
        )}
        <PowerPanel key={state.selected ?? 'closed'} />
      </main>
    </TooltipProvider>
  )
}
