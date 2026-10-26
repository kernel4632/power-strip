import { Suspense, useCallback, useEffect, useRef } from 'react'
import type { DragEvent } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { PCFShadowMap, Plane, Raycaster, Vector2, Vector3 } from 'three'
import hdriUrl from '@/assets/env/brown_studio_1k.hdr?url'
import { useBenchStore, selectReadings } from './store'
import { useBenchDrag } from './drag'
import { BENCH_MAP } from './catalog'
import { BENCH_Y, SOCKET_POSITIONS, SOCKET_SNAP_RADIUS, findPlacement, fitsSocketPlacement, socketDevicePosition } from './layout'
import type { BenchDestination, BenchItem, BenchKind, BenchPoint } from './types'
import { WorkbenchDevice } from './WorkbenchDevice'
import { Cable, PlacementMarker, PowerFlow, PowerStrip, WallBackdrop, WallOutlet, WorkbenchFurniture } from './WorkbenchGeometry'
import { useIsMobile } from '@/hooks/use-mobile'

const TABLE_PLANE = new Plane(new Vector3(0, 1, 0), -BENCH_Y)

function usePointerRay() {
  const { camera, gl } = useThree()
  const raycaster = useRef(new Raycaster())
  const ndc = useRef(new Vector2())
  const point = useRef(new Vector3())
  return useCallback((clientX: number, clientY: number): BenchPoint | null => {
    const rect = gl.domElement.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    ndc.current.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.current.setFromCamera(ndc.current, camera)
    return raycaster.current.ray.intersectPlane(TABLE_PLANE, point.current) ? [point.current.x, point.current.z] : null
  }, [camera, gl])
}

function DragController({ setControlsEnabled }: { setControlsEnabled: (enabled: boolean) => void }) {
  const rayPoint = usePointerRay()
  const preview = useBenchDrag((s) => s.preview)
  const cancel = useBenchDrag((s) => s.cancel)
  useEffect(() => {
    const pointerMove = (event: PointerEvent) => {
      const active = useBenchDrag.getState().drag
      if (!active || active.pointerId !== event.pointerId) return
      event.preventDefault()
      if (Math.hypot(event.clientX - active.startX, event.clientY - active.startY) < 5) return
      if (document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-workbench-sidebar], [data-workbench-toolbar]')) {
        preview(null, null, false)
        return
      }
      const point = rayPoint(event.clientX, event.clientY)
      if (!point) return
      const socket = SOCKET_POSITIONS.findIndex(([x, z]) => Math.hypot(point[0] - x, point[1] - z) <= SOCKET_SNAP_RADIUS)
      const items = useBenchStore.getState().items
      const freePosition = socket < 0 ? findPlacement(active.kind, items, point, active.itemId ?? undefined) : null
      const valid = socket >= 0
        ? !items.some((item) => item.socket === socket && item.id !== active.itemId)
          && fitsSocketPlacement(active.kind, socket, items, active.itemId ?? undefined)
        : freePosition !== null
      preview(socket >= 0 ? point : freePosition ?? point, socket >= 0 ? socket : null, valid)
    }
    const pointerUp = (event: PointerEvent) => {
      const active = useBenchDrag.getState().drag
      if (!active || active.pointerId !== event.pointerId) return
      const point = rayPoint(event.clientX, event.clientY)
      const didDrag = Math.hypot(event.clientX - active.startX, event.clientY - active.startY) >= 5
      const droppedOnOverlay = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-workbench-sidebar], [data-workbench-toolbar]')
      if (didDrag && point && !droppedOnOverlay) {
        const socket = SOCKET_POSITIONS.findIndex(([x, z]) => Math.hypot(point[0] - x, point[1] - z) <= SOCKET_SNAP_RADIUS)
        const destination: BenchDestination = socket >= 0 ? { socket } : { position: point }
        const items = useBenchStore.getState().items
        const freePosition = socket < 0 ? findPlacement(active.kind, items, point, active.itemId ?? undefined) : null
        const valid = socket >= 0
          ? !items.some((item) => item.socket === socket && item.id !== active.itemId)
            && fitsSocketPlacement(active.kind, socket, items, active.itemId ?? undefined)
          : freePosition !== null
        if (valid) {
          const store = useBenchStore.getState()
          const resolvedDestination: BenchDestination = socket < 0 && freePosition ? { position: freePosition } : destination
          if (active.itemId) store.moveItem(active.itemId, resolvedDestination)
          else store.addItem(active.kind, resolvedDestination)
        }
      }
      setControlsEnabled(true)
      cancel()
    }
    const pointerCancel = () => { setControlsEnabled(true); cancel() }
    window.addEventListener('pointermove', pointerMove, { capture: true, passive: false })
    window.addEventListener('pointerup', pointerUp, { capture: true })
    window.addEventListener('pointercancel', pointerCancel, { capture: true })
    return () => {
      window.removeEventListener('pointermove', pointerMove, true)
      window.removeEventListener('pointerup', pointerUp, true)
      window.removeEventListener('pointercancel', pointerCancel, true)
    }
  }, [cancel, preview, rayPoint, setControlsEnabled])
  return null
}

