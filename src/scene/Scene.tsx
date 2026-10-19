import { ContactShadows, OrbitControls, RoundedBox } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Appliance } from './Appliance'
import { PowerStrip } from './PowerStrip'
import { APPLIANCE_HOVER, OUTLET_HEIGHT, socketX } from './layout'
import type { Outlet } from '../types'

interface SceneProps {
  outlets: Outlet[]
  selectedId: number | null
  onSelect: (id: number) => void
  onToggle: (id: number) => void
}

function Desk() {
  return (
    <group position={[0, -OUTLET_HEIGHT / 2, 0]}>
      <RoundedBox args={[12, 0.2, 8]} radius={0.05} smoothness={4} receiveShadow>
        <meshStandardMaterial color="#1a1f2b" roughness={0.9} />
      </RoundedBox>
    </group>
  )
}

function SceneContent({ outlets, selectedId, onSelect, onToggle }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#c9d6ff', '#1a1f2b', 0.6]} />
      <directionalLight
        position={[6, 10, 6]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <Desk />
      <PowerStrip
        outlets={outlets}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      {outlets.map((outlet, index) => {
        if (!outlet.appliance) return null
        const baseY = OUTLET_HEIGHT + APPLIANCE_HOVER[outlet.appliance.kind]
        return (
          <Appliance
            key={outlet.id}
            spec={outlet.appliance}
            on={outlet.on}
            x={socketX(index, outlets.length)}
            baseY={baseY}
            onToggle={() => onToggle(outlet.id)}
          />
        )
      })}
      <ContactShadows
        position={[0, 0.11, 0]}
        opacity={0.5}
        scale={20}
        blur={2.5}
        far={6}
      />
      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={16}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 0.6, 0]}
      />
    </>
  )
}

export function Scene(props: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 4.5, 7.5], fov: 45 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0b0e14']} />
      <fog attach="fog" args={['#0b0e14', 14, 30]} />
      <SceneContent {...props} />
    </Canvas>
  )
}
