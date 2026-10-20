import { RoundedBox } from '@react-three/drei'
import { Quaternion, Vector3 } from 'three'
import type { Point3 } from '../types'
import { surfaceMaps } from './materials'
import type { Surface } from './materials'

interface ShapeProps {
  position?: Point3
  rotation?: Point3
  color?: string
  roughness?: number
  metalness?: number
  emissive?: string
  intensity?: number
  surface?: Surface
}

export function Box({
  size,
  position,
  rotation,
  color = '#ddd4c2',
  round = 0,
  roughness = 0.65,
  metalness = 0,
  emissive = '#000000',
  intensity = 0,
  surface,
}: ShapeProps & { size: Point3; round?: number }) {
  const maps = surface ? surfaceMaps(surface) : null
  const material = (
    <meshStandardMaterial
      color={color}
      roughness={roughness}
      metalness={metalness}
      emissive={emissive}
      emissiveIntensity={intensity}
      map={maps?.map}
      normalMap={maps?.normalMap}
      normalScale={
        maps ? [maps.normalScale, maps.normalScale] : undefined
      }
      roughnessMap={maps?.roughnessMap}
    />
  )
  return round > 0 ? (
    <RoundedBox
      args={size}
      radius={round}
      smoothness={2}
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      {material}
    </RoundedBox>
  ) : (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      {material}
    </mesh>
  )
}

export function Cylinder({
  position,
  rotation,
  color = '#ccc6ba',
  radius = 0.1,
  top,
  height = 0.2,
  metalness = 0,
  roughness = 0.6,
}: ShapeProps & { radius?: number; top?: number; height?: number }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[top ?? radius, radius, height, 24]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
      />
    </mesh>
  )
}

export function Rod({
  from,
  to,
  radius = 0.018,
  color = '#393f3d',
}: {
  from: Point3
  to: Point3
  radius?: number
  color?: string
}) {
  const start = new Vector3(...from)
  const end = new Vector3(...to)
  const direction = end.clone().sub(start)
  const rotation = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    direction.clone().normalize(),
  )
  return (
    <mesh
      position={start.add(end).multiplyScalar(0.5)}
      quaternion={rotation}
      castShadow
    >
      <cylinderGeometry args={[radius, radius, direction.length(), 10]} />
      <meshStandardMaterial color={color} roughness={0.48} metalness={0.25} />
    </mesh>
  )
}

export function Sphere({
  position,
  scale = [1, 1, 1],
  color = '#769079',
}: ShapeProps & { scale?: Point3 }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  )
}

export function Ring({
  position,
  rotation,
  radius = 0.2,
  tube = 0.012,
  color = '#48514e',
}: ShapeProps & { radius?: number; tube?: number }) {
  return (
    <mesh position={position} rotation={rotation} castShadow>
      <torusGeometry args={[radius, tube, 8, 40]} />
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.3} />
    </mesh>
  )
}
