import { useEffect } from 'react'
import { WorkbenchScene } from './WorkbenchScene'
import { WorkbenchSidebar, WorkbenchToolbar } from './WorkbenchSidebar'
import { useBenchDrag } from './drag'

export function WorkbenchPage({ onExit }: { onExit: () => void }) {
  const cancelDrag = useBenchDrag(state => state.cancel)

  useEffect(() => () => cancelDrag(), [cancelDrag])

  return (
    <section className="absolute inset-0" aria-label="3D 功率组合实验台">
      <div className="absolute inset-x-0 top-0 bottom-1/2 md:right-88 md:bottom-0">
        <WorkbenchScene />
      </div>
      <WorkbenchToolbar onExit={onExit} />
      <WorkbenchSidebar />
    </section>
  )
}
