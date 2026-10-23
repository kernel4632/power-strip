import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CanvasTexture, SRGBColorSpace } from 'three'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import { DESK_TOP, STATIONS } from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'
import type { Point3, StationId, StationSpec } from '../types'
import { Bedding } from './Bedding'
import { Box, Cylinder, Ring, Rod } from './Geometry'
import { ModelPart } from './ModelPart'
import { Basin, FLOOR_TOP, LandingObjects, Mug } from './RoomObjects'
import { ScenePrint } from './ScenePrint'
import { StaticGeometry } from './StaticGeometry'

const STEEL = '#56625a'
const WOOD = '#b18d66'
const PAPER = '#ded6c2'
const CABINET_DOOR = '#7d8878'
const NAMES: Record<StationId, string> = {
  s1: '林',
  s2: '周',
  s3: '陈',
  s4: '王',
}
const CHAIR_POSE: Record<
  StationId,
  { x: number; z: number; rotation: number }
> = {
  s1: { x: -0.27, z: 0.8, rotation: -0.05 },
  s2: { x: -0.02, z: 0.9, rotation: 0.3 },
  s3: { x: -0.42, z: 0.86, rotation: -0.2 },
  s4: { x: -0.15, z: 0.88, rotation: 0.15 },
}

function WindowView({ night }: { night: boolean }) {
  const [texture] = useState(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const c = canvas.getContext('2d')!
    const sky = c.createLinearGradient(0, 0, 0, 512)
    sky.addColorStop(0, night ? '#172b3c' : '#9daeb6')
    sky.addColorStop(0.6, night ? '#304250' : '#c8c4b7')
    sky.addColorStop(1, night ? '#58616a' : '#dfc9aa')
    c.fillStyle = sky
    c.fillRect(0, 0, 1024, 512)
    const buildings = [
      [0, 244, 130],
      [110, 285, 94],
      [200, 218, 145],
      [340, 274, 100],
      [430, 242, 120],
      [544, 292, 150],
      [680, 229, 112],
      [784, 276, 102],
      [880, 250, 144],
    ]
    buildings.forEach(([x, y, width], i) => {
      c.fillStyle = night
        ? i % 2
          ? '#253440'
          : '#2c3e48'
        : i % 2
          ? '#8c9892'
          : '#9ca39a'
      c.fillRect(x, y, width, 512 - y)
      c.fillStyle = night ? '#bea87e' : '#b1b6ac'
      for (let wy = y + 15; wy < 510; wy += 28)
        for (let wx = x + 12; wx < x + width - 10; wx += 22) {
          if (!night || (wx + wy + i) % 7 < 2) c.fillRect(wx, wy, 6, 11)
        }
    })
    const map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    return map
  })
  useEffect(() => () => texture.dispose(), [texture])
  // An exterior view, not an opaque shadow-casting pane over the window opening.
  return (
    <mesh position={[0, 1.96, -3.235]} name="window-view">
      <planeGeometry args={[2.92, 1.62]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

function Screw({ position }: { position: Point3 }) {
  return (
    <group position={position}>
      <Cylinder
        radius={0.007}
        height={0.003}
        rotation={[Math.PI / 2, 0, 0]}
        color="#9ba499"
        metalness={0.7}
      />
      <Box
        size={[0.008, 0.0015, 0.001]}
        position={[0, 0, 0.002]}
        color="#5d655b"
      />
    </group>
  )
}

function BookSet({ color }: { color: string }) {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const height = 0.18 + (i % 3) * 0.017
        return (
          <group key={i} position={[i * 0.044, 0, 0]}>
            <Box
              size={[0.034, height, 0.12]}
              position={[0, height / 2, 0]}
              color={PAPER}
            />
            <Box
              size={[0.038, height + 0.002, 0.01]}
              position={[0, height / 2, 0.065]}
              color={[color, '#af9472', '#b9bea9', '#63766c', '#c1b392'][i]}
            />
            <Box
              size={[0.024, 0.004, 0.001]}
              position={[0, height - 0.03, 0.071]}
              color="#e1dac7"
            />
          </group>
        )
      })}
    </group>
  )
}

