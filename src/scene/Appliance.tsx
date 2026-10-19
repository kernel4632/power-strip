import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { Group, Mesh, MeshBasicMaterial } from 'three'
import { DEVICE_MAP, STATION_MAP } from '../data/catalog'
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
  kind: 'monitor' | 'laptop' | 'tablet' | 'phone'
  width: number
  height: number
  on: boolean
}) {
  const [texture] = useState(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 768
    canvas.height = kind === 'phone' ? 1200 : 460
    const c = canvas.getContext('2d')!
    const gradient = c.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#314d58')
    gradient.addColorStop(1, '#142d37')
    c.fillStyle = gradient
    c.fillRect(0, 0, canvas.width, canvas.height)
    c.fillStyle = '#edf2e2'
    c.font = '28px sans-serif'
    c.fillText('ROOM 302 / PERSONAL WORKSPACE', 35, 53)
    if (kind === 'phone') {
      c.font = '140px sans-serif'
      c.fillText('09:41', 160, 330)
      c.font = '34px sans-serif'
      c.fillText('MAKE YOURSELF AT HOME', 130, 410)
      c.strokeStyle = '#a9d5bc'
      c.lineWidth = 20
      c.beginPath()
      c.arc(384, 780, 160, 0, 5.4)
      c.stroke()
      c.font = '70px sans-serif'
      c.fillText('78%', 317, 805)
    } else if (kind === 'tablet') {
      c.fillStyle = '#d8d5c6'
      c.fillRect(85, 85, 590, 320)
      c.fillStyle = '#7b968e'
      c.beginPath()
      c.moveTo(200, 310)
      c.lineTo(385, 130)
      c.lineTo(566, 313)
      c.closePath()
      c.fill()
      c.fillStyle = '#bc8e76'
      c.fillRect(291, 249, 190, 102)
      c.fillStyle = '#efe8d5'
      c.fillRect(330, 270, 41, 80)
      c.font = '18px monospace'
      c.fillStyle = '#cad7ce'
      c.fillText('CONCEPT STUDY / 004', 250, 440)
    } else {
      c.fillStyle = '#132732'
      c.fillRect(25, 83, 163, 340)
      c.fillStyle = '#99beb5'
      c.font = '18px monospace'
      ;['Workspace', 'Projects', 'Research', 'Notes', 'Assets'].forEach(
        (t, i) => c.fillText(t, 45, 120 + i * 51),
      )
      c.fillStyle = '#f1edda'
      c.font = '38px sans-serif'
      c.fillText(
        kind === 'monitor'
          ? 'Build something good.'
          : 'A quieter kind of focus.',
        213,
        145,
      )
      c.font = '18px monospace'
      c.fillStyle = '#a9c4b8'
      c.fillText('DESIGN / LEARN / EXPLORE', 214, 183)
      for (let i = 0; i < 3; i++) {
        c.fillStyle = ['#819c91', '#c1a384', '#839da9'][i]
        c.fillRect(214 + i * 171, 225, 148, 110)
        c.fillStyle = '#d6e0d7'
        c.fillRect(214 + i * 171, 351, 130, 5)
        c.fillRect(214 + i * 171, 369, 95, 4)
      }
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
        map={on ? texture : null}
        color={on ? '#ffffff' : '#152026'}
        emissiveMap={on ? texture : null}
        emissive={on ? '#ffffff' : '#000000'}
        emissiveIntensity={0.45}
        roughness={0.4}
      />
    </mesh>
  )
}
function Monitor({ on }: { on: boolean }) {
  return (
    <group>
      <StaticGeometry revision={on}>
        <Box
          size={[0.4, 0.035, 0.27]}
          position={[0, 0.0175, 0]}
          color="#9aaba6"
          round={0.012}
          metalness={0.6}
        />
        <Box
          size={[0.075, 0.28, 0.06]}
          position={[0, 0.16, -0.02]}
          color="#8a9b95"
          round={0.009}
          metalness={0.5}
        />
        <Box
          size={[1.1, 0.64, 0.065]}
          position={[0, 0.585, -0.02]}
          color="#3f4b4b"
          round={0.02}
          metalness={0.2}
        />
        <Box
          size={[0.95, 0.035, 0.035]}
          position={[0, 0.301, 0.022]}
          color="#596b67"
        />
        <Sphere
          position={[0, 0.887, 0.015]}
          scale={[0.006, 0.006, 0.004]}
          color="#182426"
        />
        <Box
          size={[0.018, 0.005, 0.004]}
          position={[0.477, 0.296, 0.018]}
          color={on ? '#a8dfc0' : '#6e7770'}
          emissive="#9bd5bc"
          intensity={on ? 1 : 0}
        />
        {Array.from({ length: 12 }, (_, i) => (
          <Box
            key={i}
            size={[0.032, 0.035, 0.003]}
            position={[-0.36 + i * 0.065, 0.76, -0.054]}
            color="#263a35"
          />
        ))}
      </StaticGeometry>
      <group position={[0, 0.601, 0.0135]}>
        <Screen kind="monitor" width={1.045} height={0.558} on={on} />
      </group>
    </group>
  )
}
function Laptop({ on }: { on: boolean }) {
  return (
    <group>
      <StaticGeometry revision={0}>
        <Box
          size={[0.77, 0.026, 0.52]}
          position={[0, 0.013, 0]}
          color="#aebbb8"
          round={0.011}
          metalness={0.6}
        />
        <Box
          size={[0.24, 0.001, 0.145]}
          position={[0, 0.027, 0.126]}
          color="#8b9c97"
          round={0.0005}
        />
        {Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 11 }, (_, c) => (
            <Box
              key={`${r}-${c}`}
              size={[0.047, 0.002, 0.035]}
              position={[-0.295 + c * 0.059, 0.028, -0.175 + r * 0.049]}
              color="#344842"
              round={0.001}
            />
          )),
        )}
        <Cylinder
          radius={0.015}
          height={0.62}
          rotation={[0, 0, Math.PI / 2]}
          position={[0, 0.029, -0.238]}
          color="#80968c"
          metalness={0.6}
        />
        {[-0.16, -0.08].map((z) => (
          <Box
            key={z}
            size={[0.002, 0.009, 0.035]}
            position={[0.386, 0.014, z]}
            color="#2f423e"
          />
        ))}
      </StaticGeometry>
      <group position={[0, 0.032, -0.238]} rotation={[-0.13, 0, 0]}>
        <Box
          size={[0.77, 0.455, 0.018]}
          position={[0, 0.2275, 0]}
          color="#8c9e96"
          round={0.008}
          metalness={0.5}
        />
        <group position={[0, 0.237, 0.0095]}>
          <Screen kind="laptop" width={0.723} height={0.399} on={on} />
        </group>
        <Sphere
          position={[0, 0.444, 0.01]}
          scale={[0.004, 0.004, 0.002]}
          color="#21342e"
        />
      </group>
    </group>
  )
}
function Lamp({ on, level }: { on: boolean; level: number }) {
  return (
    <group>
      <Cylinder
        radius={0.155}
        height={0.035}
        position={[0, 0.0175, 0]}
        color="#d6c7a8"
        metalness={0.3}
      />
      <Rod
        from={[0, 0.035, 0]}
        to={[0.03, 0.39, -0.03]}
        radius={0.019}
        color="#ab9e79"
      />
      <Sphere
        position={[0.03, 0.39, -0.03]}
        scale={[0.037, 0.037, 0.037]}
        color="#9c8e6d"
      />
      <Rod
        from={[0.03, 0.39, -0.03]}
        to={[-0.13, 0.65, 0.03]}
        radius={0.017}
        color="#b7a781"
      />
      <Cylinder
        radius={0.18}
        top={0.065}
        height={0.15}
        position={[-0.13, 0.65, 0.03]}
        color="#d9caab"
      />
      <mesh position={[-0.13, 0.573, 0.03]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.166, 32]} />
        <meshStandardMaterial
          color="#fff0cf"
          emissive="#ffdf9d"
          emissiveIntensity={on ? level * 2 : 0}
        />
      </mesh>
      <Box
        size={[0.04, 0.005, 0.045]}
        position={[0.05, 0.037, 0.035]}
        color="#9b906f"
        round={0.002}
      />
      <pointLight
        position={[-0.13, 0.48, 0.03]}
        color="#ffe0ad"
        intensity={on ? level * 0.55 : 0}
        distance={1.4}
      />
    </group>
  )
}
function Fan({ on, level }: { on: boolean; level: number }) {
  const blades = useRef<Group>(null),
    head = useRef<Group>(null),
    speed = useRef(0)
  useFrame(({ clock, invalidate }, delta) => {
    const dt = Math.min(delta, 0.1)
    speed.current +=
      ((on ? level * 23 : 0) - speed.current) * (1 - Math.exp(-dt * 2))
    if (blades.current) blades.current.rotation.z -= speed.current * dt
    if (head.current && on)
      head.current.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.16
    if (!on && speed.current > 0.05) invalidate()
  })
  return (
    <group>
      <Cylinder
        radius={0.155}
        height={0.035}
        position={[0, 0.0175, 0]}
        color="#b5c6b8"
      />
      <Rod
        from={[0, 0.035, 0]}
        to={[0, 0.43, 0]}
        radius={0.028}
        color="#98ae9f"
      />
      <group ref={head} position={[0, 0.47, 0]}>
        <Cylinder
          radius={0.065}
          height={0.12}
          position={[0, 0, -0.015]}
          rotation={[Math.PI / 2, 0, 0]}
          color="#91aa9a"
        />
        <Ring
          radius={0.24}
          tube={0.012}
          position={[0, 0, 0.06]}
          color="#8aa18f"
        />
        <Ring
          radius={0.235}
          tube={0.009}
          position={[0, 0, -0.07]}
          color="#8aa18f"
        />
        {[0.09, 0.14, 0.19, 0.235].map((r) => (
          <Ring
            key={r}
            radius={r}
            tube={0.0035}
            position={[0, 0, 0.099]}
            color="#7c9480"
          />
        ))}
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i * Math.PI) / 8
          return (
            <Rod
              key={i}
              from={[0, 0, 0.106]}
              to={[Math.cos(a) * 0.234, Math.sin(a) * 0.234, 0.064]}
              radius={0.0025}
              color="#8da48f"
            />
          )
        })}
        <group ref={blades} position={[0, 0, 0.035]}>
          {[0, 1, 2].map((i) => (
            <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
              <Sphere
                position={[0.035, 0.105, 0]}
                scale={[0.075, 0.105, 0.009]}
                color="#abc4b7"
              />
            </group>
          ))}
        </group>
        <Cylinder
          radius={0.038}
          height={0.018}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, 0.12]}
          color="#c4d4c7"
        />
      </group>
    </group>
  )
}
function Phone({ on }: { on: boolean }) {
  return (
    <group>
      <Cylinder
        radius={0.13}
        height={0.02}
        position={[0, 0.01, 0]}
        color="#a2b3a9"
      />
      <group position={[0, 0.027, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Box size={[0.14, 0.282, 0.014]} color="#354947" round={0.006} />
        <group position={[0, 0, 0.0075]}>
          <Screen kind="phone" width={0.125} height={0.259} on={on} />
        </group>
        <Box
          size={[0.037, 0.009, 0.002]}
          position={[0, 0.118, 0.009]}
          color="#1a2b29"
          round={0.001}
        />
      </group>
    </group>
  )
}
function Tower({ on }: { on: boolean }) {
  const rotor = useRef<Group>(null)
  useFrame((_, delta) => {
    if (on && rotor.current)
      rotor.current.rotation.z += Math.min(delta, 0.1) * 6
  })
  return (
    <group>
      <Box
        size={[0.28, 0.49, 0.42]}
        position={[0, 0.275, 0]}
        color="#3d5055"
        round={0.012}
        metalness={0.25}
      />
      {[-0.09, 0.09].flatMap((x) =>
        [-0.14, 0.14].map((z) => (
          <Cylinder
            key={`${x}-${z}`}
            radius={0.025}
            height={0.03}
            position={[x, 0.015, z]}
            color="#293d3c"
          />
        )),
      )}
      <Box
        size={[0.245, 0.45, 0.008]}
        position={[0, 0.275, 0.213]}
        color="#283e42"
        round={0.003}
      />
      {[0.16, 0.35].map((y) => (
        <group key={y} position={[0, y, 0.222]}>
          <Ring
            radius={0.075}
            tube={0.004}
            color={on ? '#8ebbbc' : '#4d6461'}
          />
          <mesh>
            <circleGeometry args={[0.067, 24]} />
            <meshStandardMaterial color="#253c3c" />
          </mesh>
        </group>
      ))}
      <group ref={rotor} position={[0, 0.35, 0.225]}>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} rotation={[0, 0, i * 1.256]}>
            <Box
              size={[0.018, 0.053, 0.002]}
              position={[0, 0.031, 0]}
              color="#71969a"
              round={0.001}
            />
          </group>
        ))}
      </group>
      {Array.from({ length: 9 }, (_, i) => (
        <Box
          key={i}
          size={[0.002, 0.405, 0.003]}
          position={[-0.096 + i * 0.024, 0.272, 0.229]}
          color="#587278"
        />
      ))}
      <Cylinder
        radius={0.012}
        height={0.004}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0.084, 0.48, 0.22]}
        color={on ? '#b4d9b8' : '#526964'}
      />
      {[0.036, 0.067].map((x) => (
        <Box
          key={x}
          size={[0.019, 0.007, 0.003]}
          position={[x, 0.435, 0.221]}
          color="#142b29"
        />
      ))}
      <Box
        size={[0.005, 0.35, 0.3]}
        position={[0.142, 0.275, 0]}
        color="#4c6265"
      />
    </group>
  )
}
function Speaker({ on, level }: { on: boolean; level: number }) {
  const cone = useRef<Group>(null)
  useFrame(({ clock }) => {
    if (cone.current)
      cone.current.position.z =
        0.112 + (on ? Math.sin(clock.elapsedTime * 25) * 0.001 * level : 0)
  })
  return (
    <group>
      <Box
        size={[0.25, 0.4, 0.22]}
        position={[0, 0.2, 0]}
        color="#b69a76"
        round={0.014}
        surface="wood"
      />
      <Box
        size={[0.218, 0.367, 0.007]}
        position={[0, 0.2, 0.113]}
        color="#364e48"
        round={0.004}
      />
      <group ref={cone} position={[0, 0.147, 0.12]}>
        <Cylinder
          radius={0.077}
          height={0.005}
          rotation={[Math.PI / 2, 0, 0]}
          color="#6a8275"
        />
        <Ring radius={0.074} tube={0.004} color="#a4b09a" />
        <Sphere
          scale={[0.028, 0.028, 0.012]}
          position={[0, 0, 0.008]}
          color="#3b5348"
        />
      </group>
      <Cylinder
        radius={0.032}
        height={0.006}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0.295, 0.12]}
        color="#96a997"
      />
      <Cylinder
        radius={0.008}
        height={0.005}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0.078, 0.342, 0.12]}
        color={on ? '#b8d9a5' : '#627b6b'}
      />
      {Array.from({ length: 9 }, (_, i) => (
        <Box
          key={i}
          size={[0.0018, 0.34, 0.001]}
          position={[-0.09 + i * 0.022, 0.2, 0.126]}
          color="#b0b6a2"
        />
      ))}
    </group>
  )
}
function Tablet({ on }: { on: boolean }) {
  return (
    <group>
      <Box
        size={[0.48, 0.025, 0.31]}
        position={[0, 0.0125, 0]}
        color="#8da3a5"
        round={0.009}
      />
      <Rod
        from={[0, 0.025, -0.09]}
        to={[0, 0.18, -0.075]}
        radius={0.026}
        color="#7c9193"
      />
      <group position={[0, 0.19, 0]} rotation={[-1.06, 0, 0]}>
        <Box size={[0.76, 0.49, 0.025]} color="#374b53" round={0.013} />
        <group position={[0.015, 0, 0.013]}>
          <Screen kind="tablet" width={0.65} height={0.43} on={on} />
        </group>
        {[-0.14, -0.06, 0.02, 0.1].map((y) => (
          <Cylinder
            key={y}
            radius={0.011}
            height={0.003}
            rotation={[Math.PI / 2, 0, 0]}
            position={[-0.346, y, 0.014]}
            color="#8dabae"
          />
        ))}
      </group>
    </group>
  )
}
function Printer({ on }: { on: boolean }) {
  return (
    <group>
      <Box
        size={[0.46, 0.26, 0.4]}
        position={[0, 0.13, 0]}
        color="#d8dfd5"
        round={0.018}
      />
      <Box
        size={[0.42, 0.025, 0.34]}
        position={[0, 0.272, -0.015]}
        color="#b2c0b5"
        round={0.01}
      />
      <Box
        size={[0.33, 0.036, 0.004]}
        position={[0, 0.109, 0.202]}
        color="#526a60"
      />
      <Box
        size={[0.34, 0.012, 0.16]}
        position={[0, 0.086, 0.23]}
        color="#b0bfb2"
        round={0.005}
      />
      <Box
        size={[0.24, 0.0015, 0.105]}
        position={[0, 0.094, 0.255]}
        color="#f4f0e2"
      />
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          size={[0.16 - i * 0.025, 0.001, 0.002]}
          position={[0, 0.096, 0.27 + i * 0.015]}
          color="#b4b9ac"
        />
      ))}
      <Box
        size={[0.085, 0.009, 0.045]}
        position={[0.125, 0.291, 0.11]}
        color="#69887c"
        emissive="#82b6a7"
        intensity={on ? 0.5 : 0}
      />
      <Cylinder
        radius={0.012}
        height={0.005}
        position={[0.185, 0.291, 0.11]}
        color="#839a87"
      />
    </group>
  )
}
function Humidifier({ on }: { on: boolean }) {
  const mist = useRef<Group>(null)
  useFrame(({ clock }) => {
    mist.current?.children.forEach((child, i) => {
      const p = (clock.elapsedTime * 0.25 + i / 5) % 1
      child.position.set(Math.sin(p * 6 + i) * p * 0.025, 0.35 + p * 0.27, 0)
      child.scale.setScalar(0.008 + p * 0.022)
      ;((child as Mesh).material as MeshBasicMaterial).opacity = on
        ? Math.sin(p * Math.PI) * 0.1
        : 0
    })
  })
  return (
    <group>
      <Cylinder
        radius={0.14}
        top={0.12}
        height={0.31}
        position={[0, 0.155, 0]}
        color="#dfd9c6"
      />
      <Cylinder
        radius={0.119}
        height={0.016}
        position={[0, 0.318, 0]}
        color="#bcc7b1"
      />
      <Cylinder
        radius={0.017}
        height={0.003}
        position={[0, 0.328, 0]}
        color="#4f6d5d"
      />
      <Ring
        radius={0.139}
        tube={0.003}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0.06, 0]}
        color={on ? '#b5d5ac' : '#adb9a2'}
      />
      <Box
        size={[0.018, 0.055, 0.005]}
        position={[0, 0.15, 0.139]}
        color="#aec5bd"
        round={0.002}
      />
      <group ref={mist}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial
              color="#e9f4ec"
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
function Headphones({ on }: { on: boolean }) {
  return (
    <group>
      <Box
        size={[0.24, 0.018, 0.22]}
        position={[0, 0.009, 0]}
        color="#7f968a"
        round={0.008}
      />
      <Rod
        from={[0, 0.018, 0]}
        to={[0, 0.344, 0]}
        radius={0.009}
        color="#6b8579"
      />
      <Box
        size={[0.1, 0.02, 0.055]}
        position={[0, 0.344, 0]}
        color="#879e91"
        round={0.007}
      />
      <mesh position={[0, 0.25, 0]}>
        <torusGeometry args={[0.115, 0.012, 8, 32, Math.PI]} />
        <meshStandardMaterial color="#4b625c" />
      </mesh>
      {[-0.113, 0.113].map((x) => (
        <group key={x}>
          <Box
            size={[0.042, 0.105, 0.065]}
            position={[x, 0.205, 0]}
            color="#3f5851"
            round={0.015}
          />
          <Box
            size={[0.012, 0.087, 0.06]}
            position={[x - Math.sign(x) * 0.026, 0.205, 0]}
            color="#72877a"
            round={0.005}
            surface="fabric"
          />
        </group>
      ))}
      <Box
        size={[0.018, 0.003, 0.008]}
        position={[0.08, 0.02, 0.065]}
        color={on ? '#bfddb3' : '#879d8c'}
      />
    </group>
  )
}
export function Appliance({ id }: { id: DeviceId }) {
  const spec = DEVICE_MAP[id],
    station = STATION_MAP[spec.stationId]
  const on = usePowerStore((s) => s.devices[id].on),
    level = usePowerStore((s) => s.devices[id].level)
  const powered = usePowerStore((s) => s.masterOn && s.strips[spec.stationId]),
    selected = usePowerStore((s) => s.selected === id),
    select = usePowerStore((s) => s.select)
  const [hovered, setHovered] = useState(false),
    active = on && powered
  useEffect(() => {
    if (hovered) document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])
  return (
    <group
      position={spec.position}
      rotation={[0, station.rotation, 0]}
      name={`device-${id}`}
      userData={{ deviceId: id }}
      onClick={(e) => {
        e.stopPropagation()
        if (e.delta < 5) select(id)
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
    >
      <group scale={spec.scale}>
        {spec.kind === 'monitor' && <Monitor on={active} />}{' '}
        {spec.kind === 'laptop' && <Laptop on={active} />}{' '}
        {spec.kind === 'lamp' && <Lamp on={active} level={level} />}{' '}
        {spec.kind === 'fan' && <Fan on={active} level={level} />}{' '}
        {spec.kind === 'phone' && <Phone on={active} />}{' '}
        {spec.kind === 'tower' && <Tower on={active} />}{' '}
        {spec.kind === 'speaker' && <Speaker on={active} level={level} />}{' '}
        {spec.kind === 'tablet' && <Tablet on={active} />}{' '}
        {spec.kind === 'printer' && <Printer on={active} />}{' '}
        {spec.kind === 'humidifier' && <Humidifier on={active} />}{' '}
        {spec.kind === 'headphones' && <Headphones on={active} />}
      </group>
      {(hovered || selected) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
          <ringGeometry
            args={[
              Math.max(...spec.footprint) / 2 + 0.012,
              Math.max(...spec.footprint) / 2 + 0.017,
              48,
            ]}
          />
          <meshBasicMaterial
            color={station.color}
            transparent
            opacity={0.65}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  )
}
