import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import { STATIONS, DESK_TOP } from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'
import type { StationSpec, Point3 } from '../types'
import { Box, Cylinder, Rod, Sphere, Ring } from './Geometry'
import { StaticGeometry } from './StaticGeometry'

const STEEL = '#687a75'
const WOOD = '#d4b38b'
const PAPER = '#f2eada'
// 书桌柜：侧壁黑漆，柜门低饱和蓝，柜内保留浅色以免成了黑洞
const CABINET_SHELL = '#31383f'
const CABINET_DOOR = '#4b82b8'
const CABINET_INNER = '#b4a992'
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
function Chair({ color }: { color: string }) {
  return (
    <group position={[-0.27, 0.094, 0.83]} rotation={[0, -0.08, 0]}>
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
        <Chair color={station.color} />
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
        {station.id === 's1' && (
          <group>
            <Box
              size={[0.43, 0.019, 0.135]}
              position={[-0.35, 0.871, 0.18]}
              color="#e3e1d0"
              round={0.006}
            />
            {Array.from({ length: 3 }, (_, r) =>
              Array.from({ length: 12 }, (_, c) => (
                <Box
                  key={`${r}-${c}`}
                  size={[0.026, 0.003, 0.026]}
                  position={[-0.535 + c * 0.033, 0.883, 0.138 + r * 0.037]}
                  color={(r + c) % 9 === 0 ? station.color : '#bac7bb'}
                />
              )),
            )}
            <Sphere
              position={[0.07, 0.883, 0.19]}
              scale={[0.033, 0.017, 0.05]}
              color="#d7ddd0"
            />
          </group>
        )}
        {station.id !== 's1' && (
          <Box
            size={[0.15, 0.012, 0.12]}
            position={[0.08, 0.866, 0.19]}
            rotation={[0, 0.09, 0]}
            color={PAPER}
          />
        )}
        {station.id === 's3' && (
          <Rod
            from={[0.04, 0.874, 0.1]}
            to={[0.16, 0.874, 0.21]}
            radius={0.004}
            color="#586772"
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

function Loft({ station }: { station: StationSpec }) {
  const group = useRef<Group>(null)
  const invalidate = useThree((s) => s.invalidate)
  const active = usePowerStore((s) => s.activeStation)
  const cutaway = usePowerStore((s) => s.cutaway)
  const opacity = useRef(1)
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
          color="#e5e3d6"
          round={0.035}
          surface="fabric"
        />
        <Box
          size={[1.69, 0.095, 1.026]}
          position={[0.3, 2.2075, 0]}
          color={station.lightColor}
          round={0.04}
          surface="fabric"
        />
        <Box
          size={[0.2, 0.025, 1.028]}
          position={[-0.45, 2.2675, 0]}
          color={station.color}
          round={0.009}
          surface="fabric"
        />
        <Box
          size={[0.45, 0.115, 0.73]}
          position={[-0.86, 2.2175, 0]}
          color="#f0eadc"
          round={0.045}
          surface="fabric"
        />
        {[-0.46, -0.27, -0.08, 0.11, 0.3, 0.49].map((z) => (
          <Box
            key={z}
            size={[1.47, 0.002, 0.003]}
            position={[0.37, 2.256, z]}
            color={station.color}
          />
        ))}
        {[-0.31, 0.31].map((z) => (
          <Box
            key={z}
            size={[0.35, 0.001, 0.002]}
            position={[-0.86, 2.2755, z]}
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
        color="#b8b6a5"
        round={0.08}
      />
      {Array.from({ length: 9 }, (_, x) =>
        Array.from({ length: 11 }, (_, z) => (
          <Box
            key={`${x}-${z}`}
            size={[0.599, 0.014, 0.592]}
            position={[-2.46 + x * 0.615, 0.087, -3.05 + z * 0.61]}
            color={(x + z) % 3 === 0 ? '#dfdcd0' : '#e3e0d4'}
            roughness={0.62}
            surface="plaster"
          />
        )),
      )}
      <Box
        size={[5.62, 0.9, 0.12]}
        position={[0, 0.55, -3.31]}
        color="#c3cdbd"
        surface="plaster"
      />
      <Box
        size={[5.62, 0.46, 0.12]}
        position={[0, 3.07, -3.31]}
        color="#e7e5db"
        surface="plaster"
      />
      {[-2.15, 2.15].map((x) => (
        <Box
          key={x}
          size={[1.3, 1.9, 0.12]}
          position={[x, 1.92, -3.31]}
          color="#e7e5db"
          surface="plaster"
        />
      ))}
      {[-2.75, 2.75].map((x) => (
        <group key={x}>
          <Box
            size={[0.09, 0.53, 6.6]}
            position={[x, 0.36, -0.02]}
            color="#c4cebe"
          />
          <Box
            size={[0.06, 0.036, 6.62]}
            position={[x, 0.643, -0.02]}
            color="#adbaaa"
          />
        </group>
      ))}
      <group position={[0, 1.96, -3.3]}>
        <Box size={[3.08, 1.79, 0.09]} color="#a4b5ab" />
        <Box
          size={[2.95, 1.65, 0.04]}
          position={[0, 0, 0.066]}
          color={night ? '#263e51' : '#bcd6d8'}
          emissive={night ? '#263e51' : '#c6dbd8'}
          intensity={0.15}
        />
        {[-0.99, 0, 0.99].map((x) => (
          <Box
            key={x}
            size={[0.04, 1.69, 0.035]}
            position={[x, 0, 0.1]}
            color="#e8ebe1"
          />
        ))}
        <Box
          size={[2.99, 0.035, 0.035]}
          position={[0, 0.12, 0.1]}
          color="#e8ebe1"
        />
        <Box
          size={[3.22, 0.045, 0.23]}
          position={[0, -0.89, 0.08]}
          color="#d0c4a9"
        />
        {Array.from({ length: 13 }, (_, i) => (
          <Box
            key={i}
            size={[0.16, 0.22 + (i % 4) * 0.11, 0.006]}
            position={[-1.35 + i * 0.22, -0.5, 0.092]}
            color={night ? '#3b576a' : '#a1c0c1'}
          />
        ))}
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
      <Box
        size={[1.42, 0.012, 0.69]}
        position={[0, 0.107, 2.72]}
        color="#a9b8a5"
        round={0.004}
        surface="fabric"
      />
      {[-0.56, -0.28, 0, 0.28, 0.56].map((x) => (
        <Box
          key={x}
          size={[0.008, 0.004, 0.57]}
          position={[x, 0.117, 2.72]}
          color="#d6d9c9"
        />
      ))}
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
      <RoomShell night={night} />
      {STATIONS.map((station) => (
        <group
          key={station.id}
          position={station.position}
          rotation={[0, station.rotation, 0]}
          name={`station-${station.id}`}
        >
          <DeskStructure station={station} />
          <Loft station={station} />
        </group>
      ))}
    </group>
  )
}
