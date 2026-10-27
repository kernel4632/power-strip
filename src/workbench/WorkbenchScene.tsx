import { Suspense, useCallback, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Environment, OrbitControls } from '@react-three/drei'
import { PCFShadowMap, PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from 'three'
import hdriUrl from '@/assets/env/brown_studio_1k.hdr?url'
import { useBenchStore, selectReadings } from './store'
import { useBenchDrag } from './drag'
import { BENCH_MAP } from './catalog'
import { BENCH_Y, plugPoint, SOCKET_POSITIONS } from './layout'
import { resolveDragTarget } from './drag-target'
import type { BenchItem, BenchPoint } from './types'
import { WorkbenchDevice } from './WorkbenchDevice'
import { DeviceActionProjection } from './DeviceActionProjection'
import type { ActionProjectionProps } from './DeviceActionProjection'
import { projectActionObstacles } from './action-layout'
import { Cable, PlacementMarker, PowerFlow, PowerStrip, WallBackdrop, WallOutlet, WorkbenchFurniture } from './WorkbenchGeometry'

const TABLE_PLANE = new Plane(new Vector3(0, 1, 0), -BENCH_Y)
const CAMERA_TARGET: [number, number, number] = [0, -.15, .7]
const SUPPLY_CABLE: [number, number, number][] = [[-2.22, .105, -.48], [-2.55, .08, -.58], [-2.72, .08, -.76], [-2.72, .16, -.88], [-2.72, .52, -.94], [-2.72, .98, -.91]]

function usePointerRay() {
  // Read the CURRENT default camera. A captured camera can be stale after
  // makeDefault/resize and project every pointer onto the wrong part of the table.
  const get = useThree(state => state.get)
  const raycaster = useRef(new Raycaster())
  const ndc = useRef(new Vector2())
  const point = useRef(new Vector3())
  return useCallback((clientX: number, clientY: number): BenchPoint | null => {
    const { gl, camera } = get()
    const rect = gl.domElement.getBoundingClientRect()
    if (!rect.width || !rect.height) return null
    ndc.current.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
    raycaster.current.setFromCamera(ndc.current, camera)
    return raycaster.current.ray.intersectPlane(TABLE_PLANE, point.current) ? [point.current.x, point.current.z] : null
  }, [get])
}

function DragController() {
  const get = useThree(state => state.get)
  const rayPoint = usePointerRay()
  useEffect(() => {
    let frame = 0
    let latest: PointerEvent | null = null
    const enableControls = (enabled: boolean) => {
      const controls = get().controls as { enabled: boolean } | null
      if (controls) controls.enabled = enabled
    }
    const unsubscribe = useBenchDrag.subscribe((state, previous) => {
      if (Boolean(state.drag) !== Boolean(previous.drag)) enableControls(!state.drag)
    })
    const updateTarget = (event: PointerEvent) => {
      const state = useBenchDrag.getState()
      const drag = state.drag
      if (!drag || event.pointerId !== drag.pointerId) return
      if (!state.hasMoved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 4) return
      const rect = get().gl.domElement.getBoundingClientRect()
      const overControls = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-workbench-sidebar], [data-workbench-palette], [data-workbench-toolbar], [data-workbench-device-actions]')
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
      const point = inside && !overControls ? rayPoint(event.clientX, event.clientY) : null
      if (!point) {
        state.preview(null, null, false)
        return
      }
      const target = resolveDragTarget(drag, point, useBenchStore.getState().items)
      state.preview(target.position, target.socket, target.valid)
    }
    const move = (event: PointerEvent) => {
      if (useBenchDrag.getState().drag?.pointerId !== event.pointerId) return
      event.preventDefault()
      latest = event
      if (!frame) frame = requestAnimationFrame(() => {
        frame = 0
        if (latest) updateTarget(latest)
      })
    }
    const finish = (event: PointerEvent) => {
      if (useBenchDrag.getState().drag?.pointerId !== event.pointerId) return
      cancelAnimationFrame(frame)
      frame = 0
      updateTarget(event)
      const { drag, hasMoved, previewPosition, hoveredSocket, validTarget, cancel } = useBenchDrag.getState()
      if (!drag || !hasMoved) { cancel(); return }
      if (!previewPosition) { cancel('已取消：请在桌面内松手。'); return }
      if (!validTarget) { cancel(drag.mode === 'plug' ? '这个插孔已被占用，连接保持不变。' : '这里放不下：与设备或排插重叠，原位置保持不变。'); return }
      const store = useBenchStore.getState()
      let success = false
      if (drag.mode === 'plug' && drag.itemId) {
        success = hoveredSocket === null
          ? store.disconnectItem(drag.itemId, previewPosition)
          : store.moveItem(drag.itemId, { socket: hoveredSocket })
      } else if (drag.itemId) {
        success = store.moveItem(drag.itemId, { position: previewPosition })
      } else {
        success = store.addItem(drag.kind, { position: previewPosition }) !== null
      }
      cancel(success ? (drag.mode === 'plug' ? (hoveredSocket === null ? '插头已拔下。' : `已接入插孔 ${hoveredSocket + 1}。`) : '已放置在松手位置。') : '放置失败，原位置保持不变。')
    }
    const abort = () => {
      cancelAnimationFrame(frame)
      frame = 0
      if (useBenchDrag.getState().drag) useBenchDrag.getState().cancel('已取消拖动。')
    }
    const cancelPointer = (event: PointerEvent) => {
      if (useBenchDrag.getState().drag?.pointerId === event.pointerId) abort()
    }
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') abort() }
    window.addEventListener('pointermove', move, { capture: true, passive: false })
    window.addEventListener('pointerup', finish, true)
    window.addEventListener('pointercancel', cancelPointer, true)
    window.addEventListener('blur', abort)
    window.addEventListener('keydown', key)
    return () => {
      cancelAnimationFrame(frame)
      unsubscribe()
      enableControls(true)
      window.removeEventListener('pointermove', move, true)
      window.removeEventListener('pointerup', finish, true)
      window.removeEventListener('pointercancel', cancelPointer, true)
      window.removeEventListener('blur', abort)
      window.removeEventListener('keydown', key)
    }
  }, [get, rayPoint])
  return null
}

