import { Box, Cylinder, Rod, Sphere, Ring } from './Geometry'
import type { Point3 } from '../types'

const WOOD = '#ba8758'
const LIGHT_WOOD = '#d0a675'
const INK = '#46504a'

function Plant({ position, scale = 1 }: { position: Point3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <Cylinder
        radius={0.21}
        top={0.25}
        height={0.38}
        position={[0, 0.19, 0]}
        color="#d6c5a9"
      />
      <Cylinder
        radius={0.225}
        height={0.018}
        position={[0, 0.385, 0]}
        color="#554332"
      />
      {Array.from({ length: 8 }, (_, i) => {
        const angle = i * 2.4
        const height = 0.72 + (i % 3) * 0.16
        const x = Math.sin(angle) * 0.27
        const z = Math.cos(angle) * 0.27
        return (
          <group key={i}>
            <Rod
              from={[0, 0.35, 0]}
              to={[x, height, z]}
              radius={0.009}
              color="#5b7552"
            />
            <group position={[x, height, z]} rotation={[0.5, angle, 0.4]}>
              <Sphere
                scale={[0.12, 0.3, 0.035]}
                color={i % 2 ? '#658060' : '#82946a'}
              />
            </group>
          </group>
        )
      })}
    </group>
  )
}

function Books({ position, count = 5 }: { position: Point3; count?: number }) {
  const colors = [
    '#9f5845',
    '#e3c994',
    '#84998b',
    '#555f6e',
    '#e9dfc5',
    '#b68c65',
  ]
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => (
        <group
          key={i}
          position={[i * 0.105, 0, 0]}
          rotation={[0, 0, i === count - 1 ? -0.12 : 0]}
        >
          <Box
            size={[0.09, 0.36 + (i % 3) * 0.055, 0.27]}
            position={[0, 0.21, 0]}
            color={colors[i % colors.length]}
          />
          <Box
            size={[0.05, 0.012, 0.002]}
            position={[0, 0.33, 0.137]}
            color="#ede7d8"
          />
          <Box
            size={[0.05, 0.008, 0.002]}
            position={[0, 0.09, 0.137]}
            color="#ede7d8"
          />
        </group>
      ))}
    </group>
  )
}

function Bed({ y, duvet }: { y: number; duvet: string }) {
  return (
    <group position={[-2.82, y, -1.08]}>
      <Box size={[1.74, 0.13, 3.18]} color={WOOD} round={0.025} />
      <Box
        size={[1.58, 0.19, 2.99]}
        position={[0, 0.15, 0]}
        color="#eee7d7"
        round={0.07}
      />
      <Box
        size={[1.62, 0.17, 2.12]}
        position={[0, 0.29, 0.36]}
        color={duvet}
        round={0.07}
        surface="fabric"
        roughness={0.95}
      />
      <Box
        size={[1.64, 0.045, 0.28]}
        position={[0, 0.39, -0.61]}
        color={duvet === '#a4b4a1' ? '#becbb8' : '#d7b6a3'}
        round={0.02}
      />
      {[-0.53, -0.23, 0.1, 0.42, 0.65].map((x, i) => (
        <Box
          key={x}
          size={[0.014, 0.008, 1.82]}
          position={[x, 0.38, 0.45]}
          rotation={[0, 0.008 * i, 0]}
          color={duvet === '#a4b4a1' ? '#93a78f' : '#b18c7b'}
        />
      ))}
      <Box
        size={[1.04, 0.18, 0.6]}
        position={[0.07, 0.3, -1.04]}
        rotation={[0, 0.06, 0]}
        color="#f0ebdf"
        round={0.08}
        surface="fabric"
      />
      <Box
        size={[0.34, 0.26, 0.36]}
        position={[-0.48, 0.31, -1.07]}
        rotation={[0, -0.12, 0.1]}
        color="#bba17c"
        round={0.09}
      />
    </group>
  )
}

