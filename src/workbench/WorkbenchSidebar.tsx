import { useState } from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  RotateCcw,
  Settings2,
  Trash2,
  Unplug,
  Zap,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { BENCH_MAP } from './catalog'
import { readings, useBenchStore } from './store'
import type { BenchLimits, RiskReading, RiskStatus } from './types'

const SOCKET_COUNT = 4

function watts(value: number) {
  return `${Math.round(value).toLocaleString('zh-CN')} W`
}

function statusLabel(status: RiskStatus) {
  if (status === 'overload') return '超限'
  if (status === 'warning') return '预警'
  return '常规'
}

function statusText(status: RiskStatus) {
  if (status === 'overload') return 'text-destructive'
  if (status === 'warning') return 'text-warning'
  return 'text-muted-foreground'
}

function ThresholdStrip({
  title,
  reading,
}: {
  title: string
  reading: RiskReading
}) {
  const percentage = reading.limitWatts > 0
    ? Math.min(100, Math.max(0, reading.watts / reading.limitWatts * 100))
    : 0
  const remainingLabel = reading.remainingWatts < 0
    ? `超出上限 ${watts(Math.abs(reading.remainingWatts))}`
    : `余量 ${watts(reading.remainingWatts)}`

  return (
    <section className="space-y-2" aria-label={`${title}功率状态`} data-status={reading.status}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className={`text-xs font-medium ${statusText(reading.status)}`}>
          {statusLabel(reading.status)}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-2 tabular-nums">
        <p className="text-lg font-semibold tracking-tight">
          {watts(reading.watts)}
          <span className="ml-1 text-xs font-normal text-muted-foreground">/ {watts(reading.limitWatts)}</span>
        </p>
        <span className={`text-xs ${statusText(reading.status)}`}>{remainingLabel}</span>
      </div>
      <div className="relative pt-0.5">
        <Progress
          value={percentage}
          aria-label={`${title}负载进度`}
          aria-valuetext={`${watts(reading.watts)}，预警 ${watts(reading.warningWatts)}，上限 ${watts(reading.limitWatts)}`}
          className={`h-1.5 bg-muted ${reading.status === 'warning' ? '[&_[data-slot=progress-indicator]]:bg-warning' : ''} ${reading.status === 'overload' ? '[&_[data-slot=progress-indicator]]:bg-destructive' : ''}`}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0 W</span>
        <span>预警 {watts(reading.warningWatts)}</span>
        <span>上限 {watts(reading.limitWatts)}</span>
      </div>
    </section>
  )
}

function NumberField({
  label,
  value,
  min = 0,
  step = 50,
  onChange,
}: {
  label: string
  value: number
  min?: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex min-w-0 items-center justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={min}
          step={step}
          value={value}
          aria-label={label}
          onChange={event => {
            const next = event.currentTarget.valueAsNumber
            if (Number.isFinite(next)) onChange(Math.max(min, Math.round(next)))
          }}
          className="w-24 px-2 text-right tabular-nums"
        />
        <span className="text-muted-foreground">W</span>
      </span>
    </label>
  )
}

