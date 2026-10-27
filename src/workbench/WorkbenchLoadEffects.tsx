import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PointLight } from 'three'
import type { LoadVisual } from './load-visuals'
import { loadPulse } from './load-visuals'
import { BenchBox } from './WorkbenchGeometry'

export function LoadHalo({ visual, position, width, depth, name }: { visual: LoadVisual; position: [number, number, number]; width: number; depth: number; name?: string }) {
  const material = useRef<MeshBasicMaterial>(null)
  const outer = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    const pulse = loadPulse(visual, clock.elapsedTime)
    if (material.current) material.current.opacity = visual.haloOpacity * pulse
    if (outer.current) outer.current.scale.setScalar(1 + (1 - pulse) * .05)
  })
  return <group name={name} position={position} visible={visual.active} userData={{ status: visual.status, active: visual.active, glow: visual.glow }}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[width / 2, depth / 2, 1]} raycast={() => null}>
      <circleGeometry args={[1, 48]} />
      <meshBasicMaterial ref={material} color={visual.color} transparent opacity={visual.haloOpacity} depthWrite={false} toneMapped={false} />
    </mesh>
    <group scale={[width / 2, 1, depth / 2]}>
      <mesh ref={outer} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[1, 1.045, 48]} />
        <meshBasicMaterial color={visual.color} transparent opacity={visual.status === 'normal' ? .22 : .72} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  </group>
}

export function StripLoadEffects({ visual, socketWatts }: { visual: LoadVisual; socketWatts: number[] }) {
  const bar = useRef<Group>(null)
  const light = useRef<PointLight>(null)
  useFrame(({ clock }) => {
    const pulse = loadPulse(visual, clock.elapsedTime)
    if (bar.current) for (const child of bar.current.children) {
      const mesh = child as Mesh
      const material = mesh.material as MeshStandardMaterial
      if (mesh.userData.lit) material.emissiveIntensity = visual.glow * pulse
    }
    if (light.current) light.current.intensity = visual.active && visual.status !== 'normal' ? visual.glow * pulse * .7 : 0
  })
  return <group name="strip-load-effects" userData={{ status: visual.status, active: visual.active, pressure: visual.pressure, segments: visual.segments, pulseHz: visual.pulseHz }}>
    <LoadHalo name="strip-load-halo" visual={visual} position={[0, .033, -.48]} width={5.15} depth={.7} />
    <group ref={bar} name="strip-load-segments" position={[0, .143, -.369]}>
      {Array.from({ length: 12 }, (_, index) => <mesh key={index} position={[-1.98 + index * .36, 0, 0]} userData={{ lit: index < visual.segments }} raycast={() => null}>
        <boxGeometry args={[.29, .024, .022]} />
        <meshStandardMaterial color={index < visual.segments ? visual.color : '#52605a'} emissive={visual.color} emissiveIntensity={index < visual.segments ? visual.glow : 0} roughness={.28} />
      </mesh>)}
    </group>
    {[-1.8, -.6, .6, 1.8].map((x, index) => socketWatts[index] > 0 && <LoadHalo key={x} visual={visual} position={[x, .164, -.48]} width={.53} depth={.27} />)}
    <pointLight ref={light} position={[0, .45, -.48]} color={visual.color} intensity={0} distance={3} decay={2} />
    {visual.status !== 'normal' && visual.active && <group name="strip-warning-crest" position={[2.16, .24, -.48]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <coneGeometry args={[.12, .18, 3]} /><meshBasicMaterial color={visual.color} toneMapped={false} />
      </mesh>
      <BenchBox size={[.018, .06, .014]} position={[0, .012, .05]} color="#3b3430" radius={.004} />
    </group>}
  </group>
}

function MeterLabel({ visual }: { visual: LoadVisual }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 128
    const context = canvas.getContext('2d')!
    context.fillStyle = '#263632'; context.fillRect(0, 0, 512, 128)
    const status = !visual.active ? '空载' : visual.status === 'overload' ? '超限' : visual.status === 'warning' ? '预警' : '常规'
    context.fillStyle = visual.color; context.font = '600 40px sans-serif'; context.textAlign = 'center'
    context.fillText(`宿舍回路 · ${status}`, 256, 54)
    context.font = '22px sans-serif'; context.fillStyle = '#b5c8bb'; context.fillText('阈值示意 / 非真实温度', 256, 100)
    const map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    return map
  }, [visual.active, visual.color, visual.status])
  useEffect(() => () => texture.dispose(), [texture])
  return <mesh position={[0, .4, .105]} raycast={() => null}>
    <planeGeometry args={[1.58, .36]} />
    <meshBasicMaterial map={texture} toneMapped={false} />
  </mesh>
}

/** A wall-mounted indicator for ROOM risk, independent of strip master power. */
export function RoomLoadMeter({ visual }: { visual: LoadVisual }) {
  const lamp = useRef<MeshStandardMaterial>(null)
  const spill = useRef<PointLight>(null)
  useFrame(({ clock }) => {
    const pulse = loadPulse(visual, clock.elapsedTime)
    if (lamp.current) lamp.current.emissiveIntensity = visual.active ? visual.glow * pulse : 0
    if (spill.current) spill.current.intensity = visual.active && visual.status !== 'normal' ? pulse * visual.glow * .55 : 0
  })
  return <group name="room-load-meter" position={[.45, 1.15, -.96]} userData={{ status: visual.status, active: visual.active, pressure: visual.pressure, segments: visual.segments, pulseHz: visual.pulseHz }}>
    <BenchBox size={[2, 1.26, .12]} color="#e1ddd0" radius={.065} roughness={.45} />
    <BenchBox size={[1.84, 1.09, .025]} position={[0, 0, .07]} color="#283731" radius={.035} roughness={.35} />
    <MeterLabel visual={visual} />
    <group name="room-load-segments">
      {Array.from({ length: 12 }, (_, index) => <mesh key={index} position={[-.77 + index * .14, .12, .095]} raycast={() => null}>
        <boxGeometry args={[.095, .22, .02]} />
        <meshStandardMaterial color={index < visual.segments ? visual.color : '#46524b'} emissive={visual.color} emissiveIntensity={index < visual.segments ? visual.glow * .6 : 0} />
      </mesh>)}
    </group>
    <mesh position={[-.56, -.24, .11]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
      <cylinderGeometry args={[.105, .105, .035, 24]} />
      <meshStandardMaterial ref={lamp} color={visual.color} emissive={visual.color} emissiveIntensity={visual.glow} roughness={.24} />
    </mesh>
    <BenchBox size={[.75, .025, .016]} position={[.22, -.17, .1]} color={visual.active ? visual.color : '#56655c'} radius={.006} emissive={visual.color} emissiveIntensity={visual.active ? visual.glow * .35 : 0} />
    <BenchBox size={[.48, .025, .016]} position={[.08, -.29, .1]} color="#91a28f" radius={.006} />
    <pointLight ref={spill} position={[0, .28, .42]} color={visual.color} intensity={0} distance={3.5} decay={2} />
    <LoadHalo visual={visual} position={[0, -.56, .12]} width={1.78} depth={.1} />
  </group>
}