function BunkBed() {
  return (
    <group>
      {[-3.72, -1.92].flatMap((x) =>
        [-2.72, 0.55].map((z) => (
          <Box
            key={`${x}-${z}`}
            size={[0.085, 2.9, 0.085]}
            position={[x, 1.53, z]}
            color={INK}
            round={0.018}
          />
        )),
      )}
      <Bed y={0.52} duvet="#bf9b86" />
      <Bed y={2.05} duvet="#a4b4a1" />
      {[0.55, -2.72].map((z) => (
        <group key={z}>
          <Box
            size={[1.86, 0.07, 0.065]}
            position={[-2.82, 2.83, z]}
            color={INK}
          />
          <Box
            size={[1.86, 0.07, 0.065]}
            position={[-2.82, 2.51, z]}
            color={INK}
          />
          {[-3.4, -2.84, -2.28].map((x) => (
            <Box
              key={x}
              size={[0.035, 0.35, 0.035]}
              position={[x, 2.67, z]}
              color={INK}
            />
          ))}
        </group>
      ))}
      <Box
        size={[0.05, 0.07, 2.46]}
        position={[-1.92, 2.81, -1.48]}
        color={INK}
      />
      <Box
        size={[0.045, 0.05, 2.46]}
        position={[-1.92, 2.51, -1.48]}
        color={INK}
      />
      {[-2.5, -1.7, -0.9].map((z) => (
        <Box
          key={z}
          size={[0.035, 0.34, 0.035]}
          position={[-1.92, 2.66, z]}
          color={INK}
        />
      ))}
      <group position={[-2.15, 0, 0.79]} rotation={[-0.1, 0, 0]}>
        {[-0.26, 0.26].map((x) => (
          <Box
            key={x}
            size={[0.05, 2.3, 0.07]}
            position={[x, 1.22, 0]}
            color={INK}
          />
        ))}
        {[0.35, 0.72, 1.09, 1.46, 1.83, 2.2].map((y) => (
          <Box
            key={y}
            size={[0.58, 0.055, 0.09]}
            position={[0, y, 0]}
            color={LIGHT_WOOD}
            round={0.018}
          />
        ))}
      </group>
      <Box
        size={[0.48, 0.61, 0.23]}
        position={[-1.83, 1.39, -0.6]}
        rotation={[0, 0, -0.06]}
        color="#b56c4f"
        round={0.08}
      />
      <Box
        size={[0.38, 0.23, 0.07]}
        position={[-1.79, 1.27, -0.46]}
        color="#995f47"
        round={0.04}
      />
      <Ring
        radius={0.12}
        tube={0.018}
        position={[-1.81, 1.73, -0.57]}
        color="#80533c"
      />
      {[0, 0.38].map((offset) => (
        <Box
          key={offset}
          size={[0.25, 0.1, 0.47]}
          position={[-3.05 + offset, 0.13, 0.92]}
          rotation={[0, -0.15, 0]}
          color="#b7ad94"
          round={0.055}
        />
      ))}
      {[-3.1, -2.35].map((x) => (
        <Box
          key={x}
          size={[0.65, 0.24, 0.73]}
          position={[x, 0.21, -1.4]}
          color="#c4b59a"
          round={0.035}
        />
      ))}
    </group>
  )
}

function Window({ night }: { night: boolean }) {
  return (
    <group position={[0.65, 2.35, -3.23]}>
      <Box size={[2.85, 1.39, 0.09]} color="#b8a185" />
      <Box
        size={[2.65, 1.23, 0.045]}
        position={[0, 0, 0.07]}
        color={night ? '#243f57' : '#b5d0ce'}
        emissive={night ? '#21364f' : '#b5d0ce'}
        intensity={0.28}
      />
      {Array.from({ length: 11 }, (_, i) => (
        <group key={i} position={[-1.15 + i * 0.23, -0.44, 0.1]}>
          <Box
            size={[0.19, 0.15 + (i % 4) * 0.09, 0.012]}
            color={night ? '#40546a' : '#9ab9b7'}
          />
          {night && (
            <Box
              size={[0.04, 0.04, 0.014]}
              position={[0, 0.02, 0.014]}
              color="#efd59a"
              emissive="#efd59a"
              intensity={0.7}
            />
          )}
        </group>
      ))}
      <Box size={[0.055, 1.29, 0.07]} position={[0, 0, 0.13]} color="#eee9dc" />
      <Box
        size={[2.7, 0.045, 0.07]}
        position={[0, 0.07, 0.13]}
        color="#eee9dc"
      />
      <Box
        size={[3.02, 0.09, 0.33]}
        position={[0, -0.72, 0.12]}
        color="#d0b087"
      />
      <Rod
        from={[-1.84, 0.85, 0.26]}
        to={[1.84, 0.85, 0.26]}
        radius={0.025}
        color="#786852"
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh
              key={i}
              position={[
                side * (1.4 + i * 0.075),
                -0.03,
                0.21 + Math.sin(i * 1.7) * 0.035,
              ]}
              castShadow
            >
              <cylinderGeometry args={[0.052, 0.065, 1.67, 8]} />
              <meshStandardMaterial
                color={i % 2 ? '#d8cdb9' : '#e6dcc9'}
                roughness={1}
              />
            </mesh>
          ))}
        </group>
      ))}
      <Cylinder
        radius={0.085}
        top={0.1}
        height={0.16}
        position={[-0.89, -0.59, 0.14]}
        color="#bd8060"
      />
      <Sphere
        position={[-0.89, -0.44, 0.14]}
        scale={[0.13, 0.15, 0.12]}
        color="#8c9f73"
      />
    </group>
  )
}