function NativeDropBridge() {
  const rayPoint = usePointerRay()
  const preview = useBenchDrag((s) => s.preview)
  const cancel = useBenchDrag((s) => s.cancel)
  useEffect(() => {
    const onStart = (event: Event) => {
      const detail = (event as CustomEvent<{ kind: BenchKind; clientX: number; clientY: number }>).detail
      useBenchDrag.getState().start(detail.kind, null, { pointerId: -1, clientX: detail.clientX, clientY: detail.clientY })
    }
    const onMove = (event: Event) => {
      const active = useBenchDrag.getState().drag
      if (!active || active.pointerId !== -1) return
      const detail = (event as CustomEvent<{ clientX: number; clientY: number }>).detail
      const point = rayPoint(detail.clientX, detail.clientY)
      if (!point) return
      const socket = SOCKET_POSITIONS.findIndex(([x, z]) => Math.hypot(point[0] - x, point[1] - z) <= SOCKET_SNAP_RADIUS)
      const items = useBenchStore.getState().items
      const freePosition = socket < 0 ? findPlacement(active.kind, items, point) : null
      const valid = socket >= 0
        ? !items.some(item => item.socket === socket) && fitsSocketPlacement(active.kind, socket, items)
        : freePosition !== null
      preview(socket >= 0 ? point : freePosition ?? point, socket >= 0 ? socket : null, valid)
    }
    const onDrop = (event: Event) => {
      const detail = (event as CustomEvent<{ kind: BenchKind; clientX: number; clientY: number }>).detail
      const point = rayPoint(detail.clientX, detail.clientY)
      if (point) {
        const socket = SOCKET_POSITIONS.findIndex(([x, z]) => Math.hypot(point[0] - x, point[1] - z) <= SOCKET_SNAP_RADIUS)
        const items = useBenchStore.getState().items
        const freePosition = socket < 0 ? findPlacement(detail.kind, items, point) : null
        const valid = socket >= 0
          ? !items.some(item => item.socket === socket) && fitsSocketPlacement(detail.kind, socket, items)
          : freePosition !== null
        if (valid) useBenchStore.getState().addItem(detail.kind, socket >= 0 ? { socket } : { position: freePosition! })
      }
      cancel()
    }
    window.addEventListener('bench-native-drag-start', onStart)
    window.addEventListener('bench-native-drag-move', onMove)
    window.addEventListener('bench-native-drag-end', cancel)
    window.addEventListener('bench-native-drop', onDrop)
    return () => {
      window.removeEventListener('bench-native-drag-start', onStart)
      window.removeEventListener('bench-native-drag-move', onMove)
      window.removeEventListener('bench-native-drag-end', cancel)
      window.removeEventListener('bench-native-drop', onDrop)
    }
  }, [cancel, preview, rayPoint])
  return null
}

function BenchItems({ setControlsEnabled }: { setControlsEnabled: (enabled: boolean) => void }) {
  const items = useBenchStore((s) => s.items)
  const selectedId = useBenchStore((s) => s.selectedId)
  const select = useBenchStore((s) => s.select)
  const start = useBenchDrag((s) => s.start)
  return <>{items.map((item: BenchItem) => <WorkbenchDevice key={item.id} item={item} selected={item.id === selectedId} onClick={() => select(item.id)} onPointerDown={(e) => { setControlsEnabled(false); start(item.kind, item.id, e) }} />)}</>
}

function DragPreview() {
  const drag = useBenchDrag((s) => s.drag)
  const position = useBenchDrag((s) => s.previewPosition)
  const socket = useBenchDrag((s) => s.hoveredSocket)
  const valid = useBenchDrag((s) => s.validTarget)
  const item = drag?.itemId ? useBenchStore.getState().items.find(candidate => candidate.id === drag.itemId) : null
  if (!position || !drag) return null
  const destination = socket == null ? position : SOCKET_POSITIONS[socket]
  const modelPosition = socket == null
    ? position
    : item?.position ?? findPlacement(drag.kind, useBenchStore.getState().items, socketDevicePosition(socket)) ?? position
  const ghost: BenchItem = item
    ? { ...item, position: modelPosition, socket: socket == null ? null : socket }
    : { id: 'bench-drag-preview', kind: drag.kind, position: modelPosition, socket, on: false, load: 100, customWatts: null }
  return <>
    <PlacementMarker position={destination} valid={valid} />
    <WorkbenchDevice item={ghost} selected={false} ghost onClick={() => undefined} onPointerDown={() => undefined} />
  </>
}

