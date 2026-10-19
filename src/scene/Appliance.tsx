import { useRef, useState } from 'react'
import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { ApplianceSpec } from '../types'

interface ApplianceProps {
  spec: ApplianceSpec
  on: boolean
  x: number
  baseY: number
  onToggle: () => void
}

function Body({ spec }: { spec: ApplianceSpec }) {
  const material = (
    <meshStandardMaterial
      color={spec.color}
      roughness={0.4}
      metalness={0.15}
    />
  )

  switch (spec.kind) {
    case 'laptop':
      return (
        <RoundedBox args={[0.7, 0.06, 0.5]} radius={0.03} smoothness={4}>
          {material}
        </RoundedBox>
      )
    case 'monitor':
      return (
        <group>
          <RoundedBox args={[0.7, 0.42, 0.05]} radius={0.03} smoothness={4}>
            {material}
          </RoundedBox>
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.18, 12]} />
            {material}
          </mesh>
          <mesh position={[0, -0.38, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.03, 20]} />
            {material}
          </mesh>
        </group>
      )
    case 'kettle':
      return (
        <group>
          <mesh>
            <cylinderGeometry args={[0.24, 0.22, 0.5, 24]} />
            {material}
          </mesh>
          <mesh position={[0.25, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.12, 0.03, 12, 24, Math.PI]} />
            {material}
          </mesh>
        </group>
      )
    case 'lamp':
      return (
        <group>
          <mesh>
            <coneGeometry args={[0.24, 0.3, 24, 1, true]} />
            {material}
          </mesh>
          <mesh position={[0, 0.24, 0]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            {material}
          </mesh>
        </group>
      )
    case 'fridge':
      return (
        <RoundedBox args={[0.6, 0.85, 0.55]} radius={0.05} smoothness={4}>
          {material}
        </RoundedBox>
      )
    case 'phone':
      return (
        <RoundedBox args={[0.18, 0.34, 0.03]} radius={0.03} smoothness={4}>
          {material}
        </RoundedBox>
      )
  }
}

export function Appliance({ spec, on, x, baseY, onToggle }: ApplianceProps) {
  const group = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    if (!group.current) return
    const bob = on ? Math.sin(state.clock.elapsedTime * 2 + x) * 0.03 : 0
    const target = baseY + bob + (hovered ? 0.08 : 0)
    group.current.position.y += (target - group.current.position.y) * delta * 8
    group.current.rotation.y += delta * (on ? 0.4 : 0.05)
  })

  const glow = on ? Math.min(1.6, 0.3 + spec.ratedWatts / 900) : 0

  return (
    <group
      ref={group}
      position={[x, baseY, 0]}
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      <Body spec={spec} />
      {on && <pointLight color={spec.color} intensity={glow} distance={3} />}
    </group>
  )
}
