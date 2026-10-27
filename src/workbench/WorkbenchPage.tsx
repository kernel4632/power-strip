import { useEffect, useRef, useState } from 'react'
import { WorkbenchScene } from './WorkbenchScene'
import { WorkbenchSidebar, WorkbenchToolbar } from './WorkbenchSidebar'
import { WorkbenchPalette } from './WorkbenchPalette'
import { WorkbenchDeviceActions } from './WorkbenchDeviceActions'
import { useBenchDrag } from './drag'
import { useBenchStore } from './store'
import { HotspotLine } from '@/components/ui/hotspot-line'
import { cn } from '@/lib/utils'

export function WorkbenchPage({ onExit }: { onExit: () => void }) {
  const cancelDrag = useBenchDrag(state => state.cancel)
  const selectedId = useBenchStore(state => state.selectedId)
  const [actionsDocked, setActionsDocked] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const connectorRef = useRef<HTMLDivElement>(null)
  const docked = selectedId !== null && actionsDocked

  useEffect(() => () => cancelDrag(), [cancelDrag])
  useEffect(() => {
    // Keep the reserved row when switching/dragging another appliance. Resizing
    // the canvas mid-gesture would invalidate the pointer's world-space offset.
    const unsubscribe = useBenchStore.subscribe(state => {
      if (state.selectedId === null) setActionsDocked(false)
    })
    const resize = () => { if (!useBenchDrag.getState().drag) setActionsDocked(false) }
    window.addEventListener('resize', resize)
    return () => { unsubscribe(); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <section className="absolute inset-0" aria-label="3D 功率组合实验台">
      <div className="absolute inset-x-0 top-14 bottom-1/2 flex flex-col md:left-56 md:right-80 md:bottom-0">
        <div className={cn('relative min-h-0 flex-1', docked && 'mb-24')}>
          <WorkbenchScene panelRef={panelRef} connectorRef={connectorRef} docked={docked} dock={setActionsDocked} />
          <DragNotice />
        </div>
        <div className="pointer-events-none absolute inset-0 z-20">
          <div ref={connectorRef} hidden className="pointer-events-none absolute inset-0" data-workbench-action-connector>
            <HotspotLine id="workbench-device-actions" />
          </div>
          <WorkbenchDeviceActions panelRef={panelRef} />
        </div>
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
