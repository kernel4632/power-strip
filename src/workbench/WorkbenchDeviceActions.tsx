import { Html } from '@react-three/drei'
import { Power, Trash2, Unplug, Zap } from 'lucide-react'
import { Vector3 } from 'three'
import type { Camera, Object3D } from 'three'
import { Button } from '@/components/ui/button'
import { BENCH_MAP } from './catalog'
import { useBenchDrag } from './drag'
import { BENCH_Y } from './layout'
import { selectReadings, useBenchStore } from './store'

const projected = new Vector3()

function actionPosition(object: Object3D, camera: Camera, size: { width: number; height: number }) {
  projected.setFromMatrixPosition(object.matrixWorld).project(camera)
  // Keep the 224px toolbar inside the canvas, including on a phone or near an edge.
  return [
    Math.max(120, Math.min(size.width - 120, (projected.x + 1) * size.width / 2)),
    Math.max(52, Math.min(size.height - 52, (1 - projected.y) * size.height / 2)),
  ]
}

export function WorkbenchDeviceActions() {
  const state = useBenchStore()
  const dragging = useBenchDrag(drag => drag.drag !== null)
  const item = state.items.find(candidate => candidate.id === state.selectedId)
  if (!item || dragging) return null

  const spec = BENCH_MAP[item.kind]
  const reading = selectReadings(state).itemWatts[item.id]
  const freeSocket = [0, 1, 2, 3].find(socket => !state.items.some(candidate => candidate.socket === socket))
  const connected = item.socket !== null
  const connectionLabel = connected ? `拔下${spec.name}插头` : `将${spec.name}接入空插孔`

  return <Html center position={[item.position[0], BENCH_Y + spec.height + .24, item.position[1]]}
    calculatePosition={actionPosition} zIndexRange={[25, 20]}>
    <div role="group" aria-label={`${spec.name}模型操作`} data-workbench-device-actions data-device-id={item.id}
      className="w-56 rounded-xl border border-rule bg-card p-2 text-card-foreground shadow-lg"
      onPointerDown={event => event.stopPropagation()} onClick={event => event.stopPropagation()}>
      <div className="mb-1 flex items-center justify-between gap-2 px-1 text-xs">
        <span className="truncate font-medium">{spec.name}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{connected ? `${Math.round(reading)} W` : '未接电'}</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant={item.on ? 'secondary' : 'outline'} className="min-w-0 flex-1 gap-1.5 px-2 text-xs"
          aria-label={`场景中${item.on ? '关闭' : '开启'}${spec.name}`} aria-pressed={item.on}
          onClick={() => {
            state.setOn(item.id, !item.on)
            useBenchDrag.getState().cancel(item.on ? `${spec.name}已关闭。` : connected ? `${spec.name}开关已开启。` : `${spec.name}开关已开启，接入插孔后才会用电。`)
          }}>
          <Power />{item.on ? '关闭' : '开启'}
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={connectionLabel} title={connectionLabel}
          disabled={!connected && freeSocket === undefined}
          onClick={() => {
            if (connected) state.disconnectItem(item.id)
            else if (freeSocket !== undefined) state.moveItem(item.id, { socket: freeSocket })
            useBenchDrag.getState().cancel(connected ? `${spec.name}插头已拔下。` : `${spec.name}已接入插孔 ${(freeSocket ?? 0) + 1}。`)
          }}>
          {connected ? <Unplug /> : <Zap />}
        </Button>
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label={`从场景删除${spec.name}`} title="删除这台电器" onClick={() => {
            state.removeItem(item.id)
            useBenchDrag.getState().cancel(`${spec.name}已从桌面删除。`)
          }}>
          <Trash2 />
        </Button>
      </div>
    </div>
  </Html>
}
