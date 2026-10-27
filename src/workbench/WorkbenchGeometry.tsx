import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Quaternion, Vector3 } from 'three'
import type { Group } from 'three'
import { useEffect, useMemo, useRef } from 'react'
import type { BenchPoint, RiskStatus } from './types'
import { surfaceMaps, TILE } from '../scene/materials'
import type { Surface } from '../scene/materials'
import type { LoadVisual } from './load-visuals'

export function BenchBox({ size, position = [0, 0, 0], color = '#d8d0bd', radius = 0.02, metalness = 0, roughness = 0.58, emissive, emissiveIntensity = 0, surface, ...props }: { size: [number, number, number]; position?: [number, number, number]; color?: string; radius?: number; metalness?: number; roughness?: number; emissive?: string; emissiveIntensity?: number; surface?: Surface; castShadow?: boolean; receiveShadow?: boolean }) {
  const width = size[0]
  const depth = size[2]
  const maps = useMemo(() => {
    if (!surface) return null
    const source = surfaceMaps(surface)
    const textures = [source.map.clone(), source.normalMap.clone(), source.roughnessMap.clone()]
    for (const texture of textures) {
      texture.repeat.set(width / TILE[surface], depth / TILE[surface])
      texture.needsUpdate = true
    }
    return { map: textures[0], normalMap: textures[1], roughnessMap: textures[2], normalScale: source.normalScale }
  }, [depth, surface, width])
  useEffect(() => () => {
    maps?.map.dispose()
    maps?.normalMap.dispose()
    maps?.roughnessMap.dispose()
  }, [maps])
  return <RoundedBox args={size} position={position} radius={radius} smoothness={3} {...props}>
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} map={maps?.map} normalMap={maps?.normalMap} normalScale={maps ? [maps.normalScale, maps.normalScale] : undefined} roughnessMap={maps?.roughnessMap} emissive={emissive} emissiveIntensity={emissiveIntensity} />
  </RoundedBox>
}

export function BenchCylinder({ position = [0, 0, 0], radius = 0.1, height = 0.1, color = '#777b74', top, rotation = [0, 0, 0], metalness = 0, roughness = 0.55 }: { position?: [number, number, number]; radius?: number; height?: number; top?: number; color?: string; rotation?: [number, number, number]; metalness?: number; roughness?: number }) {
  return <mesh position={position} rotation={rotation} castShadow receiveShadow><cylinderGeometry args={[top ?? radius, radius, height, 24]} /><meshStandardMaterial color={color} metalness={metalness} roughness={roughness} /></mesh>
}

export function BenchRod({ from, to, radius = 0.018, color = '#49504c' }: { from: [number, number, number]; to: [number, number, number]; radius?: number; color?: string }) {
  const a = new Vector3(...from), b = new Vector3(...to), d = b.clone().sub(a)
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), d.clone().normalize())
  return <mesh position={a.clone().add(b).multiplyScalar(0.5)} quaternion={rotation} castShadow>
    <cylinderGeometry args={[radius, radius, d.length(), 10]} /><meshStandardMaterial color={color} metalness={0.35} roughness={0.45} />
  </mesh>
}

export function Cable({ points, color = '#303633', radius = 0.018, emissive = '#000000', intensity = 0 }: { points: [number, number, number][]; color?: string; radius?: number; emissive?: string; intensity?: number }) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map(p => new Vector3(...p))), [points])
  return <mesh castShadow><tubeGeometry args={[curve, 32, radius, 8, false]} /><meshStandardMaterial color={color} roughness={0.8} emissive={emissive} emissiveIntensity={intensity} /></mesh>
}

