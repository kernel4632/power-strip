import { useState } from 'react'
import {
  Focus,
  Zap,
  Layers,
  ArrowLeft,
  X,
  Expand,
  Shrink,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { formatEnergy, formatPower } from '@/lib/format'
import {
  DEVICE_CATALOG,
  DEVICE_MAP,
  STATIONS,
  STATION_MAP,
  stationDevices,
  VOLTAGE,
} from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'
import type { DeviceId, StationId } from '../types'
import { MeasuredLoad } from './MeasuredLoad'
import { PowerChart } from './PowerChart'
import { StripSpecs } from './StripSpecs'

export function PowerPanel() {
  const state = usePowerStore()
  const isMobile = useIsMobile()
  const [view, setView] = useState<'control' | 'record'>('control')
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
    : devices.reduce((n, d) => n + state.devices[d.id].watts, 0)
  const energy = formatEnergy(
    device
      ? device.energyWh
      : devices.reduce((n, d) => n + state.devices[d.id].energyWh, 0),
  )
  const active =
    state.masterOn &&
    (station ? state.strips[station.id] : true) &&
    (device ? device.on : true)
  const powerLabel = spec
    ? `${spec.name}电源`
    : station
      ? `${station.name}插排电源`
      : '全寝总电源'
  const levelLabel = spec?.kind === 'lamp' ? '灯光亮度' : '负载'
  const unavailable = !state.masterOn
    ? '全寝总电源已关闭'
    : station && !state.strips[station.id]
      ? '本床位插排已关闭'
      : null
  const deviceRows = (
    <div className="divide-y divide-border">
      {devices.map((d) => (
        <Button
          key={d.id}
          variant="ghost"
          className="h-auto min-h-12 w-full justify-between rounded-none px-0 py-2 text-left"
          onClick={() => state.select(d.id)}
        >
          <span className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              {d.socket + 1}
            </span>
            {d.name}
          </span>
          <span className="flex items-center gap-2 font-mono text-xs">
            {formatPower(state.devices[d.id].watts)} W
            <ArrowUpRight className="size-3" />
          </span>
        </Button>
      ))}
    </div>
  )
  return (
    <Sheet
      open={state.selected !== null}
      modal={false}
      onOpenChange={(value) => {
        if (!value) state.closePanel()
      }}
    >
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        showCloseButton={false}
        className={cn(
          'gap-0 overflow-hidden',
          isMobile
            ? state.panelExpanded
              ? 'h-3/4 rounded-t-xl'
              : 'h-1/2 rounded-t-xl'
            : 'bottom-3 right-3 top-16 h-auto w-88 rounded-xl border sm:max-w-88',
        )}
        onInteractOutside={(event) => event.preventDefault()}
        aria-label="床位与设备详情"
      >
        <div className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b px-4">
          <div className="min-w-0">
            <SheetTitle className="truncate text-base">
              {spec?.name ?? (station ? `${station.name} · 插排` : '全寝用电')}
            </SheetTitle>
            <SheetDescription className="sr-only">
              设备控制与采集记录
            </SheetDescription>
          </div>
          <div className="flex items-center">
            {spec && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="返回本床位插排"
                title="返回本床位插排"
                onClick={() => state.select(spec.stationId)}
              >
                <ArrowLeft />
              </Button>
            )}
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  state.panelExpanded ? '收起详情面板' : '展开详情面板'
                }
                onClick={() => state.setPanelExpanded(!state.panelExpanded)}
              >
                {state.panelExpanded ? <Shrink /> : <Expand />}
              </Button>
            )}
            <SheetClose asChild>
              <Button variant="ghost" size="icon" aria-label="关闭详情面板">
                <X />
              </Button>
            </SheetClose>
          </div>
        </div>
        <div
          className="flex shrink-0 gap-5 border-b px-4"
          aria-label="详情内容"
        >
          {(['control', 'record'] as const).map((value) => (
            <Button
              key={value}
              variant="ghost"
              aria-pressed={view === value}
              className={cn(
                'rounded-none border-b-2 border-transparent px-0 text-xs',
                view === value
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground',
              )}
              onClick={() => {
                setView(value)
                if (isMobile) state.setPanelExpanded(value === 'record')
              }}
            >
              {value === 'control'
                ? '当前模拟'
                : station && !spec
                  ? '插排资料'
                  : '24 小时记录'}
            </Button>
          ))}
        </div>
        <ScrollArea key={view} className="min-h-0 flex-1">
          <div className="space-y-5 p-4">
            {view === 'control' ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {spec
                        ? `${station?.name} / 插孔 ${spec.socket + 1}`
                        : station
                          ? '本床位功率'
                          : '14 台设备 · 当前功率'}
                    </p>
                    <p className="mt-1 flex items-baseline gap-2 font-mono text-3xl text-primary">
                      {formatPower(watts)}
                      <span className="text-sm text-muted-foreground">W</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Switch
                      id="power-switch"
                      aria-label={powerLabel}
                      checked={active}
                      disabled={
                        spec ? !!unavailable : !!station && !state.masterOn
                      }
                      onCheckedChange={(checked) =>
                        spec
                          ? state.toggle(spec.id)
                          : station
                            ? state.setStrip(station.id, checked)
                            : state.setMaster(checked)
                      }
                    />
                    <Label
                      htmlFor="power-switch"
                      className="text-xs text-muted-foreground"
                    >
                      {active ? '电源开启' : '电源关闭'}
                    </Label>
                  </div>
                </div>
                {spec && device && (
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <Label id="device-level-label" className="text-xs">
                        {levelLabel}
                      </Label>
                      <span className="font-mono">
                        {Math.round(device.level * 100)}%
                      </span>
                    </div>
                    <Slider
                      aria-labelledby="device-level-label"
                      min={10}
                      max={100}
                      step={5}
                      value={[Math.round(device.level * 100)]}
                      onValueChange={([value]) =>
                        state.setLevel(spec.id, value / 100)
                      }
                      disabled={!active}
                    />
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      按组记录峰值均分 × 负载比例。
                      {unavailable ?? '开关只影响当前模拟。'}
                    </p>
                  </div>
                )}
                {!spec && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {unavailable ?? '调整供电，观察设备与用电变化。'}
                    历史记录保持原样。
                  </p>
                )}
                {spec && (
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={state.focus}
                  >
                    在场景中近看
                    <Focus />
                  </Button>
                )}
                {!spec && station && (
                  <section aria-label="此床位设备">
                    <h3 className="mb-1 text-xs text-muted-foreground">
                      插孔 / 设备
                    </h3>
                    {deviceRows}
                  </section>
                )}
                {!station && (
                  <section
                    aria-label="四个床位"
                    className="divide-y divide-border"
                  >
                    {STATIONS.map((s) => (
                      <Button
                        key={s.id}
                        variant="ghost"
                        className="h-12 w-full justify-between rounded-none px-0"
                        onClick={() => state.selectStation(s.id)}
                      >
                        <span className="flex gap-3">
                          <span className="font-mono text-muted-foreground">
                            {String(s.number).padStart(2, '0')}
                          </span>
                          {s.name}
                        </span>
                        <span className="font-mono text-xs">
                          {formatPower(
                            stationDevices(s.id).reduce(
                              (n, d) => n + state.devices[d.id].watts,
                              0,
                            ),
                          )}{' '}
                          W
                        </span>
                      </Button>
                    ))}
                  </section>
                )}
                <Separator />
                <section className="space-y-3">
                  <h3 className="text-sm font-medium">本次操作的功率轨迹</h3>
                  <PowerChart
                    history={state.history}
                    device={spec?.id}
                    station={station?.id}
                  />
                </section>
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">本次用电</p>
                    <p className="mt-1 font-mono text-sm">
                      {energy.value} {energy.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">电流</p>
                    <p className="mt-1 font-mono text-sm">
                      {(watts / VOLTAGE).toFixed(2)} A
                    </p>
                  </div>
                </div>
                {station && !spec && (
                  <div className="grid gap-2">
                    <Button
                      variant="outline"
                      onClick={() => state.selectStation(station.id)}
                    >
                      <Focus />
                      查看完整床位
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        state.inspect('strip')
                        state.closePanel()
                      }}
                    >
                      <Zap />
                      近看插头与走线
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        state.inspect('bed')
                        state.closePanel()
                      }}
                    >
                      <Layers />
                      近看上铺与护栏
                    </Button>
                    {watts > station.limit && (
                      <p role="alert" className="text-sm text-destructive">
                        负载超过插排参考上限。
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : station && !spec ? (
              <StripSpecs />
            ) : (
              <>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  小组收集的 24 小时记录，不随本次操作改变。
                  {spec
                    ? '本设备为同组数据的单台均分值。'
                    : '仅统计场景内的 6 类设备。'}
                </p>
                <MeasuredLoad device={spec ?? undefined} />
              </>
            )}
            {station && (
              <Button
                variant="ghost"
                className="w-full justify-between border-t"
                onClick={() => state.select('room')}
              >
                查看全寝用电
                <ArrowUpRight />
              </Button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