function SceneContent({ isMobile }: { isMobile: boolean }) {
  const items = useBenchStore((s) => s.items)
  const masterOn = useBenchStore((s) => s.masterOn)
  const settings = useBenchStore((s) => s.settings)
  const select = useBenchStore((s) => s.select)
  const drag = useBenchDrag((s) => s.drag)
  const controlsRef = useRef<{ enabled: boolean } | null>(null)
  const setControlsEnabled = useCallback((enabled: boolean) => {
    if (controlsRef.current) controlsRef.current.enabled = enabled
  }, [])
  const socketItems = SOCKET_POSITIONS.map((_, index) => items.find((item) => item.socket === index)?.id ?? null)
  const readings = selectReadings({ items, masterOn, settings })
  const cablePoints: [number, number, number][] = [[-2.22, .105, -.48], [-2.55, .08, -.58], [-2.72, .08, -.76], [-2.72, .16, -.88], [-2.72, .52, -.94], [-2.72, .98, -.91]]
  return <>
    <color attach="background" args={['#d8d2c3']} />
    <Suspense fallback={null}><Environment files={hdriUrl} environmentIntensity={.24} /></Suspense>
    <PerspectiveCamera makeDefault position={isMobile ? [3.6, 3.4, 4.6] : [3.8, 3.4, 4.8]} fov={isMobile ? 48 : 40} near={.1} far={40} />
    <ambientLight intensity={.38} color="#fff5df" />
    <hemisphereLight args={['#fff9e8', '#68716c', .48]} />
      <directionalLight position={[-3.5, 6, 4]} intensity={2.8} color="#ffe0ad" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-0.0001} shadow-normalBias={0.02} />
    <directionalLight position={[4, 3, -4]} intensity={.55} color="#d6e5eb" />
    <WallBackdrop /><WorkbenchFurniture /><WallOutlet status={readings.room.status} />
    <Cable points={cablePoints} color="#4a4a42" radius={.022} />
    <PowerFlow points={cablePoints} active={masterOn && readings.strip.watts > 0} status={readings.strip.status} />
    <PowerStrip on={masterOn} status={readings.strip.status} socketItems={socketItems} onSocketClick={(index) => { const id = socketItems[index]; if (id) select(id) }} />
    <BenchItems setControlsEnabled={setControlsEnabled} />
    <DragPreview />
    <DragController setControlsEnabled={setControlsEnabled} /><NativeDropBridge />
    <OrbitControls ref={(controls) => { controlsRef.current = controls }} makeDefault enabled={!drag} enableDamping dampingFactor={.08} minPolarAngle={.35} maxPolarAngle={1.42} minDistance={5.2} maxDistance={14} target={[0, .2, .35]} />
  </>
}

export function WorkbenchScene({ className }: { className?: string }) {
  const isMobile = useIsMobile()
  const dispatchDrop = (event: DragEvent<HTMLDivElement>) => {
    const kind = event.dataTransfer.getData('application/x-dorm-bench-kind') as BenchKind
    if (!kind || !BENCH_MAP[kind]) return
    event.preventDefault()
    window.dispatchEvent(new CustomEvent('bench-native-drop', { detail: { kind, clientX: event.clientX, clientY: event.clientY } }))
  }
  return <div className={`h-full w-full touch-none ${className ?? ''}`} onDragOver={(event) => {
    event.preventDefault()
    window.dispatchEvent(new CustomEvent('bench-native-drag-move', { detail: { clientX: event.clientX, clientY: event.clientY } }))
  }} onDrop={dispatchDrop}>
    <Canvas camera={{ position: isMobile ? [3.6, 3.4, 4.6] : [3.8, 3.4, 4.8], fov: isMobile ? 48 : 40, near: .1, far: 40 }} shadows={{ type: PCFShadowMap }} gl={{ antialias: true, powerPreference: 'high-performance' }} onPointerMissed={() => useBenchStore.getState().select(null)}>
      <SceneContent isMobile={isMobile} />
    </Canvas>
  </div>
}