export function PowerFlow({ points, visual, weight = 1, radius = .024, name }: { points: [number, number, number][]; visual: LoadVisual; weight?: number; radius?: number; name?: string }) {
  const ref = useRef<Group>(null)
  const point = useMemo(() => new Vector3(), [])
  const curve = useMemo(() => new CatmullRomCurve3(points.map(point => new Vector3(...point))), [points])
  const count = visual.active && weight > 0 ? Math.max(1, Math.ceil(visual.particleCount * weight)) : 0
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.visible = visual.active && count > 0
    for (let index = 0; index < count; index += 1) {
      const progress = (clock.elapsedTime * visual.flowSpeed * (.4 + weight * .6) + index / count) % 1
      curve.getPointAt(1 - progress, point)
      ref.current.children[index].position.copy(point)
    }
  })
  return <group ref={ref} name={name} userData={{ speed: visual.flowSpeed, count, active: visual.active, status: visual.status }}>
    {Array.from({ length: count }, (_, index) => <mesh key={index} scale={index === 0 ? 1 : .72}><sphereGeometry args={[radius, 8, 8]} /><meshBasicMaterial color={visual.color} toneMapped={false} /></mesh>)}
  </group>
}

export function Screen({ size, color = '#17353b', glow = false, rotation = [0, 0, 0], position = [0, 0, 0] }: { size: [number, number]; color?: string; glow?: boolean; rotation?: [number, number, number]; position?: [number, number, number] }) {
  return <mesh position={position} rotation={rotation}><planeGeometry args={size} /><meshStandardMaterial color={color} roughness={0.28} emissive={glow ? color : '#000000'} emissiveIntensity={glow ? 0.45 : 0} /></mesh>
}

export function PlacementMarker({ position, valid }: { position: BenchPoint; valid: boolean }) {
  return <mesh position={[position[0], 0.036, position[1]]} rotation={[-Math.PI / 2, 0, 0]}>
    <ringGeometry args={[0.27, 0.31, 32]} /><meshBasicMaterial color={valid ? '#7aa98c' : '#c87965'} transparent opacity={0.58} depthWrite={false} />
  </mesh>
}

export function WorkbenchFurniture() {
  return <group name="workbench">
    {/* Thick, warm maple slab with a soft chamfer and visible edge band. */}
    <BenchBox size={[7.12, .18, 2.94]} position={[0, -.09, .7]} color="#b88757" radius={.065} roughness={.48} />
    <BenchBox size={[7.03, .035, 2.84]} position={[0, .012, .7]} color="#d4aa77" radius={.025} roughness={.57} surface="wood" />
    <BenchBox size={[6.9, .012, .018]} position={[0, .012, -.71]} color="#ead3ad" radius={.006} roughness={.46} castShadow={false} receiveShadow={false} />
    {/* Under-frame and the low steel stretcher shelf. */}
    {[-3.08, 3.08].flatMap(x => [-.4, 1.8].map(z => <BenchBox key={`${x}-${z}`} size={[.09, 2.1, .09]} position={[x, -1.17, z]} color="#47504e" radius={.018} metalness={.62} />))}
    {[-3.08, 3.08].map(x => <BenchBox key={x} size={[.12, .07, 2.18]} position={[x, -2.11, .7]} color="#35403e" radius={.018} metalness={.6} />)}
    {[-3.08, 3.08].map(x => <BenchBox key={`rail-${x}`} size={[.08, .08, 2.28]} position={[x, -1.03, .7]} color="#59615d" radius={.014} metalness={.56} />)}
    <BenchBox size={[5.75, .09, 1.56]} position={[0, -1.63, .7]} color="#4f5753" radius={.035} metalness={.42} />
    <BenchBox size={[5.56, .025, 1.38]} position={[0, -1.57, .7]} color="#727873" radius={.02} metalness={.25} />
    {[-2.55, 2.55].map(x => <BenchBox key={`foot-${x}`} size={[.17, .07, .18]} position={[x, -2.19, .7]} color="#29312f" radius={.025} />)}
    {/* Discreet front edge detail. */}
    <BenchBox size={[6.68, .018, .018]} position={[0, -.08, 2.165]} color="#9a704b" radius={.006} />
  </group>
}

