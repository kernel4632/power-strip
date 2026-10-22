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
  const hasRecords = !station || !!spec
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
    <div className="divide-y divide-rule border-t border-rule">
      {devices.map((d) => (
        <Button
          key={d.id}
          variant="ghost"
          className="h-11 w-full justify-between gap-3 rounded-none px-0 text-left font-normal hover:bg-transparent"
          onClick={() => state.select(d.id)}
        >
          <span className="truncate">{d.name}</span>
          <span className="flex shrink-0 items-baseline gap-1.5 font-sans text-xs tabular-nums text-muted-foreground">
            {formatPower(state.devices[d.id].watts)}
            <span className="text-xs">W</span>
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
          'gap-0 overflow-hidden rounded-none border-border bg-card',
          isMobile
            ? state.panelExpanded
              ? 'h-3/4'
              : 'h-1/2'
            : 'bottom-0 right-0 top-14 h-auto w-88 border-l sm:max-w-88',
        )}
        onInteractOutside={(event) => event.preventDefault()}
        aria-label="床位与设备详情"
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-rule px-4">
          <div className="min-w-0">
            <SheetTitle className="truncate text-sm font-semibold">
              {spec?.name ?? (station ? `${station.name}插排` : '全寝用电')}
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
        {hasRecords && (
          <div
            className="flex shrink-0 gap-5 border-b border-rule px-4"
            aria-label="详情内容"
          >
            {(['control', 'record'] as const).map((value) => (
              <Button
                key={value}
                variant="ghost"
                aria-pressed={view === value}
                className={cn(
                  'h-10 rounded-none border-b-2 px-0 text-xs font-normal hover:bg-transparent',
                  view === value
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground',
                )}
                onClick={() => {
                  setView(value)
                  if (isMobile) state.setPanelExpanded(value === 'record')
                }}
              >
                {value === 'control' ? '当前' : '24小时记录'}
              </Button>
            ))}
          </div>
        )}
        <ScrollArea key={view} className="min-h-0 flex-1">
          <div className="space-y-5 p-4">
            {view === 'control' || !hasRecords ? (
              <>
                <div className="flex items-end justify-between gap-4">
                  <p className="flex items-baseline gap-1.5 font-sans text-4xl font-medium tracking-tight tabular-nums">
                    {formatPower(watts)}
                    <span className="text-sm tracking-normal text-muted-foreground">
                      W
                    </span>
                  </p>
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
                    <Label htmlFor="power-switch" className="sr-only">
                      {active ? '电源开启' : '电源关闭'}
                    </Label>
                  </div>
                </div>
                {spec && device && (
                  <div>
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <Label id="device-level-label" className="text-xs">
                        {levelLabel}
                      </Label>
                      <span className="font-sans tabular-nums text-muted-foreground">
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
                  </div>
                )}
                {unavailable && (spec || station) && (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {unavailable}
                  </p>
                )}
                {spec && (
                  <Button
                    variant="ghost"
                    className="h-11 w-full justify-between rounded-none border-y border-rule px-0 font-normal hover:bg-transparent"
                    onClick={state.focus}
                  >
                    近看设备
                    <Focus />
                  </Button>
                )}
                {!spec && station && (
                  <section aria-label="此床位设备">{deviceRows}</section>
                )}
                {!station && (
                  <section aria-label="四个床位">
                    <div className="divide-y divide-rule border-t border-rule">
                      {STATIONS.map((s) => (
                        <Button
                          key={s.id}
                          variant="ghost"
                          className="h-11 w-full justify-between gap-3 rounded-none px-0 font-normal hover:bg-transparent"
                          onClick={() => state.selectStation(s.id)}
                        >
                          <span>{s.name}</span>
                          <span className="flex shrink-0 items-baseline gap-1.5 font-sans text-xs tabular-nums text-muted-foreground">
                            {formatPower(
                              stationDevices(s.id).reduce(
                                (n, d) => n + state.devices[d.id].watts,
                                0,
                              ),
                            )}
                            <span className="text-xs">W</span>
                          </span>
                        </Button>
                      ))}
                    </div>
                  </section>
                )}
                <section className="space-y-1">
                  <h3 className="text-xs text-muted-foreground">本次功率</h3>
                  <PowerChart
                    history={state.history}
                    device={spec?.id}
                    station={station?.id}
                  />
                </section>
                <div className="grid grid-cols-2 gap-4 border-t border-rule pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">本次用电</p>
                    <p className="mt-1 font-sans text-sm tabular-nums">
                      {energy.value} {energy.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">电流</p>
                    <p className="mt-1 font-sans text-sm tabular-nums">
                      {(watts / VOLTAGE).toFixed(2)} A
                    </p>
                  </div>
                </div>
                {station && !spec && (
                  <div className="flex flex-col divide-y divide-rule border-t border-rule">
                    <Button
                      variant="ghost"
                      className="h-11 justify-between rounded-none px-0 font-normal hover:bg-transparent"
                      onClick={() => state.selectStation(station.id)}
                    >
                      完整床位
                      <Focus />
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-11 justify-between rounded-none px-0 font-normal hover:bg-transparent"
                      onClick={() => {
                        state.inspect('strip')
                        state.closePanel()
                      }}
                    >
                      插头与走线
                      <Zap />
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-11 justify-between rounded-none px-0 font-normal hover:bg-transparent"
                      onClick={() => {
                        state.inspect('bed')
                        state.closePanel()
                      }}
                    >
                      上铺与护栏
                      <Layers />
                    </Button>
                    {watts > station.limit && (
                      <p role="alert" className="py-3 text-xs text-destructive">
                        负载超过插排参考上限。
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <MeasuredLoad device={spec ?? undefined} />
            )}
            {station && (
              <Button
                variant="ghost"
                className="h-11 w-full justify-between rounded-none border-t border-rule px-0 font-normal text-muted-foreground hover:bg-transparent"
                onClick={() => state.select('room')}
              >
                全寝
                <ArrowUpRight />
              </Button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
