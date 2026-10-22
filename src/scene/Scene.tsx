import { Suspense, memo, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerformanceMonitor } from '@react-three/drei'
import { Environment, Lightformer } from '@react-three/drei'
import hdriUrl from '@/assets/env/brown_studio_1k.hdr?url'
import {
  Box3,
  Color,
  Matrix4,
  Mesh,
  PCFShadowMap,
  PerspectiveCamera,
  Vector3,
} from 'three'
import type { AmbientLight, DirectionalLight } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  CAMERA_VIEWS,
  DEVICE_CATALOG,
  DEVICE_MAP,
  STATIONS,
  STATION_MAP,
  STRIP_LOCAL,
  stationCamera,
  toWorld,
} from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Point3 } from '../types'
import { Appliance } from './Appliance'
import { DormRoom } from './DormRoom'
import { PowerStrip } from './PowerStrip'
import { placeHotspots, type HotspotBox } from '@/lib/hotspot-layout'

function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null),
    goal = useRef({
      position: new Vector3(),
      target: new Vector3(),
      moving: false,
    })
  const camera = useThree((s) => s.camera),
    get = useThree((s) => s.get),
    size = useThree((s) => s.size),
    invalidate = useThree((s) => s.invalidate)
  const revision = usePowerStore((s) => s.cameraRevision),
    autoRotate = usePowerStore((s) => s.autoRotate)
  useEffect(() => {
    const state = usePowerStore.getState()
    let preset = state.activeStation
      ? stationCamera(state.activeStation)
      : CAMERA_VIEWS[state.cameraView]
    if (state.inspectionPart === 'device' && state.inspectedDevice) {
      const device = DEVICE_MAP[state.inspectedDevice],
        station = STATION_MAP[device.stationId]
      const target: Point3 = [
        device.localPosition[0],
        device.localPosition[1] + device.height * 0.45,
        device.localPosition[2],
      ]
      preset = {
        target: toWorld(station, target),
        position: toWorld(station, [
          target[0] - 0.18,
          Math.max(target[1] + 0.4, 1.04),
          target[2] + 1.42,
        ]),
      }
    }
    if (state.activeStation && state.inspectionPart === 'strip') {
      const station = STATION_MAP[state.activeStation]
      preset = {
        position: toWorld(station, [-0.3, 1.64, -0.24]),
        target: toWorld(station, STRIP_LOCAL),
      }
    }
    if (state.activeStation && state.inspectionPart === 'bed') {
      const station = STATION_MAP[state.activeStation]
      preset = {
        position: toWorld(station, [-0.75, 3.8, 2.1]),
        target: toWorld(station, [0, 2.15, 0]),
      }
    }
    goal.current.position.set(...preset.position)
    goal.current.target.set(...preset.target)
    const activeCamera = get().camera
    if (activeCamera instanceof PerspectiveCamera) {
      activeCamera.fov =
        state.activeStation && size.width < 700
          ? state.inspectionPart === 'station'
            ? 80
            : 62
          : state.inspectionPart === 'strip'
            ? 48
            : 34
      activeCamera.updateProjectionMatrix()
    }
    if (!state.activeStation && size.width < 700)
      goal.current.position
        .sub(goal.current.target)
        .multiplyScalar(Math.max(1.1, 0.9 / (size.width / size.height)))
        .add(goal.current.target)
    goal.current.moving = true
    if (
      matchMedia('(prefers-reduced-motion: reduce)').matches &&
      controls.current
    ) {
      activeCamera.position.copy(goal.current.position)
      controls.current.target.copy(goal.current.target)
      controls.current.update()
      goal.current.moving = false
    }
    invalidate()
  }, [revision, size.width, size.height, invalidate, get])
  useFrame(({ invalidate }, delta) => {
    if (!controls.current || !goal.current.moving) return
    const damp = 1 - Math.exp(-Math.min(delta, 0.1) * 5.5)
    camera.position.lerp(goal.current.position, damp)
    controls.current.target.lerp(goal.current.target, damp)
    controls.current.update()
    if (camera.position.distanceToSquared(goal.current.position) < 0.00005)
      goal.current.moving = false
    else invalidate()
  })
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.1}
      minDistance={0.5}
      maxDistance={55}
      minPolarAngle={0.05}
      maxPolarAngle={Math.PI / 2.02}
      autoRotate={autoRotate}
      autoRotateSpeed={0.3}
      onStart={() => {
        goal.current.moving = false
      }}
      target={[0, 1.1, -0.15]}
    />
  )
}
function Projection() {
  const anchors = useRef([
    ...STATIONS.map((s) => ({
      id: `strip-${s.id}`,
      point: new Vector3(...toWorld(s, [STRIP_LOCAL[0], 1.03, STRIP_LOCAL[2]])),
      element: null as HTMLElement | null,
    })),
    ...DEVICE_CATALOG.map((d) => ({
      id: d.id,
      point: new Vector3(...d.position).add(
        new Vector3(0, d.height + 0.055, 0),
      ),
      element: null as HTMLElement | null,
    })),
  ])
  const point = useRef(new Vector3())
  useFrame(({ camera, size }) => {
    const projected: HotspotBox[] = []
    anchors.current.forEach((a) => {
      if (!a.element?.isConnected)
        a.element = document.getElementById(`anchor-${a.id}`)
      if (!a.element) return
      point.current.copy(a.point).project(camera)
      const visible =
        point.current.z > -1 &&
        point.current.z < 1 &&
        Math.abs(point.current.x) < 1.1 &&
        Math.abs(point.current.y) < 1.1
      const button = a.element.firstElementChild as HTMLElement | null
      if (visible && button && !button.hidden)
        projected.push({
          id: a.id,
          x: ((point.current.x + 1) * size.width) / 2,
          y: ((1 - point.current.y) * size.height) / 2,
          width: button.offsetWidth,
          height: button.offsetHeight,
        })
    })
    const state = usePowerStore.getState()
    const selected = state.selected?.includes('-')
      ? state.selected
      : `strip-${state.selected}`
    const placed = placeHotspots(projected, size.width, size.height, selected)
    anchors.current.forEach((a) => {
      const box = placed.find((item) => item.id === a.id)
      const line = document.getElementById(`line-${a.id}`)
      if (a.element) a.element.style.visibility = box ? 'visible' : 'hidden'
      if (line) line.style.visibility = box ? 'visible' : 'hidden'
      if (!box || !a.element) return
      a.element.style.transform = `translate(${box.x}px,${box.y}px)`
      const origin = projected.find((item) => item.id === a.id)!
      const segment = line?.querySelector('line'),
        dot = line?.querySelector('circle')
      segment?.setAttribute('x1', String(origin.x))
      segment?.setAttribute('y1', String(origin.y))
      segment?.setAttribute('x2', String(box.x + box.width / 2))
      segment?.setAttribute('y2', String(box.y + box.height / 2))
      dot?.setAttribute('cx', String(origin.x))
      dot?.setAttribute('cy', String(origin.y))
    })
  })
  return null
}
function RenderBudget() {
  const get = useThree((s) => s.get)
  useEffect(() => {
    const gl = get().gl
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    const unsubscribe = usePowerStore.subscribe((next, prev) => {
      if (
        next.selected !== prev.selected ||
        next.labels !== prev.labels ||
        next.panelExpanded !== prev.panelExpanded
      ) {
        requestAnimationFrame(() => get().invalidate())
      }
      if (
        next.night !== prev.night ||
        next.activeStation !== prev.activeStation ||
        next.cutaway !== prev.cutaway
      ) {
        gl.shadowMap.needsUpdate = true
        get().invalidate()
        setTimeout(() => {
          gl.shadowMap.needsUpdate = true
          get().invalidate()
        }, 900)
      }
    })
    const timer = setInterval(() => {
      const state = usePowerStore.getState()
      if (
        !matchMedia('(prefers-reduced-motion: reduce)').matches &&
        (state.energyFlow ||
          state.autoRotate ||
          DEVICE_CATALOG.some(
            (d) =>
              ['fan', 'tower', 'speaker', 'humidifier'].includes(d.kind) &&
              state.masterOn &&
              state.strips[d.stationId] &&
              state.devices[d.id].on,
          ))
      )
        get().invalidate()
    }, 1000 / 24)
    return () => {
      unsubscribe()
      clearInterval(timer)
      gl.shadowMap.autoUpdate = true
    }
  }, [get])
  return null
}
/** 场景背景色与二维 UI 共用 index.css 里的 --scene-* 变量。 */
function sceneColor(token: string, fallback: string) {
  if (typeof document === 'undefined') return new Color(fallback)
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim()
  return new Color(value || fallback)
}
function Lighting({ night }: { night: boolean }) {
  const ambient = useRef<AmbientLight>(null),
    sun = useRef<DirectionalLight>(null)
  const [day] = useState(() => sceneColor('--scene-day', '#e9e5dc')),
    [dark] = useState(() => sceneColor('--scene-night', '#263338')),
    background = useRef(day.clone())
  useFrame(({ scene, invalidate }, delta) => {
    const d = 1 - Math.exp(-Math.min(delta, 0.1) * 3)
    if (ambient.current)
      ambient.current.intensity +=
        ((night ? 0.34 : 0.62) - ambient.current.intensity) * d
    if (sun.current)
      sun.current.intensity +=
        ((night ? 0.55 : 2.15) - sun.current.intensity) * d
    background.current.lerp(night ? dark : day, d)
    scene.background = background.current
    if (Math.abs(background.current.r - (night ? dark.r : day.r)) > 0.001)
      invalidate()
  })
  return (
    <>
      <ambientLight ref={ambient} intensity={0.62} />
      <hemisphereLight args={['#e6ede4', '#b5aa93', 0.38]} />
      <directionalLight
        ref={sun}
        position={[3, 9, 5]}
        intensity={2.15}
        color="#fff1d9"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-far={25}
        shadow-normalBias={0.018}
        shadow-bias={-0.0001}
      />
      <directionalLight
        position={[-3, 4, -2]}
        color="#d2e8e7"
        intensity={0.5}
      />
      <pointLight
        position={[0, 2.8, -2.8]}
        color="#ffe0ad"
        intensity={night ? 1.5 : 0.1}
        distance={6}
      />
    </>
  )
}
/**
 * HDRI 环境（Poly Haven / brown_photostudio_02，CC0）。
 * 黑漆柜体、桌面这类低粗糙度表面靠它拿到真实的高光与反射层次，
 * 只用点光/平行光时它们会呈现为一片死黑。
 */
