import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import { STATIONS, DESK_TOP } from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'
import type { StationSpec, Point3, StationId } from '../types'
import { Box, Cylinder, Rod, Sphere, Ring } from './Geometry'
import { StaticGeometry } from './StaticGeometry'

const STEEL = '#4c5651'
const WOOD = '#b9895c'
const PAPER = '#f2eada'
// 书桌柜：暖灰柜体、低饱和灰绿柜门，柜内保留浅色以免成了黑洞
const CABINET_SHELL = '#8a7b63'
const CABINET_DOOR = '#7f8d7d'
const CABINET_INNER = '#b9ab92'

const CHAIR_POSE: Record<
  StationId,
  { rotation: number; x: number; z: number }
> = {
  s1: { rotation: -0.05, x: -0.27, z: 0.8 },
  s2: { rotation: 0.42, x: -0.02, z: 0.9 },
  s3: { rotation: -0.34, x: -0.42, z: 0.86 },
  s4: { rotation: 0.18, x: -0.15, z: 0.88 },
}

type StationLook = {
  sheet: string
  duvet: string
  pillow: string
  accent: string
  plaid?: boolean
  unmade?: boolean
  throw?: boolean
}
/** 四个床位对应四种生活状态，而不是同一张床换四种色。 */
const STATION_LOOK: Record<StationId, StationLook> = {
  s1: {
    sheet: '#d8d3c5',
    duvet: '#405761',
    pillow: '#efe8d7',
    accent: '#b8c3b1',
    plaid: true,
  },
  s2: {
    sheet: '#d8c9b2',
    duvet: '#9a5b43',
    pillow: '#e7dbc4',
    accent: '#d9c39a',
    plaid: true,
    unmade: true,
    throw: true,
  },
  s3: {
    sheet: '#d4d4c6',
    duvet: '#6d7f68',
    pillow: '#e9e3d3',
    accent: '#c2ab84',
    throw: true,
  },
  s4: {
    sheet: '#d7d8cc',
    duvet: '#6f8492',
    pillow: '#eee7d7',
    accent: '#c9c0a6',
    unmade: true,
    throw: true,
  },
}
function WindowView({ night }: { night: boolean }) {
  const [texture] = useState(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const c = canvas.getContext('2d')!
    const sky = c.createLinearGradient(0, 0, 0, 512)
    if (night) {
      sky.addColorStop(0, '#1b2b3b')
      sky.addColorStop(0.55, '#334655')
      sky.addColorStop(1, '#7b6b58')
    } else {
      sky.addColorStop(0, '#8fa9b8')
      sky.addColorStop(0.45, '#c9c2af')
      sky.addColorStop(0.78, '#e8c49c')
      sky.addColorStop(1, '#d9a77e')
    }
    c.fillStyle = sky
    c.fillRect(0, 0, 1024, 512)
    if (!night) {
      const glow = c.createRadialGradient(705, 150, 8, 705, 150, 210)
      glow.addColorStop(0, 'rgba(255,226,178,.95)')
      glow.addColorStop(0.35, 'rgba(248,203,154,.42)')
      glow.addColorStop(1, 'rgba(248,203,154,0)')
      c.fillStyle = glow
      c.fillRect(300, 60, 620, 440)
      c.fillStyle = 'rgba(255,234,196,.92)'
      c.beginPath()
      c.arc(705, 58, 23, 0, Math.PI * 2)
      c.fill()
      c.fillStyle = 'rgba(255,238,214,.12)'
      ;[
        [380, 105, 120, 12],
        [846, 88, 96, 10],
        [248, 148, 84, 9],
      ].forEach(([x, y, w, h]) => {
        c.beginPath()
        c.ellipse(x, y, w, h, 0, 0, Math.PI * 2)
        c.fill()
      })
    } else {
      for (let i = 0; i < 40; i++) {
        const x = (i * 193) % 1000
        const y = 40 + ((i * 71) % 230)
        c.fillStyle = i % 3 ? 'rgba(226,231,214,.45)' : 'rgba(240,205,150,.55)'
        c.fillRect(x, y, 2, 2)
      }
    }
    const haze = c.createLinearGradient(0, 120, 0, 320)
    haze.addColorStop(0, 'rgba(240,226,208,0)')
    haze.addColorStop(1, 'rgba(238,213,184,.5)')
    c.fillStyle = haze
    c.fillRect(0, 120, 1024, 200)
    const buildings = [
      [0, 70, 92, 130],
      [86, 100, 62, 105],
      [142, 55, 118, 145],
      [254, 110, 76, 90],
      [322, 65, 96, 135],
      [412, 95, 58, 110],
      [464, 45, 82, 160],
      [540, 105, 112, 100],
      [646, 75, 74, 130],
      [714, 115, 64, 90],
      [772, 60, 96, 140],
      [862, 95, 76, 110],
      [932, 50, 92, 160],
    ] as const
    buildings.forEach(([x, y, w, h], i) => {
      c.fillStyle = night
        ? i % 2
          ? '#24313a'
          : '#2c3a42'
        : i % 2
          ? '#7d8883'
          : '#939a90'
      c.fillRect(x, y, w, h)
      if (night) {
        for (let wy = y + 14; wy < y + h - 10; wy += 18) {
          for (let wx = x + 10; wx < x + w - 10; wx += 20) {
            if ((wx + wy + i) % 5 < 2) {
              c.fillStyle = 'rgba(244,203,143,.8)'
              c.fillRect(wx, wy, 5, 7)
            }
          }
        }
      }
    })
    const t = new CanvasTexture(canvas)
    t.colorSpace = SRGBColorSpace
    return t
  })
  useEffect(() => () => texture.dispose(), [texture])
  return (
    <mesh position={[0, 1.96, -3.232]}>
      <planeGeometry args={[2.92, 1.62]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

function Screw({ position }: { position: Point3 }) {
  return (
    <group position={position}>
      <Cylinder
        radius={0.012}
        height={0.003}
        rotation={[Math.PI / 2, 0, 0]}
        color="#b8bdb5"
        metalness={0.8}
      />
      <Box
        size={[0.012, 0.002, 0.001]}
        position={[0, 0, 0.002]}
        color="#6e7872"
      />
    </group>
  )
}
function BookSet({ position, color }: { position: Point3; color: string }) {
  return (
    <group position={position}>
      {[0, 1, 2, 3, 4].map((i) => (
        <group
          key={i}
          position={[i * 0.04, 0, 0]}
          rotation={[0, 0, i === 4 ? -0.08 : 0]}
        >
          <Box
            size={[0.035, 0.19 + (i % 2) * 0.025, 0.13]}
            position={[0, (0.19 + (i % 2) * 0.025) / 2, 0]}
            color={[color, '#bc976b', '#ebe3cb', '#78877d', '#acb5b4'][i]}
          />
          <Box
            size={[0.023, 0.15, 0.116]}
            position={[0, 0.1, 0.008]}
            color="#ece5d2"
          />
          <Box
            size={[0.034, 0.19 + (i % 2) * 0.025, 0.014]}
            position={[0, (0.19 + (i % 2) * 0.025) / 2, 0.064]}
            color={[color, '#bc976b', '#ebe3cb', '#78877d', '#acb5b4'][i]}
          />
          {[0.05, 0.17].map((y) => (
            <Box
              key={y}
              size={[0.023, 0.003, 0.001]}
              position={[0, y, 0.072]}
              color="#eee8d7"
            />
          ))}
        </group>
      ))}
    </group>
  )
}
function Chair({
  color,
  rotation = -0.08,
  x = -0.27,
  z = 0.83,
}: {
  color: string
  rotation?: number
  x?: number
  z?: number
}) {
  return (
    <group position={[x, 0.094, z]} rotation={[0, rotation, 0]}>
      <Box
        size={[0.43, 0.065, 0.4]}
        position={[0, 0.4, 0]}
        color={color}
        round={0.02}
        surface="fabric"
      />
      <Box
        size={[0.39, 0.32, 0.043]}
        position={[0, 0.68, 0.175]}
        rotation={[-0.1, 0, 0]}
        color={color}
        round={0.018}
        surface="fabric"
      />
      {[-0.17, 0.17].map((x) => (
        <group key={x}>
          <Rod
            from={[x, 0.025, -0.14]}
            to={[x, 0.38, -0.12]}
            radius={0.012}
            color={STEEL}
          />
          <Rod
            from={[x, 0.025, 0.18]}
            to={[x, 0.79, 0.19]}
            radius={0.012}
            color={STEEL}
          />
          {[-0.14, 0.18].map((z) => (
            <Cylinder
              key={z}
              radius={0.016}
              height={0.025}
              position={[x, 0.0125, z]}
              color="#454f48"
            />
          ))}
        </group>
      ))}
      <Rod
        from={[-0.17, 0.16, 0.18]}
        to={[0.17, 0.16, 0.18]}
        radius={0.01}
        color={STEEL}
      />
    </group>
  )
}
function DeskStructure({ station }: { station: StationSpec }) {
  const select = usePowerStore((s) => s.selectStation)
  return (
    <group
      name={`station-structure-${station.id}`}
      onClick={(e) => {
        e.stopPropagation()
        if (e.delta < 5) select(station.id)
      }}
    >
      <StaticGeometry revision={0}>
        <Box
          size={[1.82, 0.046, 0.78]}
          position={[-0.26, DESK_TOP - 0.023, -0.07]}
          color={WOOD}
          round={0.008}
          surface="wood"
        />
        <Box
          size={[1.81, 0.014, 0.022]}
          position={[-0.26, 0.824, 0.325]}
          color="#b89670"
          surface="wood"
        />
        <Box
          size={[1.81, 0.58, 0.025]}
          position={[-0.26, 0.49, -0.453]}
          color="#cbb99d"
          surface="wood"
        />
        <mesh
          position={[-0.26, 1.37, -0.512]}
          receiveShadow
          name="desk-backboard-interior-cutaway"
        >
          <planeGeometry args={[1.82, 1.02]} />
          <meshStandardMaterial color="#d9d8c8" roughness={0.85} />
        </mesh>
        {[-1.14, 0.62].map((x) => (
          <Box
            key={x}
            size={[0.036, 0.69, 0.7]}
            position={[x, 0.48, -0.07]}
            color="#d4c7ad"
          />
        ))}
        {[-0.235, 0.235].map((x) => (
          <Box
            key={x}
            size={[0.02, 1.61, 0.76]}
            position={[0.945 + x, 0.905, -0.08]}
            color={CABINET_SHELL}
            round={0.006}
            roughness={0.26}
            metalness={0.1}
            surface="lacquer"
          />
        ))}
        <Box
          size={[0.45, 1.61, 0.02]}
          position={[0.945, 0.905, -0.45]}
          color={CABINET_INNER}
          roughness={0.62}
          surface="paint"
        />
        {[0.112, 1.699].map((y) => (
          <Box
            key={y}
            size={[0.49, 0.022, 0.76]}
            position={[0.945, y, -0.08]}
            color={CABINET_SHELL}
            round={0.006}
            roughness={0.26}
            metalness={0.1}
            surface="lacquer"
          />
        ))}
        <Box
          size={[0.42, 0.035, 0.69]}
          position={[0.945, 1.151, -0.045]}
          color="#d8cbb0"
          surface="wood"
        />
        <Box
          size={[0.43, 0.91, 0.025]}
          position={[0.945, 0.62, 0.313]}
          color={CABINET_DOOR}
          round={0.005}
          roughness={0.3}
          metalness={0.06}
          surface="paint"
        />
        <Box
          size={[0.43, 0.575, 0.025]}
          position={[0.945, 1.385, 0.313]}
          color={CABINET_DOOR}
          round={0.005}
          roughness={0.3}
          metalness={0.06}
          surface="paint"
        />
        <Box
          size={[0.016, 0.13, 0.022]}
          position={[0.79, 1.45, 0.339]}
          color="#8d9a94"
          round={0.004}
          metalness={0.65}
          roughness={0.35}
        />
        <Box
          size={[0.016, 0.15, 0.024]}
          position={[0.79, 0.8, 0.339]}
          color="#7f8a7e"
          round={0.004}
          metalness={0.6}
        />
        <Cylinder
          radius={0.012}
          height={0.007}
          position={[0.79, 0.69, 0.34]}
          rotation={[Math.PI / 2, 0, 0]}
          color="#9ea59a"
          metalness={0.8}
        />
        {[1.183, 0.707].map((x) => (
          <group key={x} position={[x, 1.28, -0.07]}>
            <Box size={[0.008, 0.4, 0.31]} color="#e6ddc9" />
            {[-0.1, 0, 0.1].map((z, i) => (
              <Box
                key={z}
                size={[0.005, 0.27, 0.062]}
                position={[x > 0.9 ? 0.006 : -0.006, 0.015, z]}
                color={['#a9b6a8', '#c19a76', '#6e7f86'][i]}
              />
            ))}
            <Box
              size={[0.005, 0.004, 0.3]}
              position={[x > 0.9 ? 0.007 : -0.007, -0.12, 0]}
              color="#9aa093"
            />
          </group>
        ))}
        {[-1.23, 1.23].flatMap((x) =>
          [-0.53, 0.53].map((z) => (
            <group key={`${x}-${z}`}>
              <Box
                size={[0.045, 1.99, 0.045]}
                position={[x, 1.09, z]}
                color={STEEL}
                round={0.006}
              />
              <Box
                size={[0.055, 0.04, 0.055]}
                position={[x, 0.12, z]}
                color="#46554d"
                round={0.005}
              />
              <Screw position={[x, 1.91, z + 0.025]} />
              <Screw position={[x, 0.91, z + 0.025]} />
            </group>
          )),
        )}
        <Box
          size={[2.5, 0.1, 0.045]}
          position={[0, 1.94, 0.53]}
          color={STEEL}
        />
        <Box
          size={[2.5, 0.1, 0.045]}
          position={[0, 1.94, -0.53]}
          color={STEEL}
        />
        {[-1.23, 1.23].map((x) => (
          <Box
            key={x}
            size={[0.045, 0.1, 1.09]}
            position={[x, 1.94, 0]}
            color={STEEL}
          />
        ))}
        <Box
          size={[1.79, 0.015, 0.065]}
          position={[-0.26, 0.797, -0.38]}
          color="#777c6a"
        />
        {[-0.99, -0.55, -0.09, 0.38].map((x) => (
          <Box
            key={x}
            size={[0.012, 0.055, 0.055]}
            position={[x, 0.79, -0.38]}
            color="#6a7365"
          />
        ))}
        <Box
          size={[1.01, 0.028, 0.2]}
          position={[-0.45, 1.7, -0.39]}
          color={WOOD}
          surface="wood"
        />
        <BookSet position={[-0.85, 1.714, -0.39]} color={station.color} />
        <Box
          size={[0.23, 0.14, 0.15]}
          position={[-0.05, 1.784, -0.39]}
          color={station.lightColor}
          round={0.009}
        />
        <Box
          size={[0.085, 0.032, 0.003]}
          position={[-0.05, 1.81, -0.312]}
          color={PAPER}
        />
        {[-0.91, 0.03].map((x) => (
          <Rod
            key={x}
            from={[x, 1.69, -0.34]}
            to={[x, 1.53, -0.505]}
            radius={0.006}
            color={STEEL}
          />
        ))}
        <group position={[0.88, 0, 0.67]}>
          {[-0.19, 0.19].map((x) => (
            <Rod
              key={x}
              from={[x, 0.13, 0.16]}
              to={[x, 2.1, -0.08]}
              radius={0.018}
              color={STEEL}
            />
          ))}
          {[0.36, 0.68, 1, 1.32, 1.64, 1.96].map((y) => (
            <group key={y}>
              <Box
                size={[0.41, 0.035, 0.09]}
                position={[0, y, 0.16 - ((y - 0.13) / 1.97) * 0.24]}
                color="#9aab9b"
                round={0.008}
              />
              {[-0.12, -0.06, 0, 0.06, 0.12].map((x) => (
                <Box
                  key={x}
                  size={[0.002, 0.003, 0.07]}
                  position={[x, y + 0.019, 0.16 - ((y - 0.13) / 1.97) * 0.24]}
                  color="#667e71"
                />
              ))}
            </group>
          ))}
        </group>
        <Chair color={station.color} {...CHAIR_POSE[station.id]} />
        <Box
          size={[0.11, 0.16, 0.024]}
          position={[-1.14, 1.04, -0.49]}
          color="#e9e6d9"
          round={0.009}
        />
        <Box
          size={[0.025, 0.04, 0.009]}
          position={[-1.14, 1.04, -0.474]}
          color="#686f62"
        />
        {station.id === 's1' && (
          <Box
            size={[0.37, 0.025, 0.5]}
            position={[-0.94, 0.117, -0.1]}
            color="#a6b19e"
            round={0.006}
          />
        )}
        {station.id === 's3' && (
          <group>
            <Box
              size={[0.47, 0.025, 0.45]}
              position={[-0.94, 0.237, -0.05]}
              color="#c1b79b"
              round={0.006}
            />
            {[-1.12, -0.76].flatMap((x) =>
              [-0.22, 0.12].map((z) => (
                <Box
                  key={`${x}-${z}`}
                  size={[0.023, 0.13, 0.023]}
                  position={[x, 0.165, z]}
                  color={STEEL}
                />
              )),
            )}
          </group>
        )}
        {(station.id === 's2' || station.id === 's4') && (
          <Box
            size={[0.15, 0.012, 0.12]}
            position={[0.08, 0.866, 0.19]}
            rotation={[0, 0.09, 0]}
            color={PAPER}
          />
        )}
        <Cylinder
          radius={0.034}
          height={0.085}
          position={[0.58, 0.904, 0.18]}
          color={station.color}
        />
        <Cylinder
          radius={0.027}
          height={0.003}
          position={[0.58, 0.948, 0.18]}
          color="#b3aa8a"
        />
        {[0, 1, 2].map((i) => (
          <Rod
            key={i}
            from={[0.564 + i * 0.013, 0.91, 0.18]}
            to={[0.56 + i * 0.018, 1.015 + (i % 2) * 0.025, 0.18]}
            radius={0.003}
            color={i === 1 ? '#b19663' : '#65786e'}
          />
        ))}
        <Box
          size={[0.09, 0.075, 0.008]}
          position={[0.39, 1.34, -0.48]}
          rotation={[0, 0, -0.09]}
          color="#e1c68b"
        />
        <Box
          size={[0.26, 0.35, 0.13]}
          position={[-1.28, 0.7, 0.34]}
          color={station.color}
          round={0.025}
          surface="fabric"
        />
        <Box
          size={[0.22, 0.12, 0.035]}
          position={[-1.28, 0.62, 0.422]}
          color={station.lightColor}
          round={0.012}
        />
        <Ring
          radius={0.05}
          tube={0.007}
          position={[-1.28, 0.916, 0.34]}
          color="#5e6f60"
        />
        <Rod
          from={[-1.23, 0.96, 0.53]}
          to={[-1.28, 0.96, 0.34]}
          radius={0.005}
          color={STEEL}
        />
        <Rod
          from={[-1.28, 0.96, 0.34]}
          to={[-1.28, 0.935, 0.34]}
          radius={0.005}
          color={STEEL}
        />
      </StaticGeometry>
    </group>
  )
}

function StationLife({ station }: { station: StationSpec }) {
  const id = station.id
  const look = STATION_LOOK[id]
  const chair = CHAIR_POSE[id]
  return (
    <StaticGeometry revision={0}>
      {id === 's1' && (
        <group>
          <Box
            size={[0.42, 0.27, 0.48]}
            position={[-0.86, 0.135, 0.3]}
            color="#7f877e"
            round={0.012}
          />
          <Box
            size={[0.43, 0.025, 0.49]}
            position={[-0.86, 0.283, 0.3]}
            color="#9aa194"
            round={0.008}
          />
          <Box
            size={[0.1, 0.008, 0.045]}
            position={[-0.86, 0.298, 0.34]}
            color="#4d5750"
            round={0.002}
          />
          {[-0.56, -0.43].map((x, i) => (
            <Box
              key={x}
              size={[0.12, 0.045, 0.24]}
              position={[x, 0.04, 0.4 + i * 0.04]}
              rotation={[0, 0.12 - i * 0.3, 0]}
              color="#5d6a63"
              round={0.02}
            />
          ))}
          <Box
            size={[0.19, 0.028, 0.14]}
            position={[-1.02, 0.885, 0.2]}
            rotation={[0, -0.12, 0]}
            color="#e8e2d1"
            round={0.004}
          />
          <Box
            size={[0.17, 0.024, 0.13]}
            position={[-1.02, 0.912, 0.2]}
            rotation={[0, 0.06, 0]}
            color="#cdd6c9"
            round={0.004}
          />
          <Cylinder
            radius={0.035}
            height={0.085}
            position={[-0.72, 0.905, 0.24]}
            color="#b9c7c0"
          />
          <Ring
            radius={0.026}
            tube={0.005}
            position={[-0.71, 0.925, 0.24]}
            color="#8fa09a"
          />
          <group position={[-0.58, 1.42, -0.501]}>
            <Box
              size={[0.26, 0.33, 0.006]}
              position={[0, 0, 0]}
              rotation={[0, 0, 0.012]}
              color="#efe9da"
            />
            {[-0.09, -0.03, 0.03, 0.09].map((y) => (
              <Box
                key={y}
                size={[0.15, 0.003, 0.001]}
                position={[0.02, y, 0.004]}
                color="#aab3a8"
              />
            ))}
            <Box
              size={[0.05, 0.05, 0.012]}
              position={[0, 0.16, 0.008]}
              color="#7f9188"
            />
          </group>
        </group>
      )}
      {id === 's2' && (
        <group>
          <group position={[1.0, 0.04, 0.34]} rotation={[0.05, 0.1, -0.14]}>
            <Sphere
              position={[0, 0.34, 0]}
              scale={[0.18, 0.21, 0.045]}
              color="#a56e45"
            />
            <Sphere
              position={[0, 0.6, 0]}
              scale={[0.14, 0.15, 0.042]}
              color="#a56e45"
            />
            <Cylinder
              radius={0.075}
              height={0.04}
              position={[0, 0.47, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              color="#3d3026"
            />
            <Box
              size={[0.05, 0.52, 0.035]}
              position={[0, 0.92, 0]}
              color="#6d4a30"
              round={0.008}
            />
            <Box
              size={[0.085, 0.11, 0.035]}
              position={[0, 1.22, 0]}
              rotation={[0, 0, 0.04]}
              color="#3c2c22"
              round={0.008}
            />
            {[-0.017, 0, 0.017].map((x) => (
              <Box
                key={x}
                size={[0.002, 0.72, 0.002]}
                position={[x, 0.86, 0.022]}
                color="#d9ccb1"
              />
            ))}
            <Box
              size={[0.2, 0.03, 0.06]}
              position={[0, 1.44, 0]}
              color="#40352c"
              round={0.008}
            />
          </group>
          {[-1.06, -1.0, -0.94].map((x, i) => (
            <Box
              key={x}
              size={[0.15, 0.035 + i * 0.01, 0.2]}
              position={[x, 0.115 + i * 0.005, 0.4]}
              rotation={[0, 0.1 - i * 0.08, 0]}
              color={['#8b9b8d', '#c4a27c', '#e0d6c0'][i]}
              round={0.004}
            />
          ))}
          <Sphere
            position={[chair.x + 0.12, 0.55, chair.z + 0.03]}
            scale={[0.16, 0.06, 0.15]}
            color="#8c5a45"
          />
          <Sphere
            position={[chair.x + 0.02, 0.62, chair.z + 0.1]}
            scale={[0.12, 0.05, 0.1]}
            color="#c4b49a"
          />
          <Cylinder
            radius={0.034}
            height={0.08}
            position={[0.12, 0.905, 0.22]}
            color="#c7b59a"
          />
          <group position={[-0.52, 1.4, -0.501]}>
            <Box
              size={[0.3, 0.36, 0.006]}
              position={[0, 0, 0]}
              rotation={[0, 0, -0.018]}
              color="#2f3b3c"
            />
            {[0.09, -0.01, -0.11].map((y, i) => (
              <Box
                key={y}
                size={[0.22, 0.05, 0.002]}
                position={[-0.01, y, 0.004]}
                color={['#c08362', '#c9b487', '#8fa09a'][i]}
              />
            ))}
          </group>
        </group>
      )}
      {id === 's3' && (
        <group>
          <group position={[-0.68, 0.88, -0.28]} rotation={[0, 0.2, 0]}>
            <Box size={[0.22, 0.012, 0.16]} color="#e6dfcc" round={0.004} />
            <Box
              size={[0.19, 0.0015, 0.14]}
              position={[0, 0.008, 0]}
              color="#a9b6ae"
            />
          </group>
          {[
            [0.59, 0.2, '#b7644e'],
            [0.63, 0.24, '#7e8fa0'],
            [0.67, 0.21, '#c6a96a'],
          ].map(([x, z, color]) => (
            <group key={String(x)} position={[Number(x), 0.9, Number(z)]}>
              <Cylinder radius={0.019} height={0.07} color={String(color)} />
              <Cylinder
                radius={0.012}
                height={0.006}
                position={[0, 0.038, 0]}
                color="#4d4b42"
              />
              <Rod
                from={[0, 0.04, 0]}
                to={[0.006, 0.16, 0.002]}
                radius={0.002}
                color="#7d6d58"
              />
            </group>
          ))}
          <group position={[0.64, 0.36, 0.36]} rotation={[0, 0, 0.08]}>
            <Cylinder radius={0.045} height={0.62} color="#d8cfb8" />
            <Cylinder
              radius={0.047}
              height={0.018}
              position={[0, 0.31, 0]}
              color="#a89474"
            />
          </group>
          <Box
            size={[0.2, 0.3, 0.11]}
            position={[chair.x - 0.06, 0.7, chair.z + 0.16]}
            rotation={[0, -0.2, 0]}
            color="#8c8068"
            round={0.03}
            surface="fabric"
          />
          {[
            [-0.78, 1.44, -0.02],
            [-0.56, 1.36, 0.06],
            [-0.34, 1.45, -0.05],
          ].map(([x, y, r]) => (
            <Box
              key={String(x)}
              size={[0.18, 0.24, 0.005]}
              position={[x, y, -0.501]}
              rotation={[0, 0, Number(r)]}
              color={look.pillow}
            />
          ))}
        </group>
      )}
      {id === 's4' && (
        <group>
          <group position={[0.82, 0.16, 0.46]} rotation={[0, -0.2, 0]}>
            <Box
              size={[0.48, 0.23, 0.27]}
              color="#596d62"
              round={0.07}
              surface="fabric"
            />
            <Box
              size={[0.2, 0.035, 0.28]}
              position={[0.02, 0.13, 0]}
              color="#7a8c7d"
              round={0.015}
            />
            <Rod
              from={[-0.21, 0.1, 0]}
              to={[-0.3, 0.26, 0]}
              radius={0.012}
              color="#3f4a44"
            />
          </group>
          {[-0.62, -0.48].map((x, i) => (
            <group
              key={x}
              position={[x, 0.055, 0.4 + i * 0.06]}
              rotation={[0, 0.16 - i * 0.4, 0]}
            >
              <Box
                size={[0.13, 0.075, 0.25]}
                color={i ? '#d8d2c0' : '#b8b3a2'}
                round={0.025}
              />
              <Box
                size={[0.135, 0.025, 0.12]}
                position={[0, -0.035, -0.05]}
                color="#4b5049"
                round={0.008}
              />
            </group>
          ))}
          <Cylinder
            radius={0.038}
            height={0.22}
            position={[0.12, 0.97, 0.23]}
            color="#7e9ba3"
          />
          <Cylinder
            radius={0.02}
            height={0.03}
            position={[0.12, 1.095, 0.23]}
            color="#d7d2c2"
          />
          <Box
            size={[0.28, 0.06, 0.2]}
            position={[chair.x + 0.04, 0.8, chair.z + 0.12]}
            rotation={[0.1, 0.1, -0.04]}
            color="#cfc4a8"
            round={0.015}
            surface="fabric"
          />
          {[
            [-0.6, 1.42, 0.03],
            [-0.3, 1.47, -0.04],
          ].map(([x, y, r]) => (
            <Box
              key={String(x)}
              size={[0.2, 0.15, 0.005]}
              position={[x, y, -0.5]}
              rotation={[0, 0, Number(r)]}
              color="#e6dfcc"
            />
          ))}
        </group>
      )}
    </StaticGeometry>
  )
}

function Loft({ station }: { station: StationSpec }) {
  const group = useRef<Group>(null)
  const invalidate = useThree((s) => s.invalidate)
  const active = usePowerStore((s) => s.activeStation)
  const cutaway = usePowerStore((s) => s.cutaway)
  const opacity = useRef(1)
  const look = STATION_LOOK[station.id]
  useEffect(() => {
    if (group.current)
      group.current.userData.targetOpacity =
        active === station.id && cutaway ? 0.08 : 1
    invalidate()
  }, [active, cutaway, station.id, invalidate])
  useFrame(({ invalidate }, delta) => {
    if (!group.current) return
    const target = group.current.userData.targetOpacity ?? 1
    if (Math.abs(opacity.current - target) < 0.001) return
    opacity.current = matchMedia('(prefers-reduced-motion: reduce)').matches
      ? target
      : opacity.current +
        (target - opacity.current) * (1 - Math.exp(-Math.min(delta, 0.1) * 9))
    group.current.traverse((object) => {
      if ('isMesh' in object) {
        const mesh = object as Mesh
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]
        materials.forEach((material) => {
          const m = material as MeshStandardMaterial
          m.transparent = opacity.current < 0.999
          m.opacity = opacity.current
          m.depthWrite = opacity.current > 0.9
        })
        mesh.castShadow = opacity.current > 0.9
        mesh.userData.originalRaycast ??= mesh.raycast
        mesh.raycast =
          opacity.current > 0.9 ? mesh.userData.originalRaycast : () => {}
      }
    })
    invalidate()
  })
  return (
    <group ref={group} name={`loft-${station.id}`}>
      <StaticGeometry revision={0}>
        <Box
          size={[2.46, 0.055, 1.08]}
          position={[0, 2.015, 0]}
          color="#b6a286"
          surface="wood"
        />
        <Box
          size={[2.36, 0.12, 1.01]}
          position={[0, 2.1, 0]}
          color={look.sheet}
          round={0.035}
          surface="fabric"
        />
        <Box
          size={[1.69, 0.095, 1.026]}
          position={[look.unmade ? 0.26 : 0.3, 2.2075, 0]}
          rotation={[0, look.unmade ? -0.035 : 0, 0]}
          color={look.duvet}
          round={0.04}
          surface="fabric"
        />
        <Box
          size={[0.2, 0.025, 1.028]}
          position={[-0.45, 2.2675, 0]}
          color={look.accent}
          round={0.009}
          surface="fabric"
        />
        <Box
          size={[0.45, 0.115, 0.73]}
          position={[-0.86, 2.2175, look.unmade ? 0.09 : 0]}
          rotation={[0, look.unmade ? 0.16 : 0, 0]}
          color={look.pillow}
          round={0.045}
          surface="fabric"
        />
        {look.unmade && (
          <Sphere
            position={[0.02, 2.245, 0.16]}
            scale={[0.44, 0.055, 0.3]}
            color={look.duvet}
          />
        )}
        {look.plaid &&
          [-0.46, -0.27, -0.08, 0.11, 0.3, 0.49].map((z) => (
            <Box
              key={z}
              size={[1.47, 0.002, 0.003]}
              position={[0.37, 2.256, z]}
              color={look.accent}
            />
          ))}
        {look.plaid &&
          [-0.58, -0.36, -0.14, 0.08, 0.3, 0.52].map((x) => (
            <Box
              key={`w-${x}`}
              size={[0.003, 0.002, 1.0]}
              position={[0.3 + x, 2.2565, 0]}
              color={look.accent}
            />
          ))}
        {look.throw && (
          <group>
            <Box
              size={[0.43, 0.032, 1.02]}
              position={[0.86, 2.272, 0]}
              color={look.accent}
              round={0.01}
              surface="fabric"
            />
            <Box
              size={[0.38, 0.014, 0.96]}
              position={[0.86, 2.291, 0]}
              color={look.pillow}
              surface="fabric"
            />
          </group>
        )}
        {(station.id === 's2' || station.id === 's4') && (
          <group>
            <Box
              size={[0.52, 0.33, 0.016]}
              position={[0.55, 2.03, 0.56]}
              rotation={[0.02, 0, 0.02]}
              color={look.duvet}
              surface="fabric"
            />
            <Box
              size={[0.5, 0.05, 0.02]}
              position={[0.55, 2.205, 0.56]}
              color={look.accent}
              surface="fabric"
            />
          </group>
        )}
        {[-0.31, 0.31].map((z) => (
          <Box
            key={z}
            size={[0.35, 0.001, 0.002]}
            position={[-0.86, 2.2755, z + (look.unmade ? 0.09 : 0)]}
            color="#cfcfc0"
          />
        ))}
        {[-1.23, 1.23].map((x) => (
          <group key={x}>
            <Box
              size={[0.04, 0.5, 0.04]}
              position={[x, 2.25, -0.53]}
              color={STEEL}
            />
            <Box
              size={[0.04, 0.5, 0.04]}
              position={[x, 2.25, 0.53]}
              color={STEEL}
            />
            <Rod
              from={[x, 2.48, -0.53]}
              to={[x, 2.48, 0.53]}
              radius={0.018}
              color={STEEL}
            />
            <Rod
              from={[x, 2.3, -0.53]}
              to={[x, 2.3, 0.53]}
              radius={0.012}
              color={STEEL}
            />
          </group>
        ))}
        <Rod
          from={[-1.23, 2.47, -0.53]}
          to={[1.23, 2.47, -0.53]}
          radius={0.018}
          color={STEEL}
        />
        <Rod
          from={[-1.23, 2.47, 0.53]}
          to={[0.59, 2.47, 0.53]}
          radius={0.018}
          color={STEEL}
        />
        <Rod
          from={[-1.23, 2.32, 0.53]}
          to={[0.59, 2.32, 0.53]}
          radius={0.012}
          color={STEEL}
        />
        {[-1.1, -0.7, -0.3, 0.1, 0.57].map((x) => (
          <Rod
            key={x}
            from={[x, 2.05, 0.53]}
            to={[x, 2.47, 0.53]}
            radius={0.01}
            color={STEEL}
          />
        ))}
        <Box
          size={[0.25, 0.14, 0.08]}
          position={[0.84, 2.29, -0.49]}
          color={station.color}
          round={0.012}
          surface="fabric"
        />
      </StaticGeometry>
    </group>
  )
}

function RoomShell({ night }: { night: boolean }) {
  return (
    <StaticGeometry revision={night}>
      <Box
        size={[5.62, 0.22, 6.73]}
        position={[0, -0.03, 0]}
        color="#858a7d"
        round={0.08}
      />
      {Array.from({ length: 9 }, (_, x) =>
        Array.from({ length: 11 }, (_, z) => (
          <Box
            key={`${x}-${z}`}
            size={[0.599, 0.014, 0.592]}
            position={[-2.46 + x * 0.615, 0.087, -3.05 + z * 0.61]}
            color={(x + z) % 3 === 0 ? '#e9e2d2' : '#efe8d8'}
            roughness={0.62}
            surface="plaster"
          />
        )),
      )}
      <Box
        size={[5.62, 0.9, 0.12]}
        position={[0, 0.55, -3.31]}
        color="#b9b3a2"
        surface="plaster"
      />
      <Box
        size={[5.62, 0.46, 0.12]}
        position={[0, 3.07, -3.31]}
        color="#ddd6c6"
        surface="plaster"
      />
      {[-2.15, 2.15].map((x) => (
        <Box
          key={x}
          size={[1.3, 1.9, 0.12]}
          position={[x, 1.92, -3.31]}
          color="#ddd6c6"
          surface="plaster"
        />
      ))}
      {[-2.75, 2.75].map((x) => (
        <group key={x}>
          <Box
            size={[0.09, 0.53, 6.6]}
            position={[x, 0.36, -0.02]}
            color="#b6b1a0"
          />
          <Box
            size={[0.06, 0.036, 6.62]}
            position={[x, 0.643, -0.02]}
            color="#a39e8d"
          />
        </group>
      ))}
      <group position={[0, 1.96, -3.3]}>
        <Box
          size={[3.02, 0.07, 0.06]}
          position={[0, 0.855, 0.09]}
          color="#cbb99b"
        />
        <Box
          size={[3.02, 0.07, 0.06]}
          position={[0, -0.855, 0.09]}
          color="#cbb99b"
        />
        <Box
          size={[0.07, 1.75, 0.06]}
          position={[-1.49, 0, 0.09]}
          color="#cbb99b"
        />
        <Box
          size={[0.07, 1.75, 0.06]}
          position={[1.49, 0, 0.09]}
          color="#cbb99b"
        />
        {[-0.99, 0, 0.99].map((x) => (
          <Box
            key={x}
            size={[0.04, 1.69, 0.035]}
            position={[x, 0, 0.1]}
            color="#e0d8c6"
          />
        ))}
        <Box
          size={[2.99, 0.035, 0.035]}
          position={[0, 0.12, 0.1]}
          color="#e0d8c6"
        />
        <Box
          size={[3.22, 0.045, 0.23]}
          position={[0, -0.89, 0.08]}
          color="#c9b18a"
        />
        <Rod
          from={[-1.78, 0.99, 0.15]}
          to={[1.78, 0.99, 0.15]}
          radius={0.015}
          color="#949b87"
        />
        {[-1, 1].flatMap((side) =>
          Array.from({ length: 7 }, (_, i) => (
            <mesh
              key={`${side}-${i}`}
              position={[
                side * (1.5 + i * 0.037),
                -0.035,
                0.14 + Math.sin(i) * 0.018,
              ]}
              castShadow
            >
              <cylinderGeometry args={[0.028, 0.035, 1.91, 10]} />
              <meshStandardMaterial
                color={i % 2 ? '#d0d4c4' : '#dfe2d6'}
                roughness={1}
              />
            </mesh>
          )),
        )}
        <Box
          size={[0.13, 0.017, 0.05]}
          position={[0.45, 0, 0.135]}
          color="#8d9f94"
          round={0.006}
        />
      </group>
      <Box
        size={[1.45, 0.11, 0.11]}
        position={[0, 3.11, -3.19]}
        color="#d6ddd2"
        round={0.025}
      />
      <Box
        size={[1.28, 0.06, 0.02]}
        position={[0, 3.11, -3.125]}
        color="#eaece3"
        emissive="#f8e2af"
        intensity={night ? 0.5 : 0}
      />
      <group position={[-2.02, 2.18, -3.235]}>
        <Box size={[0.72, 0.52, 0.028]} color="#9b7a55" round={0.008} />
        <Box
          size={[0.66, 0.46, 0.012]}
          position={[0, 0, 0.02]}
          color="#b99064"
          surface="fabric"
        />
        {[
          [-0.18, 0.1, 0.05],
          [0.08, 0.12, -0.04],
          [0.2, -0.09, 0.03],
          [-0.09, -0.1, -0.06],
        ].map(([x, y, r]) => (
          <Box
            key={`${x}-${y}`}
            size={[0.16, 0.19, 0.004]}
            position={[x, y, 0.03]}
            rotation={[0, 0, r]}
            color="#eee5d2"
          />
        ))}
        {[-0.2, 0.06, 0.22].map((x) => (
          <Sphere
            key={x}
            position={[x, 0.18, 0.035]}
            scale={[0.012, 0.012, 0.008]}
            color="#b45e48"
          />
        ))}
      </group>
      <group position={[2.03, 2.4, -3.24]}>
        <Cylinder
          radius={0.17}
          height={0.035}
          rotation={[Math.PI / 2, 0, 0]}
          color="#4b5650"
        />
        <Cylinder
          radius={0.148}
          height={0.006}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, 0.02]}
          color="#eee8d8"
        />
        <Box
          size={[0.008, 0.09, 0.002]}
          position={[0, 0.035, 0.025]}
          rotation={[0, 0, 0.4]}
          color="#3e4842"
        />
        <Box
          size={[0.006, 0.065, 0.002]}
          position={[0.028, 0, 0.026]}
          rotation={[0, 0, -0.25]}
          color="#3e4842"
        />
      </group>
      {[
        [-1.28, 1.3, 0.03],
        [1.36, 1.1, -0.04],
      ].map(([x, y, r]) => (
        <Box
          key={String(x)}
          size={[0.24, 0.13, 0.004]}
          position={[x, y, -3.24]}
          rotation={[0, 0, Number(r)]}
          color="#e4ddcb"
        />
      ))}
      <Box
        size={[5.62, 0.12, 3.2]}
        position={[0, 3.4, -1.7]}
        color="#e8e0d0"
        surface="plaster"
      />
      <Box
        size={[5.5, 0.035, 3.08]}
        position={[0, 3.335, -1.7]}
        color="#f2ead9"
      />
      <group position={[0, 3.28, -1.8]}>
        <Rod
          from={[0, 0.06, 0]}
          to={[0, -0.18, 0]}
          radius={0.008}
          color="#5a5c52"
        />
        <Cylinder
          radius={0.2}
          top={0.07}
          height={0.12}
          position={[0, -0.26, 0]}
          color="#d8cdb7"
        />
        <mesh position={[0, -0.322, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.17, 24]} />
          <meshStandardMaterial
            color="#fff3d8"
            emissive="#ffdfaa"
            emissiveIntensity={night ? 1.8 : 0.5}
          />
        </mesh>
      </group>
      <Box
        size={[1.28, 0.012, 2.55]}
        position={[0, 0.107, 1.85]}
        color="#967e67"
        round={0.004}
        surface="fabric"
      />
      <Box
        size={[1.16, 0.002, 2.43]}
        position={[0, 0.116, 1.85]}
        color="#b7a087"
        surface="fabric"
      />
      {[-0.54, -0.36, -0.18, 0, 0.18, 0.36, 0.54].map((x) => (
        <Box
          key={x}
          size={[0.008, 0.004, 2.4]}
          position={[x, 0.12, 1.85]}
          color="#d2c0a8"
        />
      ))}
      <group position={[-0.95, 0, 2.75]}>
        <Cylinder
          radius={0.24}
          top={0.27}
          height={0.38}
          position={[0, 0.2, 0]}
          color="#a88b68"
        />
        <Cylinder
          radius={0.25}
          height={0.025}
          position={[0, 0.395, 0]}
          color="#8d7355"
        />
        {[-0.16, -0.08, 0, 0.08, 0.16].map((x) => (
          <Box
            key={x}
            size={[0.008, 0.3, 0.008]}
            position={[x, 0.22, 0.24]}
            color="#8f7658"
          />
        ))}
        <Box
          size={[0.3, 0.1, 0.24]}
          position={[0, 0.45, 0]}
          rotation={[0, 0.2, 0.05]}
          color="#b9b3a2"
          round={0.03}
          surface="fabric"
        />
      </group>
      <group position={[0.98, 0.1, 2.6]}>
        <Box
          size={[0.42, 0.3, 0.34]}
          position={[0, 0.15, 0]}
          color="#b39a76"
          round={0.006}
        />
        <Box
          size={[0.36, 0.28, 0.3]}
          position={[0, 0.44, 0]}
          rotation={[0, 0.12, 0]}
          color="#c6b18c"
          round={0.005}
        />
        <Box
          size={[0.15, 0.003, 0.14]}
          position={[0, 0.585, 0]}
          rotation={[0, 0.12, 0]}
          color="#e6ddc9"
        />
      </group>
      <group position={[0, 0.1, -2.92]}>
        <Box
          size={[1.3, 0.38, 0.42]}
          position={[0, 0.19, 0]}
          color="#d0c8b1"
          round={0.015}
        />
        <Box
          size={[1.32, 0.045, 0.44]}
          position={[0, 0.41, 0]}
          color="#dcbf92"
          surface="wood"
        />
        {[-0.42, 0, 0.42].map((x) => (
          <Box
            key={x}
            size={[0.39, 0.26, 0.015]}
            position={[x, 0.19, 0.22]}
            color="#e2dbca"
          />
        ))}
        <Cylinder
          radius={0.072}
          height={0.11}
          position={[0.43, 0.49, 0]}
          color="#a6b497"
        />
        <Sphere
          position={[0.43, 0.61, 0]}
          scale={[0.1, 0.1, 0.08]}
          color="#7b9477"
        />
      </group>
    </StaticGeometry>
  )
}

export function DormRoom({ night }: { night: boolean }) {
  return (
    <group name="four-person-dorm">
      <WindowView key={night ? 'night' : 'day'} night={night} />
      <RoomShell night={night} />
      <pointLight
        position={[0, 2.95, -1.8]}
        color="#ffe0b8"
        intensity={night ? 0.8 : 1.1}
        distance={3.8}
        decay={2}
      />
      {STATIONS.map((station) => (
        <group
          key={station.id}
          position={station.position}
          rotation={[0, station.rotation, 0]}
          name={`station-${station.id}`}
        >
          <DeskStructure station={station} />
          <StationLife station={station} />
          <Loft station={station} />
        </group>
      ))}
    </group>
  )
}
