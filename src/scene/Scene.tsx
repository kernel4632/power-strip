import { memo, useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, PerformanceMonitor } from '@react-three/drei'
import { Color, PCFShadowMap, Vector3 } from 'three'
import type { AmbientLight, DirectionalLight } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  CAMERA_VIEWS,
  DEVICE_CATALOG,
  DEVICE_MAP,
  STRIP_POSITION,
} from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'
import { Appliance } from './Appliance'
import { DormRoom } from './DormRoom'
import { PowerStrip } from './PowerStrip'
import { StaticGeometry } from './StaticGeometry'

function CameraRig() {
  const controls = useRef<OrbitControlsImpl>(null)
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const size = useThree((state) => state.size)
  const revision = usePowerStore((state) => state.cameraRevision)
  const autoRotate = usePowerStore((state) => state.autoRotate)
  const goal = useRef({
    position: new Vector3(),
    target: new Vector3(),
    moving: false,
  })
  useEffect(() => {
    const state = usePowerStore.getState()
    const preset = CAMERA_VIEWS[state.cameraView]
    const device =
      state.selected && state.selected !== 'strip'
        ? DEVICE_MAP[state.selected]
        : null
    goal.current.position.set(
      ...(device
        ? device.camera
        : state.selected === 'strip'
          ? ([3.4, 2.7, 1.2] as [number, number, number])
          : preset.position),
    )
    goal.current.target.set(
      ...(device
        ? device.target
        : state.selected === 'strip'
          ? STRIP_POSITION
          : preset.target),
    )
    if (!state.selected && size.width < 700)
      goal.current.position
        .sub(goal.current.target)
        .multiplyScalar(Math.max(1.25, 1.05 / (size.width / size.height)))
        .add(goal.current.target)
    goal.current.moving = true
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      controls.current
    ) {
      camera.position.copy(goal.current.position)
      controls.current.target.copy(goal.current.target)
      controls.current.update()
      goal.current.moving = false
    }
    invalidate()
  }, [revision, size.width, size.height, invalidate, camera.position])
  useFrame(({ invalidate }, delta) => {
    if (!controls.current || !goal.current.moving) return
    const damp = 1 - Math.exp(-Math.min(delta, 0.1) * 3.8)
    camera.position.lerp(goal.current.position, damp)
    controls.current.target.lerp(goal.current.target, damp)
    controls.current.update()
    if (camera.position.distanceToSquared(goal.current.position) < 0.0001)
      goal.current.moving = false
    else invalidate()
  })
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1.4}
      maxDistance={55}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI / 2.1}
      minAzimuthAngle={-Math.PI / 2.5}
      maxAzimuthAngle={Math.PI / 2}
      autoRotate={
        autoRotate &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      }
      autoRotateSpeed={0.4}
      onStart={() => {
        goal.current.moving = false
      }}
      target={[0, 1.15, -0.3]}
    />
  )
}

function HotspotProjection() {
  const anchors = useRef([
    ...DEVICE_CATALOG.map((spec) => ({
      id: spec.id as string,
      point: new Vector3(...spec.position).add(
        new Vector3(...spec.labelOffset),
      ),
      element: null as HTMLElement | null,
    })),
    {
      id: 'strip',
      point: new Vector3(...STRIP_POSITION).add(new Vector3(0.5, 0.31, 0.3)),
      element: null as HTMLElement | null,
    },
  ])
  const point = useRef(new Vector3())
  useFrame(({ camera, size }) => {
    anchors.current.forEach((anchor) => {
      if (!anchor.element?.isConnected)
        anchor.element = document.getElementById(`anchor-${anchor.id}`)
      if (!anchor.element) return
      point.current.copy(anchor.point).project(camera)
      const visible =
        point.current.z > -1 &&
        point.current.z < 1 &&
        Math.abs(point.current.x) < 1.1 &&
        Math.abs(point.current.y) < 1.1
      anchor.element.style.visibility = visible ? 'visible' : 'hidden'
      anchor.element.style.transform = `translate(${((point.current.x + 1) * size.width) / 2}px,${((1 - point.current.y) * size.height) / 2}px) translate(-50%,-50%)`
      anchor.element.style.zIndex = String(
        10 + Math.round((1 - point.current.z) * 100),
      )
    })
  })
  return null
}