export function PowerStrip({ on, visual, socketWatts, socketItems, onSocketClick }: { on: boolean; visual: LoadVisual; socketWatts: number[]; socketItems: (string | null)[]; onSocketClick: (index: number) => void }) {
  const status = visual.status
  const indicatorColor = visual.color
  const shellColor = !visual.active || status === 'normal' ? '#eeede4' : status === 'warning' ? '#ead2a5' : '#dba69a'
  return <group name="bench-power-strip" position={[0, .075, -.48]}>
    <BenchBox size={[4.72, .09, .28]} color={shellColor} radius={.05} roughness={.34} emissive={indicatorColor} emissiveIntensity={status === 'normal' ? 0 : visual.glow * .16} />
    <BenchBox size={[4.48, .015, .235]} position={[0, .051, 0]} color={shellColor} radius={.033} roughness={.28} />
    <BenchBox size={[.06, .025, .18]} position={[2.05, .054, 0]} color={indicatorColor} radius={.012} emissive={indicatorColor} emissiveIntensity={visual.glow} />
    <BenchBox size={[.022, .006, .07]} position={[2.05, .07, 0]} color={on ? '#f1d79b' : '#5d6b60'} radius={.002} />
    {[-1.8, -.6, .6, 1.8].map((x, i) => <group key={x} position={[x, .06, 0]} onClick={e => { e.stopPropagation(); onSocketClick(i) }}>
      {/* Tall invisible-ish click target covers only the recessed socket aperture. */}
      <mesh position={[0, .018, 0]} onClick={e => { e.stopPropagation(); onSocketClick(i) }}>
        <boxGeometry args={[.8, .13, .22]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <BenchBox size={[.55, .014, .19]} position={[0, .012, 0]} color="#d9ddd4" radius={.025} />
      <BenchBox size={[.42, .004, .14]} position={[0, .021, 0]} color="#cbd2c8" radius={.016} />
      {[-.075, .075].map(dx => <BenchBox key={dx} size={[.018, .004, .072]} position={[dx, .026, .026]} color="#5c675e" radius={.006} />)}
      <BenchBox size={[.035, .004, .078]} position={[0, .026, -.04]} color="#687269" radius={.009} />
      <BenchCylinder position={[0, .029, -.082]} radius={.012} height={.006} color={socketWatts[i] > 0 ? indicatorColor : socketItems[i] ? '#8c9389' : '#b1b8ae'} />
      <BenchBox size={[.13, .007, .012]} position={[0, .034, .087]} color="#aeb8ad" radius={.004} />
    </group>)}
  </group>
}

export function WallOutlet({ status }: { status: RiskStatus }) {
  const statusColor = status === 'overload' ? '#b75e4f' : status === 'warning' ? '#c89d4d' : '#88a08c'
  return <group name="wall-outlet" position={[-2.72, 1.02, -.96]} rotation={[0, 0, 0]}>
    <BenchBox size={[.83, .37, .06]} color="#e7e2d6" radius={.045} roughness={.74} />
    <BenchBox size={[.74, .3, .025]} position={[0, 0, .038]} color="#f3efe4" radius={.035} roughness={.65} />
    {[-.2, .2].map(x => <group key={x} position={[x, 0, .055]}>
      <BenchBox size={[.22, .215, .012]} color="#deddd4" radius={.022} />
      <BenchBox size={[.11, .11, .009]} position={[0, 0, .011]} color="#c5c9bf" radius={.02} />
      {[-.026, .026].map(dx => <BenchBox key={dx} size={[.012, .038, .008]} position={[dx, -.005, .018]} color="#55625b" radius={.004} />)}
      <BenchCylinder position={[0, -.036, .019]} radius={.009} height={.006} color="#53615a" />
    </group>)}
    <BenchBox size={[.055, .085, .025]} position={[.31, -.105, .055]} color={statusColor} radius={.012} emissive={statusColor} emissiveIntensity={.28} />
    <BenchBox size={[.021, .008, .008]} position={[.31, -.105, .071]} color="#d6e0c9" radius={.003} />
  </group>
}

export function WallBackdrop() {
  return <group name="backdrop">
    <mesh position={[0, 2.15, -1.07]} receiveShadow><planeGeometry args={[12, 5.1]} /><meshStandardMaterial color="#d8d2c3" roughness={.94} /></mesh>
    <BenchBox size={[12, .08, .11]} position={[0, .045, -.98]} color="#b3a58e" radius={.018} roughness={.82} />
    <BenchBox size={[12, .035, .025]} position={[0, .02, -.91]} color="#e6ddca" radius={.006} />
    <BenchBox size={[12, .045, .025]} position={[0, 3.13, -.99]} color="#c6bcaa" radius={.012} />
  </group>
}