function Chair({ station }: { station: StationSpec }) {
  const pose = CHAIR_POSE[station.id]
  const stool = station.id === 's2',
    wood = station.id === 's3',
    folding = station.id === 's4'
  const seatY = stool ? 0.43 : 0.4
  return (
    <ModelPart
      id={`chair-${station.id}`}
      position={[pose.x, FLOOR_TOP, pose.z]}
      rotation={[0, pose.rotation, 0]}
      check={{ supportY: FLOOR_TOP, category: 'prop' }}
    >
      {stool ? (
        <>
          <Box
            size={[0.38, 0.045, 0.34]}
            position={[0, seatY, 0]}
            color="#ad8e66"
            round={0.008}
            surface="wood"
          />
          <Box
            size={[0.3, 0.045, 0.26]}
            position={[0, 0.475, 0]}
            color={station.color}
            round={0.019}
            surface="fabric"
          />
          {[-0.15, 0.15].flatMap((x) =>
            [-0.12, 0.12].map((z) => (
              <group key={`${x}-${z}`}>
                <Rod
                  from={[x, 0.012, z]}
                  to={[x * 0.86, 0.41, z * 0.86]}
                  radius={0.012}
                  color="#69513b"
                />
                <Cylinder
                  position={[x, 0.006, z]}
                  radius={0.014}
                  height={0.012}
                  color="#514a3d"
                />
              </group>
            )),
          )}
          {[-0.1, 0.1].map((z) => (
            <Rod
              key={z}
              from={[-0.14, 0.17, z]}
              to={[0.14, 0.17, z]}
              radius={0.008}
              color="#69513b"
            />
          ))}
        </>
      ) : folding ? (
        <>
          <Box
            size={[0.4, 0.035, 0.34]}
            position={[0, seatY, 0]}
            color={station.color}
            round={0.012}
            surface="fabric"
          />
          <Box
            size={[0.36, 0.27, 0.025]}
            position={[0, 0.66, 0.14]}
            rotation={[-0.12, 0, 0]}
            color={station.color}
            round={0.008}
            surface="fabric"
          />
          {[-0.17, 0.17].map((x) => (
            <group key={x}>
              <Rod
                from={[x, 0.01, -0.15]}
                to={[x * 0.75, 0.41, 0.12]}
                radius={0.009}
                color="#6d7772"
              />
              <Rod
                from={[x, 0.01, 0.16]}
                to={[x * 0.75, 0.41, -0.12]}
                radius={0.009}
                color="#6d7772"
              />
              <Rod
                from={[x * 0.75, 0.41, 0.12]}
                to={[x * 0.7, 0.79, 0.14]}
                radius={0.009}
                color="#6d7772"
              />
              {[-0.15, 0.16].map((z) => (
                <Cylinder
                  key={z}
                  position={[x, 0.006, z]}
                  radius={0.012}
                  height={0.012}
                  color="#4d584d"
                />
              ))}
            </group>
          ))}
        </>
      ) : (
        <>
          <Box
            size={[0.42, wood ? 0.05 : 0.065, 0.38]}
            position={[0, seatY, 0]}
            color={wood ? '#a98761' : station.color}
            round={wood ? 0.007 : 0.02}
            surface={wood ? 'wood' : 'fabric'}
          />
          {wood ? (
            [0.55, 0.68, 0.81].map((y) => (
              <Box
                key={y}
                size={[0.32, 0.05, 0.02]}
                position={[0, y, 0.17]}
                color="#b49772"
                surface="wood"
                round={0.004}
              />
            ))
          ) : (
            <Box
              size={[0.39, 0.32, 0.043]}
              position={[0, 0.68, 0.175]}
              rotation={[-0.1, 0, 0]}
              color={station.color}
              round={0.018}
              surface="fabric"
            />
          )}
          {[-0.17, 0.17].map((x) => (
            <group key={x}>
              <Rod
                from={[x, 0.012, -0.14]}
                to={[x, 0.39, -0.12]}
                radius={0.012}
                color={wood ? '#806449' : STEEL}
              />
              <Rod
                from={[x, 0.012, 0.16]}
                to={[x, wood ? 0.85 : 0.8, 0.17]}
                radius={0.012}
                color={wood ? '#806449' : STEEL}
              />
              {[-0.14, 0.16].map((z) => (
                <Cylinder
                  key={z}
                  position={[x, 0.006, z]}
                  radius={0.014}
                  height={0.012}
                  color="#51574a"
                />
              ))}
            </group>
          ))}
          <Rod
            from={[-0.17, 0.17, 0.16]}
            to={[0.17, 0.17, 0.16]}
            radius={0.009}
            color={wood ? '#806449' : STEEL}
          />
        </>
      )}
    </ModelPart>
  )
}

