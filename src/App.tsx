import { Component, Suspense, lazy, useEffect, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import {
  SunMoon,
  Focus,
  Zap,
  Eye,
  Info,
  X,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassSurface } from '@/components/ui/glass-surface'
import { PowerMark } from '@/components/ui/power-mark'
import { PowerNumber } from '@/components/ui/power-number'
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
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  CAMERA_VIEWS,
  DEVICE_CATALOG,
  STATIONS,
  STATION_MAP,
} from './data/catalog'
import { usePowerStore } from './store/usePowerStore'
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
        <Alert className="max-w-sm rounded-none">
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
  const total = DEVICE_CATALOG.reduce(
    (sum, d) => sum + state.devices[d.id].watts,
    0,
  )
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
            'absolute inset-x-0 bottom-0 top-14 overflow-hidden',
            panelOpen && 'md:right-88',
          )}
        >
          <SceneBoundary>
            <Suspense
              fallback={
                <div className="grid h-full place-items-center p-4">
                  <Skeleton className="h-40 w-40 rounded-none" />
                </div>
              }
            >
              <Scene />
            </Suspense>
          </SceneBoundary>
          <Hotspots />
        </div>
        <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-14 items-center justify-between gap-3 px-4 md:px-6">
          <Button
            variant="ghost"
            className="pointer-events-auto h-11 gap-2.5 px-0 text-foreground hover:bg-transparent"
            aria-label="返回四人寝全景"
            onClick={() => state.setView('overview')}
          >
            <PowerMark className="size-3.5" />
            <h1 className="text-sm font-semibold tracking-tight">宿舍用电</h1>
          </Button>
          <nav
            className="pointer-events-auto flex items-center gap-0.5"
            aria-label="场景工具"
          >
            <Popover
              open={menu === 'camera'}
              onOpenChange={(open) => setMenu(open ? 'camera' : null)}
            >
              <PopoverTrigger asChild>
                <Button variant="tool" size="icon" aria-label="观察角度">
                  <Focus />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side={isMobile ? 'bottom' : 'left'}
                align="start"
                sideOffset={6}
                className="w-60 border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
                aria-label="观察角度"
              >
                <GlassSurface className="rounded-none p-4 shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">观察角度</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="关闭镜头菜单"
                      onClick={() => setMenu(null)}
                    >
                      <X />
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-col divide-y divide-rule border-t border-rule">
                    {Object.entries(CAMERA_VIEWS).map(([id, view]) => (
                      <Button
                        key={id}
                        variant="ghost"
                        className={cn(
                          'h-11 justify-start rounded-none px-0 text-sm',
                          !active && state.cameraView === id
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                        )}
                        onClick={() => {
                          state.setView(id as CameraView)
                          setMenu(null)
                        }}
                      >
                        {view.label}
                      </Button>
                    ))}
                  </div>
                </GlassSurface>
              </PopoverContent>
            </Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={state.energyFlow}
                  onPressedChange={state.toggleFlow}
                  aria-label="切换能流"
                  variant="tool"
                >
                  <Zap />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>能流 · F</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={state.labels}
                  onPressedChange={state.toggleLabels}
                  aria-label="切换模型标记"
                  variant="tool"
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
                <Button variant="tool" size="icon" aria-label="交互指南">
                  <Info />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                side={isMobile ? 'bottom' : 'left'}
                align="start"
                sideOffset={6}
                aria-label="交互指南"
                className="w-64 border-0 bg-transparent p-0 shadow-none backdrop-blur-none"
              >
                <GlassSurface className="rounded-none p-4 shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">快捷键</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="关闭指南"
                      onClick={() => setMenu(null)}
                    >
                      <X />
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <KbdGroup>
                        <Kbd>1</Kbd>–<Kbd>4</Kbd>
                      </KbdGroup>
                      <span>切换床位</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <KbdGroup>
                        <Kbd>0</Kbd>
                        <Kbd>Esc</Kbd>
                      </KbdGroup>
                      <span>回全景 / 关闭</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <KbdGroup>
                        <Kbd>F</Kbd>
                        <Kbd>L</Kbd>
                      </KbdGroup>
                      <span>能流 / 昼夜</span>
                    </div>
                    <Separator />
                    <p className="text-xs text-muted-foreground">
                      拖动旋转，滚轮缩放。
                    </p>
                  </div>
                </GlassSurface>
              </PopoverContent>
            </Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="tool"
                  size="icon"
                  onClick={state.toggleNight}
                  aria-label={state.night ? '切换日间场景' : '切换夜间场景'}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <SunMoon
                    className={cn(
                      'transition-transform duration-(--motion-panel) ease-ui',
                      state.night && 'rotate-180',
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>昼夜 · L</TooltipContent>
            </Tooltip>
          </nav>
        </header>
        <Button
          variant="ghost"
          className={cn(
            'absolute bottom-4 left-4 z-20 h-auto w-56 flex-col items-stretch gap-0 rounded-lg border border-rule bg-card p-4 text-left text-card-foreground hover:bg-card md:bottom-6 md:left-6',
            panelOpen && 'hidden',
          )}
          onClick={() => state.select('room')}
          aria-label="打开全寝用电"
        >
          <span className="flex items-center justify-between gap-2 text-body text-muted-foreground">
            全寝参考功率
            <ArrowUpRight className="size-3.5" />
          </span>
          <span className="mt-1 flex items-baseline gap-1.5 font-sans text-5xl font-medium tracking-tight tabular-nums">
            <PowerNumber value={total} />
            <span className="text-sm tracking-normal text-muted-foreground">
              W
            </span>
          </span>
        </Button>
        <PowerPanel key={state.selected ?? 'closed'} />
      </main>
    </TooltipProvider>
  )
}
