import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { Group, Mesh } from 'three'
import { DEVICE_MAP } from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'
import type { DeviceId } from '../types'
import { Box, Cylinder, Ring, Rod, Sphere } from './Geometry'
import { StaticGeometry } from './StaticGeometry'

function Screen({
  kind,
  width,
  height,
  on,
}: {
  kind: 'monitor' | 'laptop' | 'phone'
  width: number
  height: number
  on: boolean
}) {
  const [texture] = useState(() => {
    const canvas = document.createElement('canvas')
    canvas.width = kind === 'phone' ? 256 : 768
    canvas.height = kind === 'phone' ? 512 : 432
    const context = canvas.getContext('2d')!
    const gradient = context.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height,
    )
    gradient.addColorStop(0, kind === 'laptop' ? '#263d4e' : '#32685e')
    gradient.addColorStop(1, '#102c31')
    context.fillStyle = gradient
    context.fillRect(0, 0, canvas.width, canvas.height)
    if (kind === 'phone') {
      context.fillStyle = '#efeedb'
      context.font = '58px sans-serif'
      context.fillText('09:41', 45, 150)
      context.font = '18px sans-serif'
      context.fillText('A little more present.', 24, 188)
      context.strokeStyle = '#87d1a9'
      context.lineWidth = 10
      context.beginPath()
      context.arc(128, 339, 51, 0, Math.PI * 1.7)
      context.stroke()
      context.font = '26px sans-serif'
      context.fillText('78%', 102, 349)
    } else {
      context.fillStyle = '#ffffff16'
      context.fillRect(22, 22, 724, 34)
      ;['#da8c77', '#dcc28c', '#a3cba8'].forEach((color, i) => {
        context.fillStyle = color
        context.beginPath()
        context.arc(42 + i * 20, 39, 5, 0, 7)
        context.fill()
      })
      context.font = '15px monospace'
      context.fillStyle = '#a5c5bd'
      context.fillText(
        kind === 'monitor'
          ? 'DORM LAB  /  ENERGY STUDIO'
          : 'WORKSPACE  /  DESIGN NOTES',
        139,
        44,
      )
      context.fillStyle = '#f3ecd8'
      context.font = '46px sans-serif'
      context.fillText(
        kind === 'monitor' ? 'Make room for ideas.' : 'Less, but better.',
        44,
        128,
      )
      context.fillStyle = '#a7c7ba'
      context.font = '17px monospace'
      context.fillText('A SPACE TO LEARN. A PLACE TO BELONG.', 46, 163)
      for (let i = 0; i < 3; i++) {
        context.fillStyle = '#dcecd311'
        context.fillRect(44 + i * 233, 201, 211, 160)
        context.fillStyle = ['#b7d0b4', '#e3b694', '#92c7cd'][i]
        context.font = '34px sans-serif'
        context.fillText(['CREATE', 'FOCUS', 'GROW'][i], 61 + i * 233, 249)
        for (let j = 0; j < 9; j++)
          context.fillRect(
            61 + i * 233 + j * 18,
            329 - Math.sin(j * 0.65 + i) * 16 - j * 5,
            10,
            16 + Math.sin(j * 0.65 + i) * 16 + j * 5,
          )
      }
      context.font = '13px monospace'
      context.fillStyle = '#92afa6'
      context.fillText('GOOD THINGS TAKE A LITTLE SPACE.', 46, 400)
    }
    const map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    return map
  })
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color={on ? '#ffffff' : '#172220'}
        map={on ? texture : null}
        emissiveMap={on ? texture : null}
        emissive={on ? '#ffffff' : '#000000'}
        emissiveIntensity={on ? 0.65 : 0}
        roughness={0.35}
      />
    </mesh>
  )
}

function Monitor({ on }: { on: boolean }) {
  return (
    <group>
      <Box
        size={[0.41, 0.04, 0.29]}
        position={[0, 0.03, 0]}
        color="#868d85"
        round={0.015}
        metalness={0.65}
      />
      <Box
        size={[0.09, 0.25, 0.06]}
        position={[0, 0.17, -0.02]}
        color="#818b84"
        metalness={0.7}
      />
      <group position={[0, 0.57, 0]} rotation={[-0.05, 0, 0]}>
        <Box
          size={[1.1, 0.66, 0.065]}
          color="#4b5651"
          round={0.025}
          metalness={0.45}
        />
        <group position={[0, 0.015, 0.034]}>
          <Screen kind="monitor" width={1.045} height={0.575} on={on} />
        </group>
        <Box
          size={[0.018, 0.004, 0.004]}
          position={[0.47, -0.296, 0.035]}
          color={on ? '#9be7ce' : '#777c70'}
          emissive="#9be7ce"
          intensity={on ? 1.5 : 0}
        />
        <Sphere
          position={[0, 0.311, 0.034]}
          scale={[0.009, 0.009, 0.004]}
          color="#202a27"
        />
      </group>
    </group>
  )
}