function DeskStructure({ station }: { station: StationSpec }) {
  const selectStation = usePowerStore((s) => s.selectStation)
  return (
    <group
      name={`station-structure-${station.id}`}
      onClick={(e) => {
        e.stopPropagation()
        if (e.delta < 5) selectStation(station.id)
      }}
    >
      <StaticGeometry revision={0}>
        <ModelPart id={`desktop-${station.id}`} check={{ category: 'solid' }}>
          <Box
            size={[1.82, 0.046, 0.78]}
            position={[-0.26, DESK_TOP - 0.023, -0.07]}
            color={WOOD}
            round={0.007}
            surface="wood"
          />
        </ModelPart>
        <Box
          size={[1.81, 0.014, 0.018]}
          position={[-0.26, 0.824, 0.325]}
          color="#b69b78"
        />
        <Box
          size={[1.81, 0.58, 0.025]}
          position={[-0.26, 0.49, -0.453]}
          color="#b6a68a"
          surface="wood"
        />
        <ModelPart id={`backboard-${station.id}`} check={{ category: 'solid' }}>
          <mesh position={[-0.26, 1.37, -0.515]} receiveShadow>
            <planeGeometry args={[1.82, 1.02]} />
            <meshStandardMaterial color="#d1d0bf" roughness={0.9} />
          </mesh>
        </ModelPart>
        {[-1.14, 0.62].map((x) => (
          <ModelPart
            key={x}
            id={`desk-leg-${station.id}-${x}`}
            check={{ category: 'solid' }}
          >
            <Box
              size={[0.036, 0.72, 0.7]}
              position={[x, (FLOOR_TOP + 0.814) / 2, -0.07]}
              color="#c6baa0"
            />
          </ModelPart>
        ))}
        <ModelPart id={`cabinet-${station.id}`} check={{ category: 'solid' }}>
          {[-0.235, 0.235].map((x) => (
            <Box
              key={x}
              size={[0.02, 1.61, 0.76]}
              position={[0.945 + x, 0.905, -0.08]}
              color="#93846a"
              roughness={0.7}
              surface="paint"
            />
          ))}
          <Box
            size={[0.45, 1.61, 0.02]}
            position={[0.945, 0.905, -0.45]}
            color="#b9ab92"
          />
          {[0.112, 1.699].map((y) => (
            <Box
              key={y}
              size={[0.49, 0.022, 0.76]}
              position={[0.945, y, -0.08]}
              color="#93846a"
              roughness={0.7}
              surface="wood"
            />
          ))}
          <Box
            size={[0.43, 0.91, 0.025]}
            position={[0.945, 0.62, 0.313]}
            color={CABINET_DOOR}
            round={0.004}
            surface="paint"
          />
          <Box
            size={[0.43, 0.575, 0.025]}
            position={[0.945, 1.385, 0.313]}
            color={CABINET_DOOR}
            round={0.004}
            surface="paint"
          />
        </ModelPart>
        {[0.8, 1.45].map((y) => (
          <Box
            key={y}
            size={[0.015, 0.13, 0.021]}
            position={[0.79, y, 0.335]}
            color="#8f9a8c"
            round={0.003}
            metalness={0.65}
          />
        ))}
        {[0.27, 1, 1.22, 1.58].map((y) => (
          <Box
            key={y}
            size={[0.012, 0.036, 0.008]}
            position={[1.16, y, 0.332]}
            color="#aab2a5"
            metalness={0.7}
            round={0.002}
          />
        ))}
        <ScenePrint
          kind="name"
          name={NAMES[station.id]}
          position={[0.86, 1.34, 0.326]}
        />
        <Box
          size={[0.43, 0.07, 0.02]}
          position={[0.945, FLOOR_TOP + 0.035, 0.315]}
          color="#5f6456"
        />
        {[-1.23, 1.23].flatMap((x) =>
          [-0.53, 0.53].map((z) => (
            <ModelPart
              key={`${x}-${z}`}
              id={`frame-post-${station.id}-${x}-${z}`}
              check={{ category: 'solid' }}
            >
              <Box
                size={[0.045, 1.946, 0.045]}
                position={[x, 1.067, z]}
                color={STEEL}
                round={0.004}
                metalness={0.25}
              />
              <Box
                size={[0.055, 0.04, 0.055]}
                position={[x, FLOOR_TOP + 0.02, z]}
                color="#46554b"
                round={0.003}
              />
              <Screw position={[x, 1.91, z + 0.024]} />
              <Screw position={[x, 0.91, z + 0.024]} />
            </ModelPart>
          )),
        )}
        {[-0.53, 0.53].map((z) => (
          <Box
            key={z}
            size={[2.5, 0.1, 0.045]}
            position={[0, 1.94, z]}
            color={STEEL}
          />
        ))}
        {[-1.23, 1.23].map((x) => (
          <Box
            key={x}
            size={[0.045, 0.1, 1.09]}
            position={[x, 1.94, 0]}
            color={STEEL}
          />
        ))}
        <ModelPart id={`shelf-${station.id}`} check={{ category: 'solid' }}>
          <Box
            size={[1.01, 0.028, 0.2]}
            position={[-0.45, 1.7, -0.39]}
            color={WOOD}
            surface="wood"
          />
        </ModelPart>
        <ModelPart
          id={`shelf-books-${station.id}`}
          position={[-0.85, 1.715, -0.39]}
          check={{ supportY: 1.714, category: 'prop' }}
        >
          <BookSet color={station.color} />
        </ModelPart>
        <ModelPart
          id={`shelf-box-${station.id}`}
          position={[-0.05, 1.714, -0.39]}
          check={{ supportY: 1.714, category: 'prop' }}
        >
          <Box
            size={[0.23, 0.14, 0.15]}
            position={[0, 0.07, 0]}
            color={station.lightColor}
            round={0.006}
          />
          <Box
            size={[0.07, 0.025, 0.002]}
            position={[0, 0.08, 0.076]}
            color={PAPER}
          />
        </ModelPart>
        {[-0.91, 0.03].map((x) => (
          <Rod
            key={x}
            from={[x, 1.686, -0.32]}
            to={[x, 1.53, -0.513]}
            radius={0.005}
            color={STEEL}
          />
        ))}
        <ModelPart id={`ladder-${station.id}`} check={{ category: 'solid' }}>
          {[-0.19, 0.19].map((x) => (
            <Rod
              key={x}
              from={[0.88 + x, FLOOR_TOP + 0.018, 0.83]}
              to={[0.88 + x, 2.1, 0.59]}
              radius={0.018}
              color={STEEL}
            />
          ))}
          {[0.36, 0.68, 1, 1.32, 1.64, 1.96].map((y) => (
            <group key={y}>
              <Box
                size={[0.41, 0.03, 0.085]}
                position={[
                  0.88,
                  y,
                  0.83 -
                    ((y - FLOOR_TOP - 0.018) / (2.1 - FLOOR_TOP - 0.018)) *
                      0.24,
                ]}
                color="#8d9f8c"
                round={0.005}
              />
            </group>
          ))}
        </ModelPart>
        <ModelPart
          id={`pen-cup-${station.id}`}
          position={[0.565, DESK_TOP, 0.17]}
          check={{
            supportY: DESK_TOP,
            category: 'prop',
            min: [0.52, DESK_TOP, 0.12],
            max: [0.62, 1.05, 0.22],
          }}
        >
          <Cylinder
            position={[0, 0.04, 0]}
            radius={0.032}
            height={0.08}
            color={station.color}
          />
          <Cylinder
            position={[0, 0.08, 0]}
            radius={0.026}
            height={0.002}
            color="#625f4e"
          />
          {[0, 1, 2].map((i) => (
            <Rod
              key={i}
              from={[-0.015 + i * 0.013, 0.02, 0]}
              to={[-0.018 + i * 0.018, 0.135 + (i % 2) * 0.02, 0.002]}
              radius={0.0025}
              color={i === 1 ? '#b49b6d' : '#566559'}
            />
          ))}
        </ModelPart>
        <ModelPart id={`outlet-${station.id}`} check={{ category: 'solid' }}>
          <Box
            size={[0.11, 0.16, 0.024]}
            position={[-1.14, 1.04, -0.497]}
            color="#e0dcca"
            round={0.006}
          />
          <Box
            size={[0.025, 0.04, 0.008]}
            position={[-1.14, 1.04, -0.481]}
            color="#6c7465"
          />
        </ModelPart>
        <Box
          size={[0.09, 0.065, 0.001]}
          position={[0.39, 1.34, -0.514]}
          rotation={[0, 0, -0.05]}
          color="#d9c79f"
        />
        <Chair station={station} />
      </StaticGeometry>
    </group>
  )
}

