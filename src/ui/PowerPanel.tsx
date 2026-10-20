import { Focus, Zap, Layers, ArrowRight, ArrowLeft, X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
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
        : '模拟负载'
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
            ? 'bottom-26 h-1/2 rounded-t-2xl'
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
          <SheetDescription>
            {spec?.english ?? station?.theme ?? 'ROOM 302 · 四路独立供电'}
          </SheetDescription>
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
          <div className="space-y-4 p-4">
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
              <Badge variant="outline">模拟数据</Badge>
              {spec && (
                <Badge variant="secondary">
                  {station?.name} · 插孔 {spec.socket + 1}
                </Badge>
              )}
            </div>
            {spec && (
              <Button
                variant="outline"
                className="w-full"
                onClick={state.focus}
              >
                <Focus />
                近距离检查模型
              </Button>
            )}
            <Card>
              <CardHeader>
                <CardDescription>
                  {spec
                    ? '当前设备功率'
                    : station
                      ? '本床位总功率'
                      : '全寝总功率'}
                </CardDescription>
                <CardTitle className="text-4xl tabular-nums">
                  {watts.toFixed(1)}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
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
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {spec ? '示例额定功率' : '演示负载阈值'} {limit} W
                  </span>
                  <span
                    className={cn(
                      'tabular-nums',
                      level === 'near' && 'text-warning',
                      level === 'over' && 'text-destructive',
                    )}
                  >
                    {((watts / limit) * 100).toFixed(1)}%
                  </span>
                </div>
                {level !== 'calm' && (
                  <CardDescription>
                    {level === 'over'
                      ? '已超过演示阈值，不模拟真实断路保护。'
                      : '已接近演示阈值。'}
                  </CardDescription>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="power-switch">
                      {spec
                        ? '设备电源'
                        : station
                          ? '此床位插排总开关'
                          : '全寝总电源'}
                    </Label>
                    <CardDescription>
                      {station
                        ? '不改变其他床位的电源状态'
                        : '控制所有床位上游电源'}
                    </CardDescription>
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
            <Card>
              <CardHeader>
                <CardTitle>功率轨迹</CardTitle>
                <CardDescription>最近 60 秒 · 每秒采样</CardDescription>
              </CardHeader>
              <CardContent>
                <PowerChart
                  history={state.history}
                  device={spec?.id}
                  station={station?.id}
                />
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-4">
              <Card className="gap-3">
                <CardHeader className="px-4">
                  <CardDescription>本次模拟耗电</CardDescription>
                  <CardTitle className="text-lg tabular-nums">
                    {energyText.value}
                  </CardTitle>
                  <CardDescription>{energyText.unit}</CardDescription>
                </CardHeader>
              </Card>
              <Card className="gap-3">
                <CardHeader className="px-4">
                  <CardDescription>估算电流 · {VOLTAGE}V</CardDescription>
                  <CardTitle className="text-lg tabular-nums">
                    {(watts / VOLTAGE).toFixed(2)}
                  </CardTitle>
                  <CardDescription>A</CardDescription>
                </CardHeader>
              </Card>
            </div>
            {!spec && station && (
              <Card>
                <CardHeader>
                  <CardTitle>四孔插排</CardTitle>
                  <CardDescription>每孔一件设备，点击查看详情</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {devices.map((d) => (
                    <Button
                      key={d.id}
                      variant="outline"
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
              <Card>
                <CardHeader>
                  <CardTitle>四个独立床位</CardTitle>
                  <CardDescription>选择一个床位查看独立插排</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {STATIONS.map((s) => (
                    <Button
                      key={s.id}
                      variant="outline"
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
                <CardDescription>{spec.description}</CardDescription>
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
                <AlertTitle>超过演示阈值</AlertTitle>
                <AlertDescription>
                  仅作提示，不模拟真实断路保护。
                </AlertDescription>
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
            <CardDescription>
              功率与耗电均为模拟值，各床位独立控制，仅用于空间交互演示。
            </CardDescription>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