export function WorkbenchSidebar() {
  const state = useBenchStore()
  const currentReadings = readings(state)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const sockets = Array.from({ length: SOCKET_COUNT }, (_, index) =>
    state.items.find(item => item.socket === index) ?? null,
  )
  const looseItems = state.items.filter(item => item.socket === null)
  const selectedItem = state.items.find(item => item.id === state.selectedId) ?? null
  const selectedSpec = selectedItem ? BENCH_MAP[selectedItem.kind] : null
  const freeSocketIndex = sockets.findIndex(item => item === null)
  const connectedCount = currentReadings.connectedCount

  const unplugItem = (id: string) => {
    const live = useBenchStore.getState()
    const item = live.items.find(candidate => candidate.id === id)
    if (!item) return
    live.disconnectItem(id)
    live.select(id)
    setNotice(`${BENCH_MAP[item.kind].name}已拔下并留在桌面。`)
  }

  const connectItem = (id: string, socketIndex: number) => {
    const live = useBenchStore.getState()
    const item = live.items.find(candidate => candidate.id === id)
    if (!item || live.items.some(candidate => candidate.socket === socketIndex)) return
    if (!live.moveItem(id, { socket: socketIndex })) {
      setNotice('接入失败，插孔可能已被占用。')
      return
    }
    live.select(id)
    setNotice(`${BENCH_MAP[item.kind].name}已接入插孔 ${String(socketIndex + 1).padStart(2, '0')}。`)
  }

  const changeLimit = (scope: 'strip' | 'room', field: keyof BenchLimits, value: number) => {
    const limits = state.settings[scope]
    if (field === 'warningWatts') {
      state.updateLimits(scope, { warningWatts: Math.min(value, limits.limitWatts - 1) })
    } else {
      state.updateLimits(scope, { limitWatts: Math.max(value, limits.warningWatts + 1) })
    }
  }

  return (
    <aside
      aria-label="组合实验控制面板"
      className="pointer-events-auto z-30 flex min-h-0 flex-1 flex-col overflow-hidden border-border bg-card text-card-foreground md:absolute md:inset-y-0 md:right-0 md:w-80 md:border-l"
      data-workbench-sidebar
    >
      <div className="shrink-0 border-b border-rule px-4 pb-3 pt-2 md:pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">桌面负载 · 情景推演</p>
            <h2 className="mt-0.5 text-sm font-semibold tracking-tight">功率账本</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-right text-xs leading-tight text-muted-foreground">
              总开关<br /><span className="font-medium text-foreground">{state.masterOn ? '已开启' : '已关闭'}</span>
            </span>
            <Switch
              checked={state.masterOn}
              onCheckedChange={state.setMaster}
              aria-label="总开关"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="space-y-3 px-4 py-4">
          <div className="space-y-4 rounded-lg border border-rule bg-background/60 p-3.5">
            <ThresholdStrip title="排插负载" reading={currentReadings.strip} />
            <Separator />
            <ThresholdStrip title="宿舍负载" reading={currentReadings.room} />
          </div>

          {notice && <p className="text-xs text-muted-foreground" role="status" aria-live="polite">{notice}</p>}

          <section className="space-y-2" aria-labelledby="workbench-presets-title">
            <div className="flex items-center justify-between">
              <h3 id="workbench-presets-title" className="text-xs font-medium">快速情景</h3>
              <span className="text-xs text-muted-foreground">一键替换当前组合</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="outline" className="h-11 whitespace-normal px-2 text-xs" onClick={() => state.applyPreset('study')}>
                日常学习
              </Button>
              <Button variant="outline" className="h-11 whitespace-normal px-2 text-xs" onClick={() => state.applyPreset('strip-warning')}>
                排插预警
              </Button>
              <Button variant="outline" className="h-11 whitespace-normal px-2 text-xs" onClick={() => state.applyPreset('room-warning')}>
                宿舍预警
              </Button>
              <Button variant="outline" className="h-11 whitespace-normal px-2 text-xs" onClick={() => state.applyPreset('overload')}>
                超限示例
              </Button>
            </div>
          </section>

          <Separator />

          <section className="space-y-2" aria-labelledby="workbench-sockets-title">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 id="workbench-sockets-title" className="text-sm font-semibold">排插插孔</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">已占用 {connectedCount} / {SOCKET_COUNT}</p>
              </div>
              <Badge variant="outline" className="rounded-md font-normal text-muted-foreground">
                {currentReadings.runningCount} 台运行
              </Badge>
            </div>
            <div className="grid gap-2">
              {sockets.map((item, index) => {
                const spec = item ? BENCH_MAP[item.kind] : null
                const itemWatts = item ? currentReadings.itemWatts[item.id] ?? 0 : 0
                return (
                  <article
                    key={index}
                    className={`min-w-0 rounded-lg border p-2.5 ${item?.id === state.selectedId ? 'border-foreground/50 bg-muted/40' : 'border-rule bg-background/40'}`}
                    data-socket={index}
                    data-occupied={Boolean(item)}
                  >
                    <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
                      <span>插孔 {String(index + 1).padStart(2, '0')}</span>
                      <span>{item ? (item.on ? '已接入' : '已关闭') : '空闲'}</span>
                    </div>
                    {item && spec ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => state.select(item.id)}
                          className="mt-1.5 h-auto min-h-11 w-full justify-between gap-1 rounded-sm px-0 text-left hover:bg-transparent"
                          aria-label={`选择${spec.name}，当前功率 ${watts(itemWatts)}`}
                        >
                          <span className="min-w-0 truncate text-sm font-medium">{spec.name}</span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{watts(itemWatts)}</span>
                        </Button>
                        <div className="mt-1 flex items-center justify-between gap-1 border-t border-rule pt-1">
                          <div className="flex items-center gap-1">
                            <Switch
                              checked={item.on}
                              onCheckedChange={checked => state.setOn(item.id, checked)}
                              aria-label={`${spec.name}${item.on ? '关闭' : '开启'}`}
                            />
                            <span className="text-xs text-muted-foreground">{item.on ? '开启' : '关闭'}</span>
                          </div>
                          <Button
                            variant="ghost"
                            className="h-11 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => unplugItem(item.id)}
                            aria-label={`拔下${spec.name}并留在桌面`}
                            title="拔下并留在桌面"
                          >
                            <Unplug />
                            拔下
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-11 text-muted-foreground hover:text-destructive"
                            onClick={() => state.removeItem(item.id)}
                            aria-label={`从方案移除${spec.name}`}
                            title="从方案移除"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="mt-1.5 flex min-h-24 flex-col items-start justify-center">
                        <p className="text-sm font-medium">空插孔</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">等待接入桌面设备</p>
                        {looseItems.length > 0 && (
                          <Button
                            variant="ghost"
                            className="mt-0.5 h-11 justify-start gap-1 px-1 text-xs"
                            onClick={() => connectItem(looseItems[0].id, index)}
                            aria-label={`将${BENCH_MAP[looseItems[0].kind].name}接入插孔 ${index + 1}`}
                          >
                            <ArrowDownToLine />
                            接入桌面设备
                          </Button>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>

          <section className="space-y-2" aria-labelledby="workbench-table-title">
            <div className="flex items-center justify-between gap-2">
              <h3 id="workbench-table-title" className="text-sm font-semibold">桌面设备</h3>
              <span className="text-xs text-muted-foreground">{looseItems.length} 件未接入</span>
            </div>
            {looseItems.length > 0 ? (
              <div className="divide-y divide-rule border-y border-rule">
                {looseItems.map(item => {
                  const spec = BENCH_MAP[item.kind]
                  const itemWatts = currentReadings.itemWatts[item.id] ?? 0
                  return (
                    <div key={item.id} className="flex min-h-14 items-center gap-2 py-1" data-table-item={item.id}>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => state.select(item.id)}
                        className="h-auto min-h-11 min-w-0 flex-1 justify-start rounded-sm px-0 text-left hover:bg-transparent"
                        aria-label={`选择桌面上的${spec.name}，${watts(itemWatts)}`}
                      >
                        <span className="block truncate text-sm font-medium">{spec.name}</span>
                        <span className="block text-xs text-muted-foreground">桌面 · {watts(itemWatts)}</span>
                      </Button>
                      {freeSocketIndex >= 0 && (
                        <Button
                          variant="ghost"
                          className="h-11 gap-1 px-2 text-xs"
                          onClick={() => connectItem(item.id, freeSocketIndex)}
                          aria-label={`将${spec.name}接入排插`}
                        >
                          <Zap />
                          接入
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-11 text-muted-foreground hover:text-destructive"
                        onClick={() => state.removeItem(item.id)}
                        aria-label={`从方案移除${spec.name}`}
                        title="从方案移除"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="border-y border-rule py-3 text-xs text-muted-foreground">
                暂无未接入设备。可从资料目录添加，或在场景中拖动设备。
              </p>
            )}
          </section>

          {selectedItem && selectedSpec && (
            <section className="space-y-2 rounded-lg border border-rule bg-background/60 p-3" aria-labelledby="workbench-inspector-title">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">当前选择</p>
                  <h3 id="workbench-inspector-title" className="truncate text-sm font-semibold">{selectedSpec.name}</h3>
                </div>
                <Badge variant="outline" className="shrink-0 rounded-md font-normal">
                  {selectedItem.socket === null ? '桌面' : `插孔 ${selectedItem.socket + 1}`}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">工作负载</span>
                <span className="tabular-nums">{Math.round(selectedItem.load)}% · {watts(currentReadings.itemWatts[selectedItem.id] ?? 0)}</span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[selectedItem.load]}
                onValueChange={value => state.setLoad(selectedItem.id, value[0] ?? selectedItem.load)}
                aria-label={`${selectedSpec.name}工作负载`}
                aria-valuetext={`${Math.round(selectedItem.load)}%`}
              />
              <label className="flex min-h-11 items-center justify-between gap-3 border-t border-rule pt-2 text-xs">
                <span className="text-muted-foreground">自定义功率覆盖</span>
                <span className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={selectedItem.customWatts ?? ''}
                    placeholder="—"
                    aria-label={`${selectedSpec.name}自定义功率覆盖，瓦`}
                    onChange={event => {
                      const input = event.currentTarget
                      if (input.value === '') state.setCustomWatts(selectedItem.id, null)
                      else if (Number.isFinite(input.valueAsNumber)) state.setCustomWatts(selectedItem.id, Math.max(0, input.valueAsNumber))
                    }}
                    className="w-24 px-2 text-right tabular-nums"
                  />
                  <span className="text-muted-foreground">W</span>
                </span>
              </label>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {selectedItem.customWatts === null
                  ? `使用资料参考值：${selectedSpec.referenceText}。`
                  : '当前使用自定义值；清空输入可恢复资料参考值。'}
              </p>
            </section>
          )}

          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <div className="border-y border-rule">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex min-h-12 w-full items-center justify-between gap-2 text-left outline-none focus-visible:ring-(length:--focus-ring-width) focus-visible:ring-ring/50"
                  aria-label={settingsOpen ? '收起负载设置' : '展开负载设置'}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Settings2 className="size-4 text-muted-foreground" />
                    负载设置
                  </span>
                  <ChevronDown className={`size-4 text-muted-foreground transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="animate-disclosure-open overflow-hidden">
                <div className="space-y-4 pb-4 pt-1">
                  <fieldset className="space-y-2">
                    <legend className="mb-2 text-xs font-medium">排插阈值</legend>
                    <NumberField
                      label="预警功率"
                      value={state.settings.strip.warningWatts}
                      step={50}
                      onChange={value => changeLimit('strip', 'warningWatts', value)}
                    />
                    <NumberField
                      label="负载上限"
                      value={state.settings.strip.limitWatts}
                      min={state.settings.strip.warningWatts + 1}
                      step={50}
                      onChange={value => changeLimit('strip', 'limitWatts', value)}
                    />
                  </fieldset>
                  <fieldset className="space-y-2 border-t border-rule pt-3">
                    <legend className="mb-2 text-xs font-medium">宿舍阈值</legend>
                    <NumberField
                      label="预警功率"
                      value={state.settings.room.warningWatts}
                      step={50}
                      onChange={value => changeLimit('room', 'warningWatts', value)}
                    />
                    <NumberField
                      label="负载上限"
                      value={state.settings.room.limitWatts}
                      min={state.settings.room.warningWatts + 1}
                      step={50}
                      onChange={value => changeLimit('room', 'limitWatts', value)}
                    />
                  </fieldset>
                  <fieldset className="space-y-2 border-t border-rule pt-3">
                    <legend className="mb-2 text-xs font-medium">其他寝室负载</legend>
                    <NumberField
                      label="背景功率"
                      value={state.settings.backgroundWatts}
                      step={50}
                      onChange={value => state.setBackgroundWatts(value)}
                    />
                  </fieldset>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    预警值始终低于负载上限。阈值仅用于估算和情景比较，不代表实际保护装置动作时机。
                  </p>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          <div className="space-y-1 border-t border-rule pt-3 text-xs leading-relaxed text-muted-foreground">
            <p>设备功率为资料参考值或自定义估算，并非现场测量。</p>
            <p>排插上限按产品资料；宿舍阈值为 3000 W 演示默认值，可修改，不代表学校规定。</p>
            <p>超限提示不代表断路器或保护装置的动作时机。</p>
          </div>

          <Button
            variant="ghost"
            className="h-11 w-full justify-center gap-2 text-xs text-muted-foreground"
            onClick={() => {
              state.reset()
              setNotice('已恢复默认组合。')
            }}
          >
            <RotateCcw />
            重置组合
          </Button>
        </div>
      </div>
    </aside>
  )
}

export function WorkbenchToolbar({ onExit }: { onExit: () => void }) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-rule bg-background px-4 md:px-6" data-workbench-toolbar>
      <div className="pointer-events-auto flex items-center gap-3">
        <Button
          variant="ghost"
          className="h-11 gap-2 px-0 text-foreground hover:bg-transparent"
          onClick={onExit}
          aria-label="退出组合实验并返回宿舍"
        >
          <ArrowLeft />
          <span className="text-sm font-semibold tracking-tight">组合实验</span>
        </Button>
        <span aria-hidden="true" className="h-5 w-px bg-border" />
        <span className="hidden text-xs text-muted-foreground sm:inline">把手拖入 · 点模型开关/删除 · 拖插头接电</span>
      </div>
      <Button
        variant="outline"
        className="pointer-events-auto h-11 gap-2 px-3 text-xs md:hidden"
        onClick={onExit}
        aria-label="返回宿舍用电"
      >
        返回宿舍
        <ArrowUpRight />
      </Button>
    </header>
  )
}