function StationLife({ station }: { station: StationSpec }) {
  return (
    <StaticGeometry revision={0}>
      {station.id === 's1' && (
        <>
          <ModelPart
            id="s1-storage"
            position={[-0.88, FLOOR_TOP, 0.015]}
            check={{ supportY: FLOOR_TOP, category: 'prop' }}
          >
            <Box
              size={[0.34, 0.23, 0.32]}
              position={[0, 0.115, 0]}
              color="#919886"
              round={0.009}
            />
            <Box
              size={[0.35, 0.016, 0.33]}
              position={[0, 0.238, 0]}
              color="#abb19d"
              round={0.006}
            />
            <Box
              size={[0.09, 0.025, 0.005]}
              position={[0, 0.16, 0.163]}
              color="#656e5d"
              round={0.002}
            />
          </ModelPart>
          <ModelPart
            id="s1-notebooks"
            position={[-1.02, DESK_TOP, 0.2]}
            check={{ supportY: DESK_TOP, category: 'prop' }}
          >
            <Box
              size={[0.19, 0.028, 0.14]}
              position={[0, 0.014, 0]}
              color="#e0d9c5"
              round={0.003}
            />
            <Box
              size={[0.17, 0.022, 0.13]}
              position={[0, 0.039, 0]}
              rotation={[0, 0.05, 0]}
              color="#b5c0af"
              round={0.003}
            />
          </ModelPart>
          <ModelPart
            id="s1-mug"
            position={[-0.73, DESK_TOP, 0.235]}
            check={{ supportY: DESK_TOP, category: 'prop' }}
          >
            <Mug position={[0, 0, 0]} />
          </ModelPart>
          <ScenePrint kind="schedule" position={[-0.58, 1.42, -0.514]} />
        </>
      )}
      {station.id === 's2' && (
        <>
          <ModelPart
            id="s2-book-stack"
            position={[-0.92, FLOOR_TOP, 0.05]}
            check={{ supportY: FLOOR_TOP, category: 'prop' }}
          >
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                size={[0.22 - i * 0.015, 0.028, 0.19]}
                position={[0, 0.014 + i * 0.028, 0]}
                rotation={[0, i * 0.05, 0]}
                color={['#7f9281', '#baa17d', '#ded5c0'][i]}
                round={0.002}
              />
            ))}
          </ModelPart>
          <ModelPart
            id="s2-mug"
            position={[0.12, DESK_TOP + 0.012, 0.225]}
            check={{ supportY: DESK_TOP + 0.012, category: 'prop' }}
          >
            <Mug position={[0, 0, 0]} color="#baa58a" />
          </ModelPart>
          <Box
            size={[0.15, 0.012, 0.12]}
            position={[0.12, DESK_TOP + 0.006, 0.225]}
            color={PAPER}
          />
          <Box
            size={[0.3, 0.36, 0.001]}
            position={[-0.52, 1.4, -0.514]}
            color="#3a4947"
          />
          {[0.09, -0.01, -0.11].map((y, i) => (
            <Box
              key={y}
              size={[0.21, 0.04, 0.001]}
              position={[-0.52, 1.4 + y, -0.513]}
              color={['#a66c54', '#baa67f', '#8a9c90'][i]}
            />
          ))}
        </>
      )}
      {station.id === 's3' && (
        <>
          <Basin />
          <ModelPart
            id="s3-sketchbook"
            position={[-0.71, DESK_TOP, -0.28]}
            rotation={[0, 0.12, 0]}
            check={{ supportY: DESK_TOP, category: 'prop' }}
          >
            <Box
              size={[0.2, 0.018, 0.14]}
              position={[0, 0.009, 0]}
              color="#bec7ba"
              round={0.002}
            />
          </ModelPart>
          {[0.49, 0.55, 0.61].map((x, i) => (
            <ModelPart
              key={x}
              id={`s3-paint-${i}`}
              position={[x, DESK_TOP, 0.265]}
              check={{ supportY: DESK_TOP, category: 'prop' }}
            >
              <Cylinder
                radius={0.018}
                height={0.065}
                position={[0, 0.0325, 0]}
                color={['#a9614d', '#7d919a', '#b09b6a'][i]}
              />
              <Cylinder
                radius={0.013}
                height={0.005}
                position={[0, 0.0675, 0]}
                color="#4d5447"
              />
            </ModelPart>
          ))}
          <ModelPart
            id="s3-paper-roll"
            position={[0.35, FLOOR_TOP + 0.313, 0.12]}
            rotation={[0, 0, 0.08]}
            check={{ supportY: FLOOR_TOP, category: 'prop' }}
          >
            <Cylinder radius={0.043} height={0.62} color="#cfc5ad" />
          </ModelPart>
          {[-0.78, -0.53, -0.28].map((x, i) => (
            <group
              key={x}
              position={[x, 1.42 + (i % 2 ? -0.04 : 0.015), -0.514]}
              rotation={[0, 0, i * 0.025 - 0.02]}
            >
              <Box size={[0.17, 0.23, 0.001]} color="#ddd6c4" />
              <Box
                size={[0.09, 0.06, 0.001]}
                position={[0, 0.01, 0.001]}
                color={['#a96a51', '#879b9e', '#baa174'][i]}
              />
            </group>
          ))}
        </>
      )}
      {station.id === 's4' && (
        <>
          <ModelPart
            id="s4-duffel"
            position={[-0.9, FLOOR_TOP, 0.01]}
            rotation={[0, -0.1, 0]}
            check={{ supportY: FLOOR_TOP, category: 'prop' }}
          >
            <Box
              size={[0.34, 0.23, 0.27]}
              position={[0, 0.115, 0]}
              color="#748572"
              round={0.04}
              surface="fabric"
            />
            <Ring
              radius={0.045}
              tube={0.007}
              position={[0, 0.255, 0]}
              color="#495b47"
            />
            <Rod
              from={[-0.05, 0.2, 0]}
              to={[-0.04, 0.255, 0]}
              radius={0.006}
              color="#495b47"
            />
            <Rod
              from={[0.05, 0.2, 0]}
              to={[0.04, 0.255, 0]}
              radius={0.006}
              color="#495b47"
            />
          </ModelPart>
          <ModelPart
            id="s4-water-bottle"
            position={[0.12, DESK_TOP, 0.225]}
            check={{ supportY: DESK_TOP, category: 'prop' }}
          >
            <Cylinder
              radius={0.034}
              height={0.19}
              position={[0, 0.095, 0]}
              color="#7f9da2"
            />
            <Cylinder
              radius={0.02}
              height={0.025}
              position={[0, 0.2025, 0]}
              color="#bdbda9"
            />
          </ModelPart>
          {[-0.6, -0.3].map((x, i) => (
            <group
              key={x}
              position={[x, 1.43, -0.514]}
              rotation={[0, 0, i ? -0.035 : 0.025]}
            >
              <Box size={[0.2, 0.15, 0.001]} color="#e0d8c3" />
              <Box
                size={[0.16, 0.115, 0.001]}
                position={[0, 0.005, 0.001]}
                color={i ? '#a88c6c' : '#8c9e91'}
              />
            </group>
          ))}
        </>
      )}
    </StaticGeometry>
  )
}