function BenchDevice({ item }: { item: BenchItem }) {
  const selected = useBenchStore(state => state.selectedId === item.id)
  const drag = useBenchDrag(state => state.drag)
  const position = useBenchDrag(state => state.previewPosition)
  const moved = useBenchDrag(state => state.hasMoved)
  const rayPoint = usePointerRay()
  const get = useThree(state => state.get)
  const masterOn = useBenchStore(state => state.masterOn)
  const active = moved && position && drag?.itemId === item.id
  const displayed = active && drag.mode === 'device' ? { ...item, position } : item
  const start = (event: ThreeEvent<PointerEvent>, mode: 'device' | 'plug') => {
    event.stopPropagation()
    if (event.button !== 0 || useBenchDrag.getState().drag) return
    const point = rayPoint(event.clientX, event.clientY)
    if (!point) return
    const origin = mode === 'plug' ? plugPoint(item) : item.position
    const controls = get().controls as { enabled: boolean } | null
    if (controls) controls.enabled = false
    useBenchStore.getState().select(item.id)
    useBenchDrag.getState().start(item.kind, item.id, event, mode, [origin[0] - point[0], origin[1] - point[1]])
  }
  // One model instance throughout the gesture: no original+ghost z-fighting.
  return <WorkbenchDevice item={displayed} selected={selected} powered={masterOn && item.on && item.socket !== null && item.load > 0}
    plugPreview={active && drag.mode === 'plug' ? position : undefined}
    onClick={() => useBenchStore.getState().select(item.id)}
    onPointerDown={event => start(event, 'device')}
    onPlugPointerDown={event => start(event, 'plug')}
  />
}

function BenchItems() {
  const items = useBenchStore(state => state.items)
  return <>{items.map(item => <BenchDevice key={item.id} item={item} />)}</>
}

function DragPreview() {
  const drag = useBenchDrag(state => state.drag)
  const position = useBenchDrag(state => state.previewPosition)
  const valid = useBenchDrag(state => state.validTarget)
  if (!position || !drag) return null
  const item: BenchItem = { id: 'catalog-preview', kind: drag.kind, position, socket: null, on: false, load: 100, customWatts: null }
  return <>
    <PlacementMarker position={position} valid={valid} />
    {drag.mode === 'catalog' && <WorkbenchDevice item={item} selected={false} preview onClick={() => undefined} onPointerDown={() => undefined} />}
  </>
}

function CameraFraming() {
  const get = useThree(state => state.get)
  const width = useThree(state => state.size.width)
  const height = useThree(state => state.size.height)
  const framedViewport = useRef('')
  useEffect(() => {
    const { camera } = get()
    if (!(camera instanceof PerspectiveCamera) || !width || !height) return
    const viewportKey = `${window.innerWidth}:${window.innerHeight}:${width}`
    // Reserving an action row changes only canvas height, not the user's view.
    // Do not reset an orbited camera when a contextual panel docks/undocks.
    if (framedViewport.current === viewportKey) return
    framedViewport.current = viewportKey
    const distance = Math.max(7.6 / (width / height), 5) / (2 * Math.tan(camera.fov * Math.PI / 360))
    const direction = new Vector3(.8, .95, 1.2).normalize().multiplyScalar(distance)
    camera.position.copy(new Vector3(...CAMERA_TARGET).add(direction))
    camera.lookAt(...CAMERA_TARGET)
    camera.updateProjectionMatrix()
  }, [get, width, height])
  return null
}