function RenderBudget() {
  const get = useThree((state) => state.get)
  const frames = useRef(0)
  const elapsed = useRef(0)
  useEffect(() => {
    const gl = get().gl
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    const unsubscribe = usePowerStore.subscribe((next, previous) => {
      if (next.night !== previous.night) {
        gl.shadowMap.needsUpdate = true
        get().invalidate()
      }
    })
    const timer = window.setInterval(() => {
      const state = usePowerStore.getState()
      if (
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
        (state.autoRotate ||
          state.energyFlow ||
          (state.masterOn &&
            (state.devices.fan.on ||
              state.devices.kettle.on ||
              state.devices.ac.on)))
      )
        get().invalidate()
    }, 1000 / 30)
    return () => {
      unsubscribe()
      window.clearInterval(timer)
      gl.shadowMap.autoUpdate = true
    }
  }, [get])
  useFrame(({ gl }, delta) => {
    elapsed.current += delta
    frames.current++
    if (elapsed.current >= 2) {
      gl.domElement.dataset.fps = String(
        Math.round(frames.current / elapsed.current),
      )
      gl.domElement.dataset.drawCalls = String(gl.info.render.calls)
      gl.domElement.dataset.triangles = String(gl.info.render.triangles)
      elapsed.current = 0
      frames.current = 0
    }
  })
  return null
}

function Lighting({ night }: { night: boolean }) {
  const ambient = useRef<AmbientLight>(null)
  const sun = useRef<DirectionalLight>(null)
  const background = useRef(new Color('#e9e5dc'))
  const [dayColor] = useState(() => new Color('#e9e5dc'))
  const [nightColor] = useState(() => new Color('#1c2b31'))
  const [warm] = useState(() => new Color('#fff0d2'))
  const [cool] = useState(() => new Color('#afcddd'))
  useFrame(({ scene, invalidate }, delta) => {
    const damp = 1 - Math.exp(-delta * 2.5)
    if (ambient.current)
      ambient.current.intensity +=
        ((night ? 0.42 : 1.2) - ambient.current.intensity) * damp
    if (sun.current) {
      sun.current.intensity +=
        ((night ? 0.7 : 3.4) - sun.current.intensity) * damp
      sun.current.color.lerp(night ? cool : warm, damp)
    }
    background.current.lerp(night ? nightColor : dayColor, damp)
    scene.background = background.current
    if (
      Math.abs(background.current.r - (night ? nightColor.r : dayColor.r)) >
      0.001
    )
      invalidate()
  })
  return (
    <>
      <ambientLight ref={ambient} intensity={1.2} />
      <hemisphereLight args={['#e6eff1', '#b9a58c', 0.8]} />
      <directionalLight
        ref={sun}
        position={[1, 9, 4]}
        intensity={3.4}
        color="#fff0d2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-bias={-0.0002}
        shadow-normalBias={0.035}
      />
      <directionalLight
        position={[-2, 4, -0.5]}
        intensity={night ? 0.25 : 0.7}
        color="#cbe0db"
      />
      <pointLight
        position={[-2.7, 2.65, -1.8]}
        intensity={night ? 2.2 : 0.1}
        color="#ffc486"
        distance={4}
      />
    </>
  )
}

export const Scene = memo(function Scene() {
  const night = usePowerStore((state) => state.night)
  const [dpr, setDpr] = useState(1.5)
  return (
    <Canvas
      frameloop="demand"
      shadows={{ type: PCFShadowMap }}
      dpr={dpr}
      camera={{ position: [12.2, 10.2, 14.2], fov: 34, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={(event) => {
        if (event.type === 'click') usePowerStore.getState().select(null)
      }}
      fallback={
        <div className="scene-fallback">
          当前浏览器无法启动 WebGL。请开启硬件加速，或使用支持 WebGL
          的浏览器；数据面板仍可使用。
        </div>
      }
    >
      <PerformanceMonitor
        onDecline={() => setDpr(1)}
        flipflops={2}
        onFallback={() => setDpr(1)}
      />
      <Lighting night={night} />
      <CameraRig />
      <HotspotProjection />
      <RenderBudget />
      <StaticGeometry revision={night}>
        <DormRoom night={night} />
      </StaticGeometry>
      {DEVICE_CATALOG.map((device) => (
        <Appliance key={device.id} id={device.id} />
      ))}
      <PowerStrip />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.34, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <shadowMaterial transparent opacity={night ? 0.25 : 0.14} />
      </mesh>
    </Canvas>
  )
})
