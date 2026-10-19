import { memo, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerformanceMonitor } from '@react-three/drei'
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
import type { Point3 } from '../types'
import { Appliance } from './Appliance'
import { DormRoom } from './DormRoom'
import { PowerStrip } from './PowerStrip'

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
      id: `station-${s.id}`,
      point: new Vector3(...toWorld(s, [-0.25, 2.69, 0.15])),
      element: null as HTMLElement | null,
    })),
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
    anchors.current.forEach((a) => {
      if (!a.element?.isConnected)
        a.element = document.getElementById(`anchor-${a.id}`)
      if (!a.element) return
      point.current.copy(a.point).project(camera)
      a.element.style.visibility =
        point.current.z > -1 &&
        point.current.z < 1 &&
        Math.abs(point.current.x) < 1.1 &&
        Math.abs(point.current.y) < 1.1
          ? 'visible'
          : 'hidden'
      a.element.style.transform = `translate(${((point.current.x + 1) * size.width) / 2}px,${((1 - point.current.y) * size.height) / 2}px) translate(-50%,-50%)`
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
function Lighting({ night }: { night: boolean }) {
  const ambient = useRef<AmbientLight>(null),
    sun = useRef<DirectionalLight>(null),
    background = useRef(new Color('#e9e5dc'))
  const [day] = useState(() => new Color('#e9e5dc')),
    [dark] = useState(() => new Color('#263338'))
  useFrame(({ scene, invalidate }, delta) => {
    const d = 1 - Math.exp(-Math.min(delta, 0.1) * 3)
    if (ambient.current)
      ambient.current.intensity +=
        ((night ? 0.55 : 1.2) - ambient.current.intensity) * d
    if (sun.current)
      sun.current.intensity += ((night ? 0.7 : 2.8) - sun.current.intensity) * d
    background.current.lerp(night ? dark : day, d)
    scene.background = background.current
    if (Math.abs(background.current.r - (night ? dark.r : day.r)) > 0.001)
      invalidate()
  })
  return (
    <>
      <ambientLight ref={ambient} intensity={1.2} />
      <hemisphereLight args={['#e6ede4', '#b5aa93', 0.8]} />
      <directionalLight
        ref={sun}
        position={[3, 9, 5]}
        intensity={2.8}
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
        <div className="scene-fallback">
          请开启浏览器 WebGL 硬件加速。能源面板仍可使用。
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
