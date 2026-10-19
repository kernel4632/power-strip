import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CatmullRomCurve3, Vector3 } from 'three'
import type { Group, Mesh } from 'three'
import { DEVICE_CATALOG, STRIP_POSITION } from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'
import { Box, Cylinder } from './Geometry'
import type { DeviceId } from '../types'

function Cable({ id, index }: { id: DeviceId; index: number }) {
  const device = DEVICE_CATALOG[index]
  const visible = usePowerStore((state) => state.energyFlow)
  const active = usePowerStore(
    (state) => state.masterOn && state.devices[id].on,
  )
  const particles = useRef<Group>(null)
  const [curve] = useState(() => {
    const start = new Vector3(
      STRIP_POSITION[0] - 0.55 + index * 0.15,
      STRIP_POSITION[1] + 0.05,
      STRIP_POSITION[2],
    )
    const end = new Vector3(...device.position).add(
      new Vector3(0, id === 'ac' ? -0.12 : 0.08, -0.1),
    )
    const mid = start.clone().lerp(end, 0.5)
    mid.z -= 0.3
    mid.y = Math.max(start.y, end.y) + (id === 'ac' ? 0.12 : 0.02)
    if (id === 'ac')
      return new CatmullRomCurve3([
        new Vector3(3.65, 1.35, -3.18),
        new Vector3(3.65, 2.9, -3.18),
        new Vector3(2.4, 3.02, -3.18),
        end,
      ])
    if (id === 'kettle' || id === 'fridge')
      return new CatmullRomCurve3([
        start,
        new Vector3(2.7, 1.23, -1.37),
        new Vector3(3.58, 1.19, -1.19),
        new Vector3(3.63, 0.3, -0.65),
        new Vector3(3.58, 0.18, 0.1),
        end,
      ])
    return new CatmullRomCurve3([
      start,
      start.clone().add(new Vector3(0, 0.03, -0.18)),
      mid,
      end,
    ])
  })
  const point = useRef(new Vector3())
  useFrame(({ clock }) => {
    if (!particles.current || !visible || !active) return
    const watts = usePowerStore.getState().devices[id].watts
    particles.current.children.forEach((child, i) => {
      curve.getPointAt(
        (clock.elapsedTime * (0.12 + watts / 7000) + i / 4) % 1,
        point.current,
      )
      child.position.copy(point.current)
    })
  })
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 28, 0.009, 5, false]} />
        <meshStandardMaterial color="#535a50" roughness={0.85} />
      </mesh>
      {visible && (
        <mesh>
          <tubeGeometry args={[curve, 28, 0.013, 5, false]} />
          <meshBasicMaterial
            color={device.color}
            transparent
            opacity={active ? 0.55 : 0.12}
            depthWrite={false}
          />
        </mesh>
      )}
      <group ref={particles} visible={visible && active}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshBasicMaterial color={device.color} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function PowerStrip() {
  const masterOn = usePowerStore((state) => state.masterOn)
  const flow = usePowerStore((state) => state.energyFlow)
  const select = usePowerStore((state) => state.select)
  const pulse = useRef<Mesh>(null)
  useFrame(({ clock }) => {
    if (pulse.current)
      pulse.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * 0.04)
  })
  return (
    <group>
      {DEVICE_CATALOG.map((device, index) => (
        <Cable key={device.id} id={device.id} index={index} />
      ))}
      <group
        position={STRIP_POSITION}
        onClick={(event) => {
          event.stopPropagation()
          if (event.delta < 5) select('strip')
        }}
      >
        <Box size={[1.48, 0.09, 0.22]} color="#eee8d8" round={0.025} />
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i} position={[-0.53 + i * 0.185, 0.05, 0]}>
            <Box size={[0.15, 0.006, 0.15]} color="#d4d4c6" round={0.002} />
            {[-0.028, 0.028].map((x) => (
              <Box
                key={x}
                size={[0.012, 0.005, 0.035]}
                position={[x, 0.006, 0]}
                color="#4a544b"
              />
            ))}
            <Box
              size={[0.07, 0.035, 0.07]}
              position={[0, 0.023, -0.02]}
              color="#747e71"
              round={0.007}
            />
          </group>
        ))}
        <Box
          size={[0.12, 0.013, 0.11]}
          position={[0.62, 0.05, 0]}
          color={masterOn ? '#b68058' : '#9d9e8e'}
          emissive="#efb077"
          intensity={masterOn ? 0.8 : 0}
          round={0.005}
        />
        <Cylinder
          radius={0.008}
          height={0.008}
          position={[0.52, 0.053, 0.06]}
          color={masterOn ? '#8caf8e' : '#8a8b7f'}
        />
        {flow && (
          <mesh
            ref={pulse}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.003, 0]}
          >
            <ringGeometry args={[0.84, 0.855, 60]} />
            <meshBasicMaterial
              color="#c48b59"
              transparent
              opacity={0.45}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>
    </group>
  )
}
