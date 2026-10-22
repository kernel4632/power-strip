import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { CurvePath, LineCurve3, QuadraticBezierCurve3, Vector3 } from 'three'
import type { Group } from 'three'
import {
  DEVICE_MAP,
  STATIONS,
  stationDevices,
  STRIP_LOCAL,
} from '../data/catalog'
import { usePowerStore } from '../store/usePowerStore'
import type { DeviceId, StationId } from '../types'
import { Box, Cylinder, Rod } from './Geometry'

function routedCable(points: Vector3[]) {
  const path = new CurvePath<Vector3>()
  let cursor = points[0]
  for (let i = 1; i < points.length - 1; i++) {
    const corner = points[i],
      before = points[i - 1],
      after = points[i + 1]
    const radius = Math.min(
      0.018,
      corner.distanceTo(before) * 0.25,
      corner.distanceTo(after) * 0.25,
    )
    const entry = corner
      .clone()
      .lerp(before, radius / corner.distanceTo(before))
    const exit = corner.clone().lerp(after, radius / corner.distanceTo(after))
    path.add(new LineCurve3(cursor, entry))
    path.add(new QuadraticBezierCurve3(entry, corner, exit))
    cursor = exit
  }
  path.add(new LineCurve3(cursor, points[points.length - 1]))
  return path
}