function Desk() {
  return (
    <group>
      <Box
        size={[4.33, 0.12, 1.57]}
        position={[1.5, 1.12, -1.86]}
        color={LIGHT_WOOD}
        round={0.035}
      />
      <Box
        size={[4.28, 0.035, 1.53]}
        position={[1.5, 1.183, -1.86]}
        color="#d1ad80"
        surface="wood"
      />
      {[-0.57, 3.55].map((x) => (
        <group key={x}>
          {[-2.53, -1.19].map((z) => (
            <Box
              key={z}
              size={[0.07, 1.03, 0.07]}
              position={[x, 0.59, z]}
              color={INK}
            />
          ))}
          <Box
            size={[0.055, 0.065, 1.39]}
            position={[x, 0.26, -1.86]}
            color={INK}
          />
        </group>
      ))}
      <Box
        size={[0.84, 0.93, 1.24]}
        position={[3.07, 0.58, -1.9]}
        color="#b98c61"
        round={0.02}
      />
      {[0.28, 0.58, 0.88].map((y) => (
        <group key={y}>
          <Box
            size={[0.79, 0.27, 0.04]}
            position={[3.07, y, -1.25]}
            color="#c79b6d"
          />
          <Box
            size={[0.23, 0.018, 0.04]}
            position={[3.07, y + 0.06, -1.21]}
            color="#6c5c48"
          />
        </group>
      ))}
      <Box
        size={[1.7, 0.009, 0.7]}
        position={[1.5, 1.207, -1.58]}
        color="#6d8077"
        round={0.004}
      />
      <Box
        size={[0.76, 0.045, 0.26]}
        position={[1.11, 1.235, -1.6]}
        color="#e5e2d5"
        round={0.015}
      />
      {Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 11 }, (_, col) => (
          <Box
            key={`${row}-${col}`}
            size={[0.045, 0.008, 0.043]}
            position={[0.78 + col * 0.062, 1.262, -1.68 + row * 0.062]}
            color={(col + row) % 8 === 0 ? '#d29977' : '#d0d1c5'}
          />
        )),
      )}
      <Box
        size={[0.26, 0.008, 0.035]}
        position={[1.12, 1.263, -1.49]}
        color="#b9c4b5"
      />
      <Sphere
        position={[1.72, 1.24, -1.57]}
        scale={[0.07, 0.035, 0.11]}
        color="#dedccc"
      />
      <Books position={[3.11, 1.2, -2.43]} count={4} />
      <Cylinder
        radius={0.075}
        height={0.16}
        position={[-0.42, 1.28, -1.46]}
        color="#b78765"
      />
      {[0, 1, 2, 3].map((i) => (
        <Rod
          key={i}
          from={[-0.45 + i * 0.018, 1.29, -1.46]}
          to={[-0.47 + i * 0.035, 1.55 + (i % 2) * 0.04, -1.45]}
          radius={0.006}
          color={i % 2 ? '#6d7a73' : '#c9a65f'}
        />
      ))}
      <group position={[1.3, 0.08, -0.19]} rotation={[0, -0.15, 0]}>
        <Cylinder
          radius={0.045}
          height={0.46}
          position={[0, 0.3, 0]}
          color="#414844"
          metalness={0.6}
        />
        {Array.from({ length: 5 }, (_, i) => {
          const a = (i * Math.PI * 2) / 5
          return (
            <group key={i}>
              <Rod
                from={[0, 0.14, 0]}
                to={[Math.cos(a) * 0.37, 0.06, Math.sin(a) * 0.37]}
                radius={0.025}
              />
              <Cylinder
                radius={0.055}
                height={0.04}
                position={[Math.cos(a) * 0.37, 0.05, Math.sin(a) * 0.37]}
                rotation={[Math.PI / 2, 0, 0]}
                color="#333a36"
              />
            </group>
          )
        })}
        <Box
          size={[0.66, 0.14, 0.64]}
          position={[0, 0.56, 0]}
          color="#b58b66"
          round={0.06}
          surface="fabric"
        />
        <Box
          size={[0.61, 0.58, 0.1]}
          position={[0, 0.98, 0.28]}
          rotation={[-0.13, 0, 0]}
          color="#bc9472"
          round={0.045}
        />
        {[-0.35, 0.35].map((x) => (
          <group key={x}>
            <Rod from={[x, 0.55, 0.19]} to={[x, 0.83, 0.14]} radius={0.018} />
            <Box
              size={[0.075, 0.06, 0.4]}
              position={[x, 0.84, -0.02]}
              color="#484e45"
              round={0.02}
            />
          </group>
        ))}
      </group>
      <Box
        size={[0.8, 0.055, 0.24]}
        position={[3.24, 2.38, -3.02]}
        color={LIGHT_WOOD}
      />
      <Books position={[3.02, 2.42, -3.02]} count={3} />
    </group>
  )
}