function Diagnostics() {
  const get = useThree(state => state.get)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const host = window as unknown as { workbenchDiagnostics?: (point?: BenchPoint) => unknown }
    host.workbenchDiagnostics = point => {
      const { scene, camera, gl } = get()
      const rect = gl.domElement.getBoundingClientRect()
      scene.updateMatrixWorld(true)
      camera.updateMatrixWorld()
      const screen = (point: BenchPoint, y = BENCH_Y) => {
        const projected = new Vector3(point[0], y, point[1]).project(camera)
        return [rect.left + (projected.x + 1) * rect.width / 2, rect.top + (1 - projected.y) * rect.height / 2]
      }
      const store = useBenchStore.getState()
      return {
        camera: { position: camera.position.toArray(), quaternion: camera.quaternion.toArray() },
        projectedPoint: point ? screen(point) : null,
        actionObstacles: projectActionObstacles(scene, camera, store.items, rect).map(box => ({ ...box, x: box.x + rect.left, y: box.y + rect.top })),
        items: store.items.map(item => {
          const model = scene.getObjectByName(`bench-device-${item.id}`)
          return {
            ...item,
            screen: screen(item.position, BENCH_Y + Math.min(.2, BENCH_MAP[item.kind].height / 2)),
            plugScreen: screen(plugPoint(item), BENCH_Y + .14),
            modelId: model?.uuid,
            renderedPosition: model?.position.toArray(),
            modelInstances: scene.getObjectsByProperty('name', `bench-device-${item.id}`).length,
          }
        }),
        sockets: SOCKET_POSITIONS.map(point => screen(point, BENCH_Y + .14)),
        drag: useBenchDrag.getState(),
        catalogPreviews: scene.children.flatMap(child => child.getObjectsByProperty('name', 'bench-catalog-preview')).length,
      }
    }
    return () => { delete host.workbenchDiagnostics }
  }, [get])
  return null
}

function SceneContent(props: ActionProjectionProps) {
  const items = useBenchStore(state => state.items)
  const masterOn = useBenchStore(state => state.masterOn)
  const settings = useBenchStore(state => state.settings)
  const socketItems = SOCKET_POSITIONS.map((_, index) => items.find(item => item.socket === index)?.id ?? null)
  const readings = selectReadings({ items, masterOn, settings })
  return <>
    <color attach="background" args={['#d8d2c3']} />
    <Suspense fallback={null}><Environment files={hdriUrl} environmentIntensity={.24} /></Suspense>
    <ambientLight intensity={.38} color="#fff5df" />
    <hemisphereLight args={['#fff9e8', '#68716c', .48]} />
    <directionalLight position={[-3.5, 6, 4]} intensity={2.8} color="#ffe0ad" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5} shadow-bias={-.0001} shadow-normalBias={.02} />
    <directionalLight position={[4, 3, -4]} intensity={.55} color="#d6e5eb" />
    <WallBackdrop /><WorkbenchFurniture /><WallOutlet status={readings.room.status} />
    <Cable points={SUPPLY_CABLE} color="#4a4a42" radius={.022} />
    <PowerFlow points={SUPPLY_CABLE} active={masterOn && readings.strip.watts > 0} status={readings.strip.status} />
    <PowerStrip on={masterOn} status={readings.strip.status} socketItems={socketItems} onSocketClick={index => {
      if (socketItems[index]) useBenchStore.getState().select(socketItems[index])
    }} />
    <BenchItems /><DragPreview /><DragController /><DeviceActionProjection {...props} />
    <OrbitControls makeDefault enableDamping dampingFactor={.08} minPolarAngle={.35} maxPolarAngle={1.42} minDistance={4.5} maxDistance={60} target={CAMERA_TARGET} />
    <CameraFraming /><Diagnostics />
  </>
}

const CAMERA = { position: [6, 7, 10] as [number, number, number], fov: 42, near: .1, far: 100 }

export function WorkbenchScene(props: ActionProjectionProps) {
  return <div className="h-full w-full touch-none" data-workbench-canvas>
    <Canvas camera={CAMERA} shadows={{ type: PCFShadowMap }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }} onPointerMissed={() => {
      if (!useBenchDrag.getState().hasMoved) useBenchStore.getState().select(null)
    }}>
      <SceneContent {...props} />
    </Canvas>
  </div>
}