function Laptop({ on }: { on: boolean }) {
  return (
    <group rotation={[0, -0.14, 0]}>
      <Box
        size={[0.77, 0.03, 0.52]}
        position={[0, 0.025, 0]}
        color="#a6b2ac"
        round={0.012}
        metalness={0.6}
      />
      <Box
        size={[0.24, 0.003, 0.15]}
        position={[0, 0.042, 0.12]}
        color="#8e9c95"
        round={0.001}
      />
      {Array.from({ length: 4 }, (_, row) =>
        Array.from({ length: 11 }, (_, col) => (
          <Box
            key={`${row}-${col}`}
            size={[0.047, 0.003, 0.038]}
            position={[-0.3 + col * 0.059, 0.044, -0.17 + row * 0.05]}
            color="#35423d"
            emissive={on ? '#698d85' : '#000000'}
            intensity={0.25}
          />
        )),
      )}
      <group position={[0, 0.26, -0.25]} rotation={[-0.2, 0, 0]}>
        <Box
          size={[0.77, 0.46, 0.025]}
          color="#84948b"
          round={0.012}
          metalness={0.6}
        />
        <group position={[0, 0.006, 0.014]}>
          <Screen kind="laptop" width={0.715} height={0.4} on={on} />
        </group>
      </group>
    </group>
  )
}

function Lamp({ on, level }: { on: boolean; level: number }) {
  return (
    <group>
      <Cylinder
        radius={0.16}
        height={0.035}
        position={[0, 0.025, 0]}
        color="#d8cbb2"
        metalness={0.25}
      />
      <Rod
        from={[0, 0.04, 0]}
        to={[0.04, 0.39, -0.04]}
        radius={0.023}
        color="#c0a276"
      />
      <Sphere
        position={[0.04, 0.39, -0.04]}
        scale={[0.045, 0.045, 0.045]}
        color="#8e7a59"
      />
      <Rod
        from={[0.04, 0.39, -0.04]}
        to={[-0.16, 0.68, 0.04]}
        radius={0.02}
        color="#c0a276"
      />
      <group position={[-0.16, 0.65, 0.04]} rotation={[0, 0, 0.24]}>
        <Cylinder radius={0.19} top={0.08} height={0.17} color="#e0c99c" />
        <mesh position={[0, -0.087, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.175, 32]} />
          <meshStandardMaterial
            color={on ? '#fff3cf' : '#b5a78e'}
            emissive="#ffdb92"
            emissiveIntensity={on ? 2.5 * level : 0}
          />
        </mesh>
      </group>
      <pointLight
        position={[-0.16, 0.5, 0.08]}
        color="#ffd298"
        intensity={on ? level * 1.9 : 0}
        distance={3}
        decay={2}
      />
      <Box
        size={[0.035, 0.006, 0.055]}
        position={[0.06, 0.046, 0.02]}
        color="#937d59"
        round={0.002}
      />
    </group>
  )
}

function Fan({ on, level }: { on: boolean; level: number }) {
  const blades = useRef<Group>(null)
  const head = useRef<Group>(null)
  const speed = useRef(0)
  useFrame(({ clock, invalidate }, delta) => {
    const dt = Math.min(delta, 0.1)
    speed.current +=
      ((on ? 24 * level : 0) - speed.current) * (1 - Math.exp(-dt * 2))
    if (blades.current) blades.current.rotation.z -= speed.current * dt
    if (
      !on &&
      speed.current > 0.03 &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      invalidate()
    if (head.current && on)
      head.current.rotation.y = Math.sin(clock.elapsedTime * 0.55) * 0.22
  })
  return (
    <group>
      <Cylinder
        radius={0.16}
        height={0.04}
        position={[0, 0.035, 0]}
        color="#b5bfad"
      />
      <Rod
        from={[0, 0.05, 0]}
        to={[0, 0.4, 0]}
        radius={0.035}
        color="#9da99a"
      />
      <group ref={head} position={[0, 0.48, 0]}>
        <Cylinder
          radius={0.08}
          height={0.15}
          rotation={[Math.PI / 2, 0, 0]}
          color="#9caa9b"
        />
        <Ring
          radius={0.24}
          tube={0.015}
          position={[0, 0, 0.07]}
          color="#d4ddc9"
        />
        {[0.08, 0.14, 0.19, 0.24].map((r) => (
          <Ring
            key={r}
            radius={r}
            tube={0.004}
            position={[0, 0, 0.113]}
            color="#7a8b7c"
          />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6
          return (
            <Rod
              key={i}
              from={[0, 0, 0.12]}
              to={[Math.cos(a) * 0.235, Math.sin(a) * 0.235, 0.08]}
              radius={0.0035}
              color="#849883"
            />
          )
        })}
        <group ref={blades} position={[0, 0, 0.06]}>
          {Array.from({ length: 3 }, (_, i) => (
            <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
              <Sphere
                position={[0.04, 0.11, 0]}
                scale={[0.09, 0.12, 0.012]}
                color="#9bb6aa"
              />
            </group>
          ))}
        </group>
        <Cylinder
          radius={0.045}
          height={0.02}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, 0.133]}
          color="#c4ceb9"
        />
      </group>
    </group>
  )
}

