import { useState } from 'react'
import type { PointerEvent } from 'react'
import { GripVertical, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BENCH_CATALOG, BENCH_MAX_ITEMS } from './catalog'
import { useBenchDrag } from './drag'
import { useBenchStore } from './store'
import type { BenchKind } from './types'

export function WorkbenchPalette() {
  const count = useBenchStore(state => state.items.length)
  const [notice, setNotice] = useState('')
  const add = (kind: BenchKind, name: string) => {
    const id = useBenchStore.getState().addItem(kind)
    setNotice(id ? `${name}已添加到桌面，可拖动调整位置。` : '桌面已满，请先移除一台设备。')
  }
  const start = (event: PointerEvent<HTMLButtonElement>, kind: BenchKind) => {
    if (event.button !== 0 || count >= BENCH_MAX_ITEMS) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    useBenchDrag.getState().start(kind, null, event, 'catalog')
  }

  return <aside
    aria-label="左侧电器物品栏"
    data-workbench-palette
    className="pointer-events-auto z-30 flex h-28 shrink-0 flex-col overflow-hidden border-y border-rule bg-card text-card-foreground md:absolute md:inset-y-0 md:left-0 md:h-auto md:w-56 md:border-y-0 md:border-r"
  >
    <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2 md:block md:border-b md:border-rule md:px-4 md:py-4">
      <h2 className="text-sm font-semibold">电器物品栏</h2>
      <p className="text-xs text-muted-foreground md:mt-2">拖到桌面 · {count} / {BENCH_MAX_ITEMS}</p>
    </div>
    <div className="flex min-h-0 flex-1 gap-2 overflow-x-auto overscroll-contain px-3 pb-2 md:block md:space-y-2 md:overflow-x-hidden md:overflow-y-auto md:px-3 md:py-3">
      {BENCH_CATALOG.map(spec => <article key={spec.id} data-catalog-kind={spec.id} className="flex w-44 shrink-0 items-center rounded-lg border border-rule bg-background/60 md:w-full">
        <Button
          variant="ghost"
          className="h-auto min-h-14 min-w-0 flex-1 touch-none justify-start gap-1.5 px-2 py-2 text-left select-none md:min-h-16"
          disabled={count >= BENCH_MAX_ITEMS}
          onPointerDown={event => start(event, spec.id)}
          onClick={event => { if (event.detail === 0) add(spec.id, spec.name) }}
          aria-label={`拖动${spec.name}到桌面`}
          title="按住拖到桌面；键盘回车可添加"
        >
          <GripVertical className="size-3 shrink-0 text-muted-foreground" />
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium">{spec.name}</span>
            <span className="mt-1 block text-xs font-normal tabular-nums text-muted-foreground">参考 {spec.referenceWatts} W</span>
          </span>
        </Button>
        <Button variant="ghost" size="icon-sm" disabled={count >= BENCH_MAX_ITEMS}
          aria-label={`添加${spec.name}到桌面`} title="点击添加到空位"
          className="shrink-0 text-muted-foreground" onClick={() => add(spec.id, spec.name)}
        ><Plus /></Button>
      </article>)}
    </div>
    <div className="hidden shrink-0 space-y-2 border-t border-rule px-4 py-3 text-xs leading-relaxed text-muted-foreground md:block">
      <p>拖电器移动；拖插头接入插孔。红圈表示该处放不下，不会自动换位。</p>
      <p role="status" aria-live="polite">{notice || '点 + 可自动找空位；拖拽由你决定落点。'}</p>
    </div>
  </aside>
}