function StudioEnvironment({ night }: { night: boolean }) {
  return (
    <Suspense fallback={<PlaceholderEnvironment intensity={0.32} />}>
      <Environment
        files={hdriUrl}
        environmentIntensity={night ? 0.12 : 0.52}
        environmentRotation={[0, 0.7, 1.1]}
      />
    </Suspense>
  )
}
/** HDRI 解码前先顶上的人造环境，避免首帧发黑。 */
function PlaceholderEnvironment({ intensity }: { intensity: number }) {
  return (
    <Environment resolution={64} frames={1} environmentIntensity={intensity}>
      <Lightformer
        form="rect"
        intensity={1.7}
        color="#fff6e6"
        position={[0, 5, 1]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[8, 5, 1]}
      />
      <Lightformer
        form="rect"
        intensity={1.3}
        color="#e6f2f5"
        position={[-6, 2, -1]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[5, 3, 1]}
      />
    </Environment>
  )
}
function Diagnostics() {
  const get = useThree((s) => s.get)
  useEffect(() => {
    const host = window as unknown as { dormDiagnostics?: () => unknown }
    host.dormDiagnostics = () => {
      const { scene, camera, gl } = get()
      scene.updateMatrixWorld(true)
      const devices = DEVICE_CATALOG.map((d) => {
        const object = scene.getObjectByName(`device-${d.id}`)
        const bounds = object ? new Box3().setFromObject(object) : null
        const world = object?.getWorldPosition(new Vector3())
        const projected = new Vector3(...d.position)
          .add(new Vector3(0, d.height * 0.45, 0))
          .project(camera)
        const local = new Box3()
        if (object) {
          const inverse = new Matrix4().copy(object.matrixWorld).invert()
          object.traverse((child) => {
            if (child instanceof Mesh) {
              child.geometry.computeBoundingBox()
              const box = child.geometry.boundingBox?.clone()
              if (box)
                local.union(
                  box.applyMatrix4(
                    new Matrix4().multiplyMatrices(inverse, child.matrixWorld),
                  ),
                )
            }
          })
        }
        return {
          id: d.id,
          station: d.stationId,
          kind: d.kind,
          world: world?.toArray(),
          bounds: bounds
            ? { min: bounds.min.toArray(), max: bounds.max.toArray() }
            : null,
          localBounds: object
            ? { min: local.min.toArray(), max: local.max.toArray() }
            : null,
          screen: [
            ((projected.x + 1) * gl.domElement.clientWidth) / 2,
            ((1 - projected.y) * gl.domElement.clientHeight) / 2,
          ],
        }
      })
      return {
        devices,
        furnitureTargets: STATIONS.map((station) => {
          const point = new Vector3(
            ...toWorld(station, [-0.65, 0.86, 0.265]),
          ).project(camera)
          return {
            id: station.id,
            screen: [
              ((point.x + 1) * gl.domElement.clientWidth) / 2,
              ((1 - point.y) * gl.domElement.clientHeight) / 2,
            ],
          }
        }),
        bedCount: STATIONS.filter((s) => scene.getObjectByName(`loft-${s.id}`))
          .length,
        stripCount: STATIONS.filter((s) =>
          scene.getObjectByName(`power-strip-${s.id}`),
        ).length,
        drawCalls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        camera: camera.position.toArray(),
      }
    }
    return () => {
      delete host.dormDiagnostics
    }
  }, [get])
  return null
}
export const Scene = memo(function Scene() {
  const night = usePowerStore((s) => s.night),
    [dpr, setDpr] = useState(1.35)
  return (
    <Canvas
      frameloop="demand"
      shadows={{ type: PCFShadowMap }}
      dpr={dpr}
      camera={{ position: [9.3, 9.7, 12.6], fov: 34, near: 0.05, far: 100 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={(e) => {
        if (e.type === 'click') usePowerStore.getState().closePanel()
      }}
      fallback={
        <div className="grid h-full place-items-center p-4">
          <Alert className="max-w-sm">
            <AlertTitle>需要 WebGL 支持</AlertTitle>
            <AlertDescription>
              请开启浏览器 WebGL 硬件加速。能源面板仍可使用。
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        flipflops={2}
        onFallback={() => setDpr(1)}
      />
      <CameraRig />
      <Projection />
      <RenderBudget />
      <Lighting night={night} />
      <StudioEnvironment night={night} />
      <Diagnostics />
      <DormRoom night={night} />
      {DEVICE_CATALOG.map((d) => (
        <Appliance key={d.id} id={d.id} />
      ))}
      <PowerStrip />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.145, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <shadowMaterial transparent opacity={0.16} />
      </mesh>
    </Canvas>
  )
})