function Phone({ on }: { on: boolean }) {
  return (
    <group rotation={[0, -0.25, 0]}>
      <Cylinder
        radius={0.14}
        height={0.025}
        position={[0, 0.02, 0]}
        color="#9faba1"
        metalness={0.4}
      />
      <group position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Box size={[0.14, 0.285, 0.015]} color="#343e39" round={0.006} />
        <group position={[0, 0, 0.009]}>
          <Screen kind="phone" width={0.125} height={0.26} on={on} />
        </group>
        <Box
          size={[0.045, 0.009, 0.002]}
          position={[0, 0.117, 0.012]}
          color="#172b27"
          round={0.001}
        />
      </group>
    </group>
  )
}

function Steam({ on }: { on: boolean }) {
  const group = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.children.forEach((child, i) => {
      const phase = (clock.elapsedTime * 0.3 + i / 7) % 1
      child.position.set(
        Math.sin(phase * 8 + i) * phase * 0.11,
        phase * 0.75,
        Math.cos(phase * 6 + i) * 0.04,
      )
      child.scale.setScalar(0.035 + phase * 0.085)
      const mesh = child as Mesh
      if ('opacity' in mesh.material)
        mesh.material.opacity = on ? Math.sin(phase * Math.PI) * 0.14 : 0
    })
  })
  return (
    <group ref={group} position={[0, 0.57, 0]}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshBasicMaterial
            color="#fff9e9"
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function Kettle({ on }: { on: boolean }) {
  return (
    <group>
      <Cylinder
        radius={0.23}
        height={0.04}
        position={[0, 0.02, 0]}
        color="#4e5d54"
      />
      <Cylinder
        radius={0.2}
        top={0.155}
        height={0.38}
        position={[0, 0.23, 0]}
        color="#e3dbc9"
        roughness={0.3}
        metalness={0.35}
      />
      <Cylinder
        radius={0.157}
        height={0.035}
        position={[0, 0.44, 0]}
        color="#889284"
        metalness={0.5}
      />
      <Sphere
        position={[0, 0.48, 0]}
        scale={[0.045, 0.035, 0.045]}
        color="#5c675b"
      />
      <group position={[0.21, 0.25, 0]} rotation={[0, Math.PI / 2, 0]}>
        <Ring radius={0.155} tube={0.025} color="#7f8b79" />
      </group>
      <Cylinder
        radius={0.04}
        top={0.025}
        height={0.22}
        position={[-0.19, 0.32, 0]}
        rotation={[0, 0, -0.7]}
        color="#d4cbb8"
        metalness={0.4}
      />
      <Box
        size={[0.035, 0.17, 0.008]}
        position={[0, 0.24, 0.192]}
        color="#9bb3ae"
        round={0.003}
      />
      <Box
        size={[0.06, 0.015, 0.01]}
        position={[0, 0.065, 0.195]}
        color={on ? '#ecac6c' : '#7e877b'}
        emissive="#ffb168"
        intensity={on ? 2 : 0}
      />
      <Steam on={on} />
    </group>
  )
}

function Fridge({ on }: { on: boolean }) {
  return (
    <group>
      <Box
        size={[0.84, 1.2, 0.84]}
        position={[0, 0.62, 0]}
        color="#c1ccbb"
        round={0.055}
        metalness={0.14}
      />
      <Box
        size={[0.77, 0.36, 0.075]}
        position={[0, 1, 0.445]}
        color="#d2d8c9"
        round={0.025}
      />
      <Box
        size={[0.77, 0.73, 0.075]}
        position={[0, 0.43, 0.445]}
        color="#d2d8c9"
        round={0.025}
      />
      {[0.89, 0.7].map((y) => (
        <Box
          key={y}
          size={[0.025, 0.11, 0.035]}
          position={[-0.29, y, 0.494]}
          color="#8f9d89"
          round={0.006}
          metalness={0.6}
        />
      ))}
      <Box
        size={[0.14, 0.14, 0.004]}
        position={[0.13, 0.92, 0.488]}
        rotation={[0, 0, 0.12]}
        color="#d0a173"
      />
      <Box
        size={[0.12, 0.1, 0.005]}
        position={[0.13, 0.92, 0.492]}
        rotation={[0, 0, 0.12]}
        color="#7e9e8d"
      />
      <Box
        size={[0.018, 0.018, 0.008]}
        position={[0.29, 1.11, 0.49]}
        color={on ? '#91c899' : '#8c9382'}
        emissive="#91c899"
        intensity={on ? 1 : 0}
      />
      {Array.from({ length: 8 }, (_, i) => (
        <Box
          key={i}
          size={[0.005, 0.14, 0.44]}
          position={[0.424, 0.17, -0.16 + i * 0.04]}
          color="#96a38f"
        />
      ))}
    </group>
  )
}

function AirConditioner({ on }: { on: boolean }) {
  const air = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (air.current)
      air.current.children.forEach((child, i) => {
        const phase = (clock.elapsedTime * 0.35 + i * 0.22) % 1
        child.position.y = -0.3 - phase * 0.8
        child.position.z = phase * 0.45
        child.scale.y = Math.sin(phase * Math.PI)
      })
  })
  return (
    <group>
      <Box size={[1.65, 0.43, 0.34]} color="#e8e8dc" round={0.055} />
      <Box
        size={[1.43, 0.045, 0.075]}
        position={[0, -0.16, 0.17]}
        color="#788b7f"
        round={0.008}
      />
      <Box
        size={[1.38, 0.018, 0.1]}
        position={[0, -0.16, 0.21]}
        rotation={[on ? -0.35 : 0, 0, 0]}
        color="#d3dbce"
      />
      <Box
        size={[0.1, 0.035, 0.005]}
        position={[0.59, 0.035, 0.176]}
        color={on ? '#b0d7c4' : '#c1ccc0'}
        emissive="#b0e5c8"
        intensity={on ? 0.8 : 0}
      />
      <group ref={air} visible={on}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-0.54 + i * 0.36, -0.4, 0.15]}>
            <capsuleGeometry args={[0.008, 0.23, 3, 5]} />
            <meshBasicMaterial
              color="#c1e5e0"
              transparent
              opacity={0.3}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function Appliance({ id }: { id: DeviceId }) {
  const spec = DEVICE_MAP[id]
  const on = usePowerStore((state) => state.devices[id].on)
  const level = usePowerStore((state) => state.devices[id].level)
  const masterOn = usePowerStore((state) => state.masterOn)
  const selected = usePowerStore((state) => state.selected === id)
  const select = usePowerStore((state) => state.select)
  const [hovered, setHovered] = useState(false)
  const active = masterOn && on
  useEffect(() => {
    if (hovered) document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])
  return (
    <group
      position={spec.position}
      onClick={(event) => {
        event.stopPropagation()
        if (event.delta < 5) select(id)
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      {id === 'monitor' && (
        <StaticGeometry revision={active}>
          <Monitor on={active} />
        </StaticGeometry>
      )}
      {id === 'laptop' && (
        <StaticGeometry revision={active}>
          <Laptop on={active} />
        </StaticGeometry>
      )}
      {id === 'lamp' && <Lamp on={active} level={level} />}
      {id === 'fan' && <Fan on={active} level={level} />}
      {id === 'phone' && <Phone on={active} />}
      {id === 'kettle' && <Kettle on={active} />}
      {id === 'fridge' && (
        <StaticGeometry revision={active}>
          <Fridge on={active} />
        </StaticGeometry>
      )}
      {id === 'ac' && <AirConditioner on={active} />}
      {(hovered || selected) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
          <ringGeometry
            args={[
              id === 'fridge' ? 0.52 : 0.31,
              id === 'fridge' ? 0.535 : 0.322,
              64,
            ]}
          />
          <meshBasicMaterial
            color="#e2a774"
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
