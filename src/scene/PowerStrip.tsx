import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { Outlet } from '../types'
import { OUTLET_HEIGHT, SPACING, socketX } from './layout'

interface PowerStripProps {
  outlets: Outlet[]
  selectedId: number | null
  onSelect: (id: number) => void
}

function Socket({
  outlet,
  x,
  selected,
  onSelect,
}: {
  outlet: Outlet
  x: number
  selected: boolean
  onSelect: (id: number) => void
}) {
  const active = outlet.on && outlet.appliance !== null

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    onSelect(outlet.id)
  }

  return (
    <group position={[x, 0, 0]} onClick={handleClick}>
      <mesh position={[0, OUTLET_HEIGHT / 2 + 0.02, 0]}>
        <boxGeometry args={[0.66, 0.06, 0.66]} />
        <meshStandardMaterial
          color={selected ? '#5b8cff' : '#1c212b'}
          emissive={active ? '#3ecf8e' : '#000000'}
          emissiveIntensity={active ? 0.35 : 0}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[-0.12, OUTLET_HEIGHT / 2 + 0.05, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 12]} />
        <meshStandardMaterial color="#0a0c10" />
      </mesh>
      <mesh position={[0.12, OUTLET_HEIGHT / 2 + 0.05, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.04, 12]} />
        <meshStandardMaterial color="#0a0c10" />
      </mesh>
    </group>
  )
}

export function PowerStrip({ outlets, selectedId, onSelect }: PowerStripProps) {
  const length = useMemo(() => outlets.length * SPACING + 0.5, [outlets.length])

  return (
    <group>
      <RoundedBox
        args={[length, OUTLET_HEIGHT, 1.5]}
        radius={0.12}
        smoothness={4}
        position={[0, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#f2f4f8" roughness={0.35} metalness={0.1} />
      </RoundedBox>
      {outlets.map((outlet, index) => (
        <Socket
          key={outlet.id}
          outlet={outlet}
          x={socketX(index, outlets.length)}
          selected={outlet.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}
