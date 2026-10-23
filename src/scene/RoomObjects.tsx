import { useEffect, useState } from 'react'
import { LatheGeometry, Vector2 } from 'three'
import type { Point3 } from '../types'
import { Box, Cylinder, Ring, Rod } from './Geometry'
import { ModelPart } from './ModelPart'
import { createTowelGeometry } from './clothGeometry'
import { surfaceMaps } from './materials'

export const FLOOR_TOP = 0.094

export function DrapedTowel({
  position,
  width = 0.3,
  drop = 0.28,
  color = '#c5bdab',
}: {
  position: Point3
  width?: number
  drop?: number
  color?: string
}) {
  const [geometry] = useState(() => createTowelGeometry(width, drop))
  const fabric = surfaceMaps('fabric')
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <mesh position={position} geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        roughness={1}
        normalMap={fabric.normalMap}
        normalScale={[0.12, 0.12]}
      />
    </mesh>
  )
}

export function Basin() {
  const [geometry] = useState(
    () =>
      new LatheGeometry(
        [
          [0, 0],
          [0.125, 0],
          [0.135, 0.008],
          [0.175, 0.096],
          [0.18, 0.105],
          [0.178, 0.115],
          [0.169, 0.116],
          [0.164, 0.105],
          [0.128, 0.019],
          [0, 0.019],
        ].map(([x, y]) => new Vector2(x, y)),
        40,
      ),
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <ModelPart
      id="basin"
      position={[-0.92, FLOOR_TOP, 0.02]}
      check={{
        supportY: FLOOR_TOP,
        category: 'prop',
        min: [-1.11, FLOOR_TOP, -0.18],
        max: [-0.73, 0.23, 0.22],
      }}
    >
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#698a9e" roughness={0.43} />
      </mesh>
      <Box
        size={[0.08, 0.012, 0.055]}
        position={[0, 0.025, 0.015]}
        color="#d6c8a6"
        round={0.005}
      />
    </ModelPart>
  )
}

export function Mug({
  position,
  color = '#c3c6b6',
}: {
  position: Point3
  color?: string
}) {
  const [geometry] = useState(
    () =>
      new LatheGeometry(
        [
          [0, 0],
          [0.025, 0],
          [0.03, 0.006],
          [0.033, 0.075],
          [0.031, 0.08],
          [0.027, 0.08],
          [0.026, 0.012],
          [0, 0.012],
        ].map(([x, y]) => new Vector2(x, y)),
        28,
      ),
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  return (
    <group position={position}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.34} />
      </mesh>
      <Ring
        position={[0.035, 0.047, 0]}
        radius={0.022}
        tube={0.004}
        color={color}
      />
      <Cylinder
        position={[0, 0.053, 0]}
        radius={0.026}
        height={0.001}
        color="#6b5944"
        roughness={0.35}
      />
    </group>
  )
}

export function LandingObjects() {
  return (
    <>
      <ModelPart
        id="drying-rack"
        position={[-2.03, FLOOR_TOP, 2.86]}
        check={{
          supportY: FLOOR_TOP,
          category: 'prop',
          min: [-2.36, FLOOR_TOP, 2.64],
          max: [-1.69, 0.99, 3.08],
        }}
      >
        {[-0.17, 0.17].map((z) => (
          <group key={z}>
            <Rod
              from={[-0.29, 0.012, z]}
              to={[0.18, 0.84, z]}
              radius={0.012}
              color="#a18763"
            />
            <Rod
              from={[0.29, 0.012, z]}
              to={[-0.18, 0.84, z]}
              radius={0.012}
              color="#a18763"
            />
            {[-0.29, 0.29].map((x) => (
              <Cylinder
                key={x}
                position={[x, 0.005, z]}
                radius={0.015}
                height={0.01}
                color="#6f705a"
              />
            ))}
          </group>
        ))}
        {[-0.18, 0.18].map((x) => (
          <Rod
            key={x}
            from={[x, 0.84, -0.19]}
            to={[x, 0.84, 0.19]}
            radius={0.012}
            color="#a18763"
          />
        ))}
        <Rod
          from={[-0.18, 0.84, 0]}
          to={[0.18, 0.84, 0]}
          radius={0.009}
          color="#a18763"
        />
        <group position={[0.18, 0.84, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <DrapedTowel position={[0, 0, 0]} width={0.28} drop={0.3} />
        </group>
      </ModelPart>
      <ModelPart
        id="basketball"
        position={[1.24, FLOOR_TOP + 0.12, 2.91]}
        check={{ supportY: FLOOR_TOP, category: 'prop' }}
      >
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.12, 32, 20]} />
          <meshStandardMaterial color="#ae603b" roughness={0.85} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <Ring
            key={i}
            radius={0.119}
            tube={0.0018}
            rotation={[(i * Math.PI) / 2, (i * Math.PI) / 3, 0]}
            color="#483c31"
          />
        ))}
      </ModelPart>
      <ModelPart
        id="wastebasket"
        position={[0.58, FLOOR_TOP, 2.96]}
        check={{ supportY: FLOOR_TOP, category: 'prop' }}
      >
        <Cylinder
          radius={0.115}
          top={0.14}
          height={0.29}
          position={[0, 0.145, 0]}
          color="#858a7b"
        />
        <Ring
          radius={0.14}
          tube={0.006}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0.29, 0]}
          color="#555e50"
        />
        <Cylinder
          radius={0.131}
          height={0.004}
          position={[0, 0.276, 0]}
          color="#414b40"
        />
      </ModelPart>
      <ModelPart
        id="laundry-basket"
        position={[-0.97, FLOOR_TOP, 2.85]}
        check={{ supportY: FLOOR_TOP, category: 'prop' }}
      >
        <Cylinder
          radius={0.205}
          top={0.225}
          height={0.34}
          position={[0, 0.17, 0]}
          color="#ae9674"
        />
        <Ring
          radius={0.225}
          tube={0.01}
          position={[0, 0.34, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          color="#806f52"
        />
        <Cylinder
          radius={0.21}
          height={0.003}
          position={[0, 0.329, 0]}
          color="#776a53"
        />
        <DrapedTowel
          position={[0, 0.34, 0.214]}
          width={0.22}
          drop={0.16}
          color="#bdb7a7"
        />
      </ModelPart>
    </>
  )
}