function Cable({ id }: { id: DeviceId }) {
  const spec = DEVICE_MAP[id]
  const flow = usePowerStore((s) => s.energyFlow)
  const active = usePowerStore(
    (s) => s.masterOn && s.strips[spec.stationId] && s.devices[id].on && s.devices[id].watts > 0,
  )
  const dots = useRef<Group>(null)
  const point = useRef(new Vector3())
  const [curve] = useState(() => {
    const socketX = STRIP_LOCAL[0] - 0.29 + spec.socket * 0.18
    const start = new Vector3(
      socketX,
      STRIP_LOCAL[1] + 0.05,
      STRIP_LOCAL[2] - 0.064,
    )
    const end = new Vector3(...spec.localPosition).add(
      new Vector3(...spec.cablePort),
    )
    const lane = -0.473 - spec.socket * 0.009
    const points = [
      start,
      new Vector3(socketX, 0.958, lane),
      new Vector3(end.x, 0.944, lane),
    ]
    if (spec.localPosition[1] < 0.8)
      points.push(
        new Vector3(-1.08, 0.8, lane),
        new Vector3(-1.08, end.y, lane),
        new Vector3(end.x, end.y, -0.36),
      )
    else if (spec.localPosition[1] > 1) {
      points.pop()
      points.push(
        new Vector3(0.65, 0.944, lane),
        new Vector3(0.65, 1.215, lane),
        new Vector3(0.65, 1.215, 0.34),
        new Vector3(1.1, 1.215, 0.34),
        new Vector3(1.1, end.y, -0.32),
        new Vector3(end.x, end.y, -0.32),
      )
    } else points.push(new Vector3(end.x, end.y, end.z - 0.05))
    points.push(end)
    return routedCable(points)
  })
  useFrame(({ clock }) => {
    if (!dots.current || !flow || !active) return
    dots.current.children.forEach((child, i) => {
      curve.getPointAt((clock.elapsedTime * 0.12 + i / 3) % 1, point.current)
      child.position.copy(point.current)
    })
  })
  return (
    <group name={`cable-${id}`}>
      <mesh>
        <tubeGeometry args={[curve, 48, 0.0032, 5, false]} />
        <meshStandardMaterial color="#5c6b61" roughness={0.8} />
      </mesh>
      {flow && (
        <mesh>
          <tubeGeometry args={[curve, 48, 0.0045, 5, false]} />
          <meshBasicMaterial
            color={spec.color}
            transparent
            opacity={active ? 0.8 : 0.15}
            depthWrite={false}
          />
        </mesh>
      )}
      <group ref={dots} visible={flow && active}>
        {[0, 1, 2].map((i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.009, 7, 5]} />
            <meshBasicMaterial color="#e5c898" />
          </mesh>
        ))}
      </group>
      <Box
        size={[0.025, 0.016, 0.022]}
        position={[
          spec.localPosition[0] + spec.cablePort[0],
          spec.localPosition[1] + spec.cablePort[1],
          spec.localPosition[2] + spec.cablePort[2],
        ]}
        color="#5e7167"
        round={0.003}
      />
    </group>
  )
}
function Strip({ id }: { id: StationId }) {
  const on = usePowerStore((s) => s.masterOn && s.strips[id])
  const select = usePowerStore((s) => s.select),
    devices = stationDevices(id)
  const [supply] = useState(() =>
    routedCable([
      new Vector3(0.13, 0.89, -0.405),
      new Vector3(0.19, 0.89, -0.498),
      new Vector3(-1.08, 0.89, -0.498),
      new Vector3(-1.14, 1.04, -0.472),
    ]),
  )
  return (
    <group name={`power-strip-${id}`}>
      {devices.map((d) => (
        <Cable key={d.id} id={d.id} />
      ))}
      <mesh>
        <tubeGeometry args={[supply, 35, 0.005, 6, false]} />
        <meshStandardMaterial color="#c8c9ba" roughness={0.8} />
      </mesh>
      {[-0.9, -0.63, -0.16, 0.16].map((x) => (
        <Box
          key={x}
          size={[0.015, 0.012, 0.018]}
          position={[x, 0.925, -0.493]}
          color="#c6c5b4"
          round={0.003}
        />
      ))}
      <group
        position={STRIP_LOCAL}
        onClick={(e) => {
          e.stopPropagation()
          if (e.delta < 5) select(id)
        }}
      >
        <Box size={[0.86, 0.052, 0.122]} color="#e8e6d9" round={0.014} />
        <Box
          size={[0.826, 0.002, 0.101]}
          position={[0, 0.027, 0]}
          color="#f0eee2"
          round={0.001}
        />
        {Array.from({ length: 4 }, (_, socket) => (
          <group
            key={socket}
            name={`socket-${id}-${socket + 1}`}
            position={[-0.29 + socket * 0.18, 0.029, 0]}
          >
            <Box size={[0.139, 0.002, 0.089]} color="#d3d8cb" round={0.001} />
            {[-0.019, 0.019].map((x) => (
              <Box
                key={x}
                size={[0.006, 0.002, 0.019]}
                position={[x, 0.002, 0.017]}
                color="#4c5d53"
              />
            ))}
            {devices.some(d => d.socket === socket) && <group>
            <Box
              size={[0.068, 0.034, 0.07]}
              position={[0, 0.019, -0.012]}
              color="#a5b3a6"
              round={0.007}
            />
            <Box
              size={[0.047, 0.002, 0.044]}
              position={[0, 0.037, -0.012]}
              color="#b8c4b6"
              round={0.001}
            />
            <Rod
              from={[0, 0.021, -0.044]}
              to={[0, 0.021, -0.064]}
              radius={0.006}
              color="#829886"
            />
            </group>}
          </group>
        ))}
        <Box
          size={[0.066, 0.01, 0.073]}
          position={[0.37, 0.032, 0]}
          color={on ? '#b68d5f' : '#969e8d'}
          emissive="#d6ae75"
          intensity={on ? 0.5 : 0}
          round={0.004}
        />
        <Box
          size={[0.02, 0.002, 0.032]}
          position={[0.37, 0.038, 0]}
          color={on ? '#e2cc92' : '#788772'}
        />
        {[-0.39, 0.32].map((x) => (
          <Cylinder
            key={x}
            radius={0.0035}
            height={0.001}
            position={[x, 0.029, 0.044]}
            color="#929d8c"
            metalness={0.6}
          />
        ))}
      </group>
    </group>
  )
}
export function PowerStrip() {
  return (
    <>
      {STATIONS.map((station) => (
        <group
          key={station.id}
          position={station.position}
          rotation={[0, station.rotation, 0]}
        >
          <Strip id={station.id} />
        </group>
      ))}
    </>
  )
}
