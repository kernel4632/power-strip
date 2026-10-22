import { Focus, Zap, Layers, ArrowRight, ArrowLeft, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { formatEnergy, loadLevel } from '@/lib/format'
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
import { MeasuredLoad } from './MeasuredLoad'
import { PowerChart } from './PowerChart'

export function PowerPanel() {
  const state = usePowerStore()
  const isMobile = useIsMobile()
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
  const powerLabel = spec
    ? `${spec.name}电源`
    : station
      ? `${station.name}插排电源`
      : '全寝总电源'
  const levelLabel =
    spec?.kind === 'lamp'
      ? '灯光亮度'
      : spec?.kind === 'fan'
        ? '风扇转速'
        : '负载'
  const level = loadLevel(watts, limit)
  const energyText = formatEnergy(energy)
  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!value) state.closePanel()
      }}
      modal={false}
    >
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        showCloseButton={false}
        className={cn(
          'gap-0',
          isMobile
            ? 'h-1/2 rounded-t-2xl'
            : 'w-96 sm:max-w-96',
        )}
        onInteractOutside={(event) => event.preventDefault()}
        aria-label="床位与设备详情"
      >
        <SheetHeader className="shrink-0 pr-16">
          <SheetTitle>
            {spec?.name ??
              (station ? `${station.name} · 独立插排` : '全寝能源概览')}
          </SheetTitle>
          <SheetDescription className="sr-only">功率与电源控制</SheetDescription>
        </SheetHeader>
        <SheetClose asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 size-10"
            aria-label="关闭详情面板"
          >
            <X />
          </Button>
        </SheetClose>
        <Separator />
        <ScrollArea key={state.selected} className="min-h-0 flex-1">
          <div className="space-y-6 p-4 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-(--motion-control) motion-safe:ease-ui motion-safe:md:slide-in-from-bottom-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={level === 'over' ? 'destructive' : 'secondary'}>
                {!state.masterOn
                  ? '全寝总电源已关'
                  : station && !state.strips[station.id]
                    ? '本床位已断电'
                    : device && !device.on
                      ? '设备待机'
                      : '正在供电'}
              </Badge>
              {spec && (
                <Badge variant="secondary">
                  {station?.name} · 插孔 {spec.socket + 1}
                </Badge>
              )}
              {device?.powerSource === 'measured' && (
                <Badge variant="outline">实测</Badge>
              )}
              {device?.powerSource === 'typical' && (
                <Badge variant="outline">实测均值</Badge>
              )}
            </div>
            {spec && (
              <Button
                variant="outline"
                className="w-full"
                onClick={state.focus}
              >
                <Focus />
                查看设备
              </Button>
            )}
            <Card className="bg-linear-to-br from-card to-secondary shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">
                  {spec
                    ? '当前设备功率'
                    : station
                      ? '本床位总功率'
                      : '全寝总功率'}
                </CardTitle>
                <CardTitle className="text-4xl tabular-nums">
                  {watts.toFixed(1)}{' '}
                  <span className="text-sm font-normal">
                    W
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Progress
                  value={Math.min(100, (watts / limit) * 100)}
                  aria-label="负载占比"
                  className={cn(
                    '[&_[data-slot=progress-indicator]]:bg-chart-2',
                    level === 'near' &&
                      '[&_[data-slot=progress-indicator]]:bg-warning',
                    level === 'over' &&
                      '[&_[data-slot=progress-indicator]]:bg-destructive',
                  )}
                />
              </CardContent>
            </Card>
            <Card className="gap-3 rounded-none border-0 bg-transparent py-0 shadow-none">
              <CardContent className="space-y-4 px-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="power-switch">
                      {spec
                        ? '设备电源'
                        : station
                          ? '此床位插排总开关'
                          : '全寝总电源'}
                    </Label>
                  </div>
                  <Switch
                    id="power-switch"
                    aria-label={powerLabel}
                    checked={active}
                    disabled={
                      (!!spec &&
                        (!state.masterOn || !state.strips[spec.stationId])) ||
                      (!!station && !state.masterOn)
                    }
                    onCheckedChange={(checked) =>
                      spec
                        ? state.toggle(spec.id)
                        : station
                          ? state.setStrip(station.id, checked)
                          : state.setMaster(checked)
                    }
                  />
                </div>
                {spec && device && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                      <Label id="device-level-label">{levelLabel}</Label>
                      <Badge variant="secondary">
                        {Math.round(device.level * 100)}%
                      </Badge>
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
                  </>
                )}
              </CardContent>
            </Card>
            <Card className="gap-3 rounded-none border-0 bg-transparent py-0 shadow-none">
              <CardHeader className="px-2">
                <CardTitle>功率轨迹</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <PowerChart
                  history={state.history}
                  device={spec?.id}
                  station={station?.id}
                />
              </CardContent>
            </Card>
            {!spec && !station && <MeasuredLoad index={state.measuredIndex} />}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <Card className="gap-3 rounded-none border-0 bg-transparent py-0 shadow-none">
                <CardHeader className="px-2">
                  <CardTitle className="text-sm">累计用电</CardTitle>
                  <CardTitle className="text-lg tabular-nums">
                    {energyText.value} {energyText.unit}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="gap-3 rounded-none border-0 bg-transparent py-0 shadow-none">
                <CardHeader className="px-2">
                  <CardTitle className="text-sm">电流</CardTitle>
                  <CardTitle className="text-lg tabular-nums">
                    {(watts / VOLTAGE).toFixed(2)} A
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
            {!spec && station && (
              <Card className="gap-3 rounded-none border-0 bg-transparent py-0 shadow-none">
                <CardHeader className="px-2">
                  <CardTitle>四孔插排</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-0">
                  {devices.map((d) => (
                    <Button
                      key={d.id}
                      variant="ghost"
                      className="h-auto w-full justify-between gap-2 py-3"
                      onClick={() => state.select(d.id)}
                    >
                      <span className="flex items-center gap-2">
                        <Badge variant="secondary">{d.socket + 1}</Badge>
                        {d.name}
                      </span>
                      <span className="text-xs tabular-nums">
                        {state.devices[d.id].watts.toFixed(1)} W
                      </span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
            {!station && (
              <Card className="gap-3 rounded-none border-0 bg-transparent py-0 shadow-none">
                <CardHeader className="px-2">
                  <CardTitle>四个独立床位</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-0">
                  {STATIONS.map((s) => (
                    <Button
                      key={s.id}
                      variant="ghost"
                      className="h-auto w-full justify-between py-3"
                      onClick={() => state.selectStation(s.id)}
                    >
                      <span>
                        {s.number} · {s.name}
                      </span>
                      <span className="text-xs tabular-nums">
                        {stationDevices(s.id)
                          .reduce((n, d) => n + state.devices[d.id].watts, 0)
                          .toFixed(1)}{' '}
                        W
                      </span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            )}
            {spec && (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => state.select(spec.stationId)}
                >
                  <ArrowLeft />
                  返回本床位插排
                </Button>
              </>
            )}
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
              </div>
            )}
            {watts > limit && (
              <Alert variant="destructive">
                <Info />
                <AlertTitle>负载偏高</AlertTitle>
              </Alert>
            )}
            {station && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => state.select('room')}
              >
                查看全寝总用电
                <ArrowRight />
              </Button>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
