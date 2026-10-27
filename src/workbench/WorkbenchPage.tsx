import { useEffect } from 'react'
import { WorkbenchScene } from './WorkbenchScene'
import { WorkbenchSidebar, WorkbenchToolbar } from './WorkbenchSidebar'
import { WorkbenchPalette } from './WorkbenchPalette'
import { useBenchDrag } from './drag'

export function WorkbenchPage({ onExit }: { onExit: () => void }) {
  const cancelDrag = useBenchDrag(state => state.cancel)

  useEffect(() => () => cancelDrag(), [cancelDrag])

  return (
    <section className="absolute inset-0" aria-label="3D 功率组合实验台">
      <div className="absolute inset-x-0 top-14 bottom-1/2 md:left-56 md:right-80 md:bottom-0">
        <WorkbenchScene />
        <DragNotice />
      </div>
      <WorkbenchToolbar onExit={onExit} />
      <div className="absolute inset-x-0 bottom-0 top-1/2 flex flex-col md:top-14 md:pointer-events-none">
        <WorkbenchPalette />
        <WorkbenchSidebar />
      </div>
    </section>
  )
}

function DragNotice() {
  const active = useBenchDrag(state => state.drag !== null && state.hasMoved)
  const valid = useBenchDrag(state => state.validTarget)
  const message = useBenchDrag(state => state.message)
  if (!active && !message) return null
  return <p role="status" aria-live="polite" className="pointer-events-none absolute inset-x-4 bottom-4 rounded-lg border border-rule bg-card/95 px-3 py-2 text-center text-xs text-card-foreground shadow-sm">
    {active ? (valid ? '松手放置 · Esc 取消' : '此处不可放置，松手保留原位置') : message}
  </p>
}