export function DormRoom({ night }: { night: boolean }) {
  return (
    <group>
      <Box
        size={[8.32, 0.35, 6.82]}
        position={[0, -0.145, 0]}
        color="#c7bca8"
        round={0.13}
      />
      <Box size={[8.1, 0.06, 6.6]} position={[0, 0.05, 0]} color="#b39472" />
      {Array.from({ length: 19 }, (_, i) =>
        Array.from({ length: 4 }, (_, j) => (
          <Box
            key={`${i}-${j}`}
            size={[0.414, 0.015, 1.62]}
            position={[-3.91 + i * 0.435, 0.086, -2.46 + j * 1.64]}
            color={
              ['#cba77d', '#c7a178', '#d0ae85', '#c3a07a', '#d4b28b'][
                (i * 3 + j) % 5
              ]
            }
          />
        )),
      )}
      <Box
        size={[8.3, 3.6, 0.16]}
        position={[0, 1.87, -3.31]}
        color={night ? '#b4b7ae' : '#e3dfd0'}
        surface="plaster"
      />
      <Box
        size={[0.16, 3.6, 6.62]}
        position={[-4.09, 1.87, 0]}
        color={night ? '#9ba599' : '#c5cdb9'}
        surface="plaster"
      />
      <Box
        size={[0.035, 1.14, 6.5]}
        position={[-3.99, 0.65, 0]}
        color="#aebba5"
      />
      <Box
        size={[0.05, 0.045, 6.5]}
        position={[-3.97, 1.23, 0]}
        color="#92a18b"
      />
      <Box
        size={[8.05, 0.13, 0.035]}
        position={[0, 0.15, -3.21]}
        color="#cab491"
      />
      <Box
        size={[0.035, 0.13, 6.5]}
        position={[-3.97, 0.15, 0]}
        color="#b6ad94"
      />
      <Box
        size={[8.35, 0.055, 0.2]}
        position={[0, 3.69, -3.31]}
        color="#f0eadb"
      />
      <Box
        size={[0.2, 0.055, 6.7]}
        position={[-4.09, 3.69, 0]}
        color="#d6ddc9"
      />
      <Window night={night} />
      <BunkBed />
      <Desk />
      <group position={[-3.96, 2.37, 1.73]} rotation={[0, Math.PI / 2, 0]}>
        <Box size={[1.38, 1.2, 0.04]} color="#9c7754" />
        <Box size={[1.29, 1.1, 0.02]} position={[0, 0, 0.03]} color="#bc9a73" />
        {[
          [-0.36, 0.18, -0.07],
          [0.24, 0.23, 0.07],
          [-0.19, -0.27, 0.05],
          [0.39, -0.3, -0.12],
        ].map(([x, y, r], i) => (
          <group key={i} position={[x, y, 0.06]} rotation={[0, 0, r]}>
            <Box
              size={[0.4, 0.36, 0.012]}
              color={i === 1 ? '#a9b9a0' : '#e9ddbe'}
            />
            <Box
              size={[0.3, 0.18, 0.005]}
              position={[0, 0.015, 0.01]}
              color={['#b38061', '#d7c8a7', '#9ba995', '#b2bfba'][i]}
            />
            <Sphere
              position={[0, 0.15, 0.02]}
              scale={[0.018, 0.018, 0.018]}
              color="#765f48"
            />
          </group>
        ))}
      </group>
      <group position={[-0.85, 2.32, -3.19]}>
        <Box size={[0.49, 0.66, 0.03]} color="#8b7458" />
        <Box
          size={[0.43, 0.59, 0.01]}
          position={[0, 0, 0.025]}
          color="#eee4cc"
        />
        <Cylinder
          radius={0.11}
          height={0.006}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0.04, 0.1, 0.04]}
          color="#c68b67"
        />
        <Box
          size={[0.36, 0.14, 0.007]}
          position={[0, -0.13, 0.04]}
          color="#859380"
        />
      </group>
      <group position={[-0.35, 0.11, 1.59]} rotation={[0, -0.07, 0]}>
        <Box size={[3.55, 0.018, 2.18]} color="#b9b9a0" round={0.008} />
        <Box
          size={[3.35, 0.005, 1.98]}
          position={[0, 0.014, 0]}
          color="#c6c4aa"
          surface="fabric"
        />
        {[-0.84, -0.72, 0.72, 0.84].map((z) => (
          <Box
            key={z}
            size={[3.25, 0.004, 0.022]}
            position={[0, 0.019, z]}
            color="#8e9a83"
          />
        ))}
        {Array.from({ length: 21 }, (_, i) => (
          <group key={i}>
            {[-1, 1].map((side) => (
              <Box
                key={side}
                size={[0.018, 0.012, 0.1]}
                position={[-1.53 + i * 0.15, 0, side * 1.12]}
                color="#ded6ba"
              />
            ))}
          </group>
        ))}
      </group>
      <group position={[-0.65, 0.15, 1.9]}>
        <Cylinder
          radius={0.55}
          height={0.11}
          position={[0, 0.55, 0]}
          color={LIGHT_WOOD}
        />
        {[0, 1, 2].map((i) => {
          const a = (i * Math.PI * 2) / 3
          return (
            <Rod
              key={i}
              from={[Math.cos(a) * 0.31, 0.04, Math.sin(a) * 0.31]}
              to={[Math.cos(a) * 0.22, 0.51, Math.sin(a) * 0.22]}
              radius={0.035}
              color={WOOD}
            />
          )
        })}
        <Box
          size={[0.36, 0.035, 0.26]}
          position={[-0.12, 0.625, 0.04]}
          rotation={[0, 0.22, 0]}
          color="#697d73"
        />
        <Box
          size={[0.32, 0.027, 0.25]}
          position={[-0.1, 0.659, 0.03]}
          rotation={[0, 0.12, 0]}
          color="#e5dbbd"
        />
        <Cylinder
          radius={0.075}
          height={0.11}
          position={[0.23, 0.66, -0.07]}
          color="#bb795b"
        />
        <Cylinder
          radius={0.06}
          height={0.005}
          position={[0.23, 0.717, -0.07]}
          color="#604233"
        />
        <Ring
          radius={0.046}
          tube={0.012}
          position={[0.32, 0.67, -0.07]}
          color="#bb795b"
        />
      </group>
      <Cylinder
        radius={0.39}
        height={0.38}
        position={[0.77, 0.29, 2.18]}
        color="#a4b0a0"
      />
      <Cylinder
        radius={0.4}
        height={0.06}
        position={[0.77, 0.51, 2.18]}
        color="#b0bca9"
      />
      <Plant position={[-3.31, 0.1, 2.43]} scale={1.6} />
      <Plant position={[3.57, 0.1, 2.36]} scale={1.1} />
      <Box
        size={[0.76, 0.1, 0.8]}
        position={[3.17, 0.11, 0.32]}
        color="#706f60"
        round={0.025}
      />
      <Box
        size={[0.15, 0.23, 0.025]}
        position={[3.68, 1.38, -3.2]}
        color="#f1eadc"
        round={0.015}
      />
      <Box
        size={[0.065, 0.12, 0.013]}
        position={[3.68, 1.38, -3.178]}
        color="#d6d5c8"
      />
    </group>
  )
}