function Loft({ station }: { station: StationSpec }) {
  const group = useRef<Group>(null)
  const invalidate = useThree((s) => s.invalidate)
  const active = usePowerStore((s) => s.activeStation),
    cutaway = usePowerStore((s) => s.cutaway)
  const opacity = useRef(1)
  useEffect(() => {
    if (group.current)
      group.current.userData.targetOpacity =
        active === station.id && cutaway ? 0.055 : 1
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
      if (!('isMesh' in object)) return
      const mesh = object as Mesh
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      materials.forEach((material) => {
        const m = material as MeshStandardMaterial
        const transparent = opacity.current < 0.999
        if (m.transparent !== transparent) {
          m.transparent = transparent
          m.needsUpdate = true
        }
        m.opacity = opacity.current
        m.depthWrite = opacity.current > 0.9
      })
      mesh.castShadow = opacity.current > 0.9
      mesh.userData.originalRaycast ??= mesh.raycast
      mesh.raycast =
        opacity.current > 0.9 ? mesh.userData.originalRaycast : () => {}
    })
    invalidate()
  })
  return (
    <group ref={group} name={`loft-${station.id}`}>
      <StaticGeometry revision={0}>
        <Box
          size={[2.46, 0.055, 1.08]}
          position={[0, 2.015, 0]}
          color="#b8a88b"
          surface="wood"
        />
        <Bedding stationId={station.id} />
        {[-1.23, 1.23].map((x) => (
          <group key={x}>
            {[-0.53, 0.53].map((z) => (
              <Box
                key={z}
                size={[0.04, 0.5, 0.04]}
                position={[x, 2.25, z]}
                color={STEEL}
              />
            ))}
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
        color="#a8a493"
        round={0.06}
      />
      {Array.from({ length: 9 }, (_, x) =>
        Array.from({ length: 11 }, (_, z) => (
          <Box
            key={`${x}-${z}`}
            size={[0.599, 0.014, 0.592]}
            position={[-2.46 + x * 0.615, 0.087, -3.05 + z * 0.61]}
            color={(x + z) % 3 === 0 ? '#d4d1c2' : '#dcd8c8'}
            roughness={0.8}
            surface="plaster"
          />
        )),
      )}
      <Box
        size={[5.62, 0.9, 0.12]}
        position={[0, 0.55, -3.31]}
        color="#b7bbac"
        surface="plaster"
      />
      <Box
        size={[5.62, 0.46, 0.12]}
        position={[0, 3.07, -3.31]}
        color="#d8d5c7"
        surface="plaster"
      />
      {[-2.15, 2.15].map((x) => (
        <Box
          key={x}
          size={[1.3, 1.9, 0.12]}
          position={[x, 1.92, -3.31]}
          color="#d8d5c7"
          surface="plaster"
        />
      ))}
      <Box
        size={[5.62, 0.06, 0.14]}
        position={[0, 3.33, -3.31]}
        color="#d4cfc0"
      />
      {[-2.75, 2.75].map((x) => (
        <group key={x}>
          <Box
            size={[0.09, 0.53, 6.6]}
            position={[x, 0.36, -0.02]}
            color="#b5baab"
          />
          <Box
            size={[0.035, 0.06, 6.6]}
            position={[x + (x < 0 ? 0.047 : -0.047), FLOOR_TOP + 0.03, -0.02]}
            color="#939b8c"
          />
        </group>
      ))}
      <group position={[0, 1.96, -3.3]}>
        {[-0.855, 0.855].map((y) => (
          <Box
            key={y}
            size={[3.02, 0.07, 0.06]}
            position={[0, y, 0.09]}
            color="#b5bcb2"
            metalness={0.3}
          />
        ))}
        {[-1.49, 1.49].map((x) => (
          <Box
            key={x}
            size={[0.07, 1.75, 0.06]}
            position={[x, 0, 0.09]}
            color="#b5bcb2"
            metalness={0.3}
          />
        ))}
        {[-0.99, 0, 0.99].map((x) => (
          <Box
            key={x}
            size={[0.035, 1.69, 0.035]}
            position={[x, 0, 0.1]}
            color="#c5cbbf"
          />
        ))}
        <Box
          size={[2.99, 0.035, 0.035]}
          position={[0, 0.12, 0.1]}
          color="#c5cbbf"
        />
        <Box
          size={[3.22, 0.045, 0.23]}
          position={[0, -0.89, 0.08]}
          color="#b9b9a6"
        />
        <Box
          size={[2.98, 0.022, 0.045]}
          position={[0, 0.025, 0.115]}
          color="#8e9b8f"
        />
        <Rod
          from={[-1.78, 0.99, 0.15]}
          to={[1.78, 0.99, 0.15]}
          radius={0.012}
          color="#8e9585"
        />
        {[-1, 1].flatMap((side) =>
          Array.from({ length: 7 }, (_, i) => (
            <mesh
              key={`${side}-${i}`}
              position={[
                side * (1.51 + i * 0.035),
                -0.035,
                0.14 + Math.sin(i) * 0.012,
              ]}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[0.027, 0.034, 1.91, 10]} />
              <meshStandardMaterial
                color={i % 2 ? '#c9cebd' : '#d6d8c6'}
                roughness={1}
              />
            </mesh>
          )),
        )}
        <Box
          size={[0.12, 0.014, 0.035]}
          position={[0.45, 0, 0.135]}
          color="#849685"
          round={0.003}
        />
      </group>
      <Box
        size={[1.45, 0.1, 0.1]}
        position={[0, 3.11, -3.19]}
        color="#cdd2c4"
        round={0.015}
      />
      <Box
        size={[1.28, 0.055, 0.015]}
        position={[0, 3.11, -3.13]}
        color="#e4e1cb"
        emissive="#f8dbab"
        intensity={night ? 1.2 : 0}
      />
      <ScenePrint kind="safety" position={[1.99, 1.7, -3.249]} />
      <group position={[2.03, 2.55, -3.23]}>
        <Cylinder
          radius={0.16}
          height={0.028}
          rotation={[Math.PI / 2, 0, 0]}
          color="#6b796b"
        />
        <Cylinder
          radius={0.14}
          height={0.003}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0, 0.016]}
          color="#dcd9c8"
        />
        <Rod
          from={[0, 0, 0.019]}
          to={[-0.035, 0.07, 0.019]}
          radius={0.003}
          color="#4e5a4d"
        />
        <Rod
          from={[0, 0, 0.021]}
          to={[0.065, 0.02, 0.021]}
          radius={0.002}
          color="#4e5a4d"
        />
      </group>
      <Box
        size={[1.25, 0.006, 2.4]}
        position={[0, FLOOR_TOP + 0.003, 1.85]}
        color="#a99c82"
        surface="fabric"
        round={0.002}
      />
      {[-0.5, -0.25, 0, 0.25, 0.5].map((x) => (
        <Box
          key={x}
          size={[0.004, 0.001, 2.32]}
          position={[x, FLOOR_TOP + 0.0065, 1.85]}
          color="#c5b9a0"
        />
      ))}
      <ModelPart
        id="parcel-stack"
        position={[0.99, FLOOR_TOP, 2.57]}
        check={{ supportY: FLOOR_TOP, category: 'prop' }}
      >
        <Box
          size={[0.4, 0.26, 0.33]}
          position={[0, 0.13, 0]}
          color="#b49c78"
          round={0.003}
        />
        <Box
          size={[0.045, 0.001, 0.331]}
          position={[0, 0.261, 0]}
          color="#cbb58d"
        />
        <group position={[0, 0.26, 0]} rotation={[0, 0.08, 0]}>
          <Box
            size={[0.33, 0.22, 0.27]}
            position={[0, 0.11, 0]}
            color="#c0ad8a"
            round={0.003}
          />
          <Box
            size={[0.04, 0.001, 0.27]}
            position={[0, 0.221, 0]}
            color="#d0bd95"
          />
          <Box
            size={[0.12, 0.001, 0.1]}
            position={[0.07, 0.222, 0]}
            color="#e2dac7"
          />
        </group>
      </ModelPart>
      <ModelPart id="window-bench" check={{ category: 'solid' }}>
        <Box
          size={[1.3, 0.38, 0.42]}
          position={[0, FLOOR_TOP + 0.19, -2.92]}
          color="#b5b19b"
          round={0.01}
        />
        <Box
          size={[1.32, 0.035, 0.44]}
          position={[0, FLOOR_TOP + 0.3975, -2.92]}
          color="#c2ad89"
          surface="wood"
        />
      </ModelPart>
    </StaticGeometry>
  )
}

export function DormRoom({ night }: { night: boolean }) {
  return (
    <group name="four-person-dorm">
      <WindowView key={night ? 'night' : 'day'} night={night} />
      <RoomShell night={night} />
      <StaticGeometry revision={0}>
        <LandingObjects />
      </StaticGeometry>
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
