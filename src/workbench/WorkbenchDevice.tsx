import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { BenchBox, BenchCylinder, BenchRod, Cable, Screen } from './WorkbenchGeometry'
import type { BenchItem, BenchPoint } from './types'
import { BENCH_MAP } from './catalog'
import { BENCH_Y, plugPoint } from './layout'

const MODEL_GROUND: Record<BenchItem['kind'], number> = {
  kettle: .04,
  dryer: -.1,
  cooker: .03,
  gaming: .0075,
  macbook: .0075,
  lamp: 0,
  phone: .0175,
  tablet: .0175,
}

const CORD_PORT: Record<BenchItem['kind'], BenchPoint> = {
  kettle: [-.2, -.26],
  dryer: [-.08, -.17],
  cooker: [0, -.34],
  gaming: [.34, -.08],
  macbook: [.34, -.08],
  lamp: [.12, .12],
  phone: [0, .17],
  tablet: [0, .25],
}

function Kettle({ color }: { color: string }) {
  return <group>
    <BenchCylinder position={[0, .27, 0]} radius={.265} height={.46} top={.22} color={color} roughness={.28} metalness={.38} />
    <BenchCylinder position={[0, .505, 0]} radius={.225} height={.035} color="#454d49" metalness={.56} />
    <BenchCylinder position={[0, .526, 0]} radius={.16} height={.024} top={.13} color="#69716b" metalness={.4} />
    <BenchCylinder position={[0, .544, 0]} radius={.055} height={.025} color="#d1b581" metalness={.35} />
    <BenchCylinder position={[0, .045, 0]} radius={.255} height={.045} color="#555e59" metalness={.65} />
    <BenchRod from={[-.22, .38, 0]} to={[-.34, .61, 0]} radius={.027} color="#4b514d" />
    <BenchRod from={[-.34, .61, 0]} to={[.12, .65, 0]} radius={.027} color="#4b514d" />
    <BenchCylinder position={[.265, .36, 0]} rotation={[0, 0, -Math.PI / 2]} radius={.075} height={.24} top={.028} color={color} metalness={.25} />
    <BenchBox size={[.036, .11, .026]} position={[.025, .27, -.232]} color="#a5b9a7" radius={.012} />
    <BenchBox size={[.052, .014, .034]} position={[.02, .22, -.238]} color="#65786c" radius={.006} />
    <BenchCylinder position={[-.08, .055, .15]} radius={.026} height={.016} color="#c5aa76" metalness={.45} />
  </group>
}

function Dryer({ color }: { color: string }) {
  return <group rotation={[0, 0, -.18]}>
    <BenchCylinder position={[0, .28, 0]} rotation={[0, 0, Math.PI / 2]} radius={.132} height={.43} top={.115} color={color} metalness={.25} roughness={.3} />
    <BenchCylinder position={[.27, .28, 0]} rotation={[0, 0, Math.PI / 2]} radius={.079} height={.17} color="#39423f" metalness={.48} />
    <BenchCylinder position={[.36, .28, 0]} rotation={[0, 0, Math.PI / 2]} radius={.062} height={.02} color="#222a27" />
    <BenchBox size={[.135, .285, .13]} position={[-.08, .045, 0]} color={color} radius={.045} metalness={.18} />
    <BenchBox size={[.09, .024, .024]} position={[-.08, .18, .07]} color="#4d5d55" radius={.01} />
    <BenchCylinder position={[-.08, .23, .02]} radius={.025} height={.016} color="#d8c399" />
    {Array.from({ length: 9 }, (_, index) => <BenchCylinder key={index} position={[.36, .28 + Math.cos(index / 9 * Math.PI * 2) * .045, Math.sin(index / 9 * Math.PI * 2) * .045]} rotation={[0, 0, Math.PI / 2]} radius={.004} height={.022} color="#707873" />)}
    <BenchBox size={[.045, .075, .028]} position={[.02, .28, .122]} color="#8a958e" radius={.01} />
  </group>
}

function Cooker({ color }: { color: string }) {
  return <group>
    <BenchCylinder position={[0, .155, 0]} radius={.34} height={.26} top={.315} color={color} metalness={.18} roughness={.3} />
    <BenchCylinder position={[0, .295, 0]} radius={.325} height={.025} color="#353e3a" metalness={.45} />
    <BenchCylinder position={[0, .315, 0]} radius={.285} height={.016} top={.27} color="#282f2c" metalness={.48} roughness={.22} />
    <mesh position={[0, .326, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.17, .195, 40]} /><meshStandardMaterial color="#c89b62" metalness={.38} roughness={.36} /></mesh>
    <mesh position={[0, .327, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[.235, .244, 40]} /><meshStandardMaterial color="#64736c" metalness={.25} roughness={.42} /></mesh>
    <BenchCylinder position={[0, .365, 0]} radius={.04} height={.045} color="#d1bd92" metalness={.32} />
    <BenchRod from={[-.33, .19, 0]} to={[-.48, .19, 0]} radius={.035} color={color} />
    <BenchRod from={[.33, .19, 0]} to={[.48, .19, 0]} radius={.035} color={color} />
    <BenchBox size={[.25, .045, .065]} position={[0, .095, .34]} color="#343c38" radius={.018} />
    <BenchCylinder position={[-.07, .1, .38]} radius={.018} height={.024} color="#c4a56f" metalness={.3} />
    <BenchCylinder position={[0, .1, .38]} radius={.012} height={.016} color="#728f7d" metalness={.28} />
    <BenchCylinder position={[.07, .1, .38]} radius={.018} height={.024} color="#c4a56f" metalness={.3} />
  </group>
}

function Laptop({ color, gaming }: { color: string; gaming?: boolean }) {
  const keyColor = gaming ? '#456d75' : '#6d7772'
  return <group>
    <BenchBox size={[.75, .038, .51]} position={[0, .025, .07]} color={color} radius={.028} metalness={.58} roughness={.28} />
    <BenchBox size={[.58, .007, .255]} position={[0, .048, .045]} color="#263330" radius={.006} />
    {Array.from({ length: 30 }, (_, index) => <BenchBox key={index} size={[.042, .008, .027]} position={[-.255 + (index % 10) * .057, .056, -.075 + Math.floor(index / 10) * .052]} color={keyColor} radius={.004} metalness={.28} />)}
    <BenchBox size={[.16, .006, .075]} position={[0, .056, .19]} color="#8a9690" radius={.009} metalness={.2} />
    <BenchBox size={[.035, .006, .19]} position={[-.31, .052, .085]} color="#68746e" radius={.006} />
    <BenchBox size={[.035, .006, .19]} position={[.31, .052, .085]} color="#68746e" radius={.006} />
    <group position={[0, .03, -.19]} rotation={[-.15, 0, 0]}>
      <BenchBox size={[.75, .47, .025]} position={[0, .23, 0]} color={color} radius={.023} metalness={.56} roughness={.28} />
      <Screen size={[.675, .386]} color={gaming ? '#1c3546' : '#18363d'} glow />
      <mesh position={[0, .23, .014]}><circleGeometry args={[.018, 20]} /><meshStandardMaterial color="#c5b789" metalness={.48} /></mesh>
      {gaming && <BenchBox size={[.06, .018, .012]} position={[0, .035, .026]} color="#c69b62" radius={.006} />}
    </group>
  </group>
}

function Lamp({ on }: { on: boolean }) {
  return <group>
    <BenchCylinder position={[0, .025, 0]} radius={.18} height={.05} color="#c9b789" metalness={.42} roughness={.3} />
    <BenchCylinder position={[0, .055, 0]} radius={.055} height={.018} color="#757e75" metalness={.54} />
    <BenchRod from={[0, .06, 0]} to={[.055, .37, 0]} radius={.018} color="#897858" />
    <BenchCylinder position={[.055, .37, 0]} radius={.035} height={.055} color="#c7b486" metalness={.45} />
    <BenchRod from={[.055, .39, 0]} to={[-.13, .57, 0]} radius={.017} color="#897858" />
    <BenchCylinder position={[-.14, .57, 0]} radius={.145} height={.13} top={.075} color="#d2bd8e" metalness={.26} />
    <mesh position={[-.14, .505, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[.115, 32]} /><meshStandardMaterial color="#fff0c7" emissive="#ffd47d" emissiveIntensity={on ? 1.3 : .05} /></mesh>
    <BenchCylinder position={[.11, .052, .035]} radius={.025} height={.012} color="#716a54" metalness={.28} />
  </group>
}

function Phone({ tablet, color }: { tablet?: boolean; color: string }) {
  const width = tablet ? .7 : .24
  const depth = tablet ? .51 : .39
  return <group>
    <BenchBox size={[width, .04, depth]} position={[0, .025, 0]} color={color} radius={.028} metalness={.58} roughness={.26} />
    <BenchBox size={[width - .065, .008, depth - .075]} position={[0, .049, 0]} color="#202b2a" radius={.025} />
    <Screen size={[width - .09, depth - .105]} color="#173940" glow rotation={[-Math.PI / 2, 0, 0]} />
    <BenchCylinder position={[width * .34, .034, -depth * .36]} radius={.014} height={.012} color="#c4c9bd" metalness={.64} />
    <BenchBox size={[tablet ? .19 : .055, .006, .012]} position={[0, .055, depth * .38]} color="#65746f" radius={.004} />
    <BenchBox size={[.024, .035, .012]} position={[width / 2 + .005, .027, -.08]} color="#8e9991" radius={.005} />
  </group>
}

function AppliancePlug({ position, connected }: { position: [number, number, number]; connected: boolean }) {
  return <group position={position}>
    <BenchBox size={[.15, .046, .105]} position={[0, 0, 0]} color={connected ? '#3b433f' : '#343b38'} radius={.018} metalness={.12} roughness={.42} />
    <BenchBox size={[.045, .018, .026]} position={[0, -.012, .057]} color="#59645e" radius={.008} />
    {[-.032, .032].map(x => <BenchBox key={x} size={[.014, .04, .012]} position={[x, -.038, -.012]} color="#c2b38f" radius={.003} metalness={.78} roughness={.24} />)}
    <BenchBox size={[.014, .04, .012]} position={[0, -.038, .014]} color="#c2b38f" radius={.003} metalness={.78} roughness={.24} />
  </group>
}

function PowerLead({ item, plugPreview, onPointerDown }: { item: BenchItem; plugPreview?: BenchPoint; onPointerDown?: (event: ThreeEvent<PointerEvent>) => void }) {
  const port = CORD_PORT[item.kind]
  const point = plugPreview ?? plugPoint(item)
  const connected = item.socket !== null && !plugPreview
  const plugPosition: [number, number, number] = [point[0] - item.position[0], connected ? .145 : .07, point[1] - item.position[1]]
  const plugTail: [number, number, number] = [plugPosition[0], plugPosition[1], plugPosition[2] + .075]
  const points: [number, number, number][] = connected
    ? [
      [port[0], .04, port[1]],
      [port[0] + .08, .035, port[1] - .14],
      [port[0], .033, (port[1] + plugTail[2]) / 2],
      [plugTail[0] * .72, .035, plugTail[2] + .04],
      plugTail,
    ]
    : [
      [port[0], .04, port[1]],
      [port[0] - .06, .035, port[1] - .12],
      [plugPosition[0] - .18, .035, plugPosition[2] - .12],
      [plugPosition[0] - .08, .034, plugPosition[2] + .1],
      plugTail,
    ]

  return <group>
    <Cable points={points} color="#303633" radius={.017} />
    <group onPointerDown={onPointerDown}>
      <AppliancePlug position={plugPosition} connected={connected} />
      {onPointerDown && <mesh position={plugPosition}>
        <boxGeometry args={[.24, .16, .2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </mesh>}
    </group>
  </group>
}

export function WorkbenchDevice({
  item,
  selected,
  preview = false,
  plugPreview,
  onClick,
  onPointerDown,
  onPlugPointerDown,
}: {
  item: BenchItem
  selected: boolean
  preview?: boolean
  plugPreview?: BenchPoint
  onClick: () => void
  onPointerDown: (event: ThreeEvent<PointerEvent>) => void
  onPlugPointerDown?: (event: ThreeEvent<PointerEvent>) => void
}) {
  const spec = BENCH_MAP[item.kind]
  const groundOffset = MODEL_GROUND[item.kind]
  const model = useMemo(() => {
    switch (item.kind) {
      case 'kettle': return <Kettle color={spec.color} />
      case 'dryer': return <Dryer color={spec.color} />
      case 'cooker': return <Cooker color={spec.color} />
      case 'gaming': return <Laptop color={spec.color} gaming />
      case 'macbook': return <Laptop color={spec.color} />
      case 'lamp': return <Lamp on={item.on} />
      case 'phone': return <Phone color={spec.color} />
      default: return <Phone tablet color={spec.color} />
    }
  }, [item.kind, item.on, spec.color])

  return <group
    name={preview ? 'bench-catalog-preview' : `bench-device-${item.id}`}
    position={[item.position[0], BENCH_Y, item.position[1]]}
  >
    {selected && <mesh position={[0, .008, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[Math.max(spec.footprint[0], spec.footprint[1]) * .52, Math.max(spec.footprint[0], spec.footprint[1]) * .58, 40]} /><meshBasicMaterial color="#d5ad71" transparent opacity={.88} depthWrite={false} /></mesh>}
    <PowerLead item={item} plugPreview={plugPreview} onPointerDown={preview ? undefined : onPlugPointerDown} />
    <group position={[0, -groundOffset, 0]}
      onClick={preview ? undefined : (event) => { event.stopPropagation(); if (event.delta < 4) onClick() }}
      onPointerDown={preview ? undefined : (event) => { event.stopPropagation(); onPointerDown(event) }}
    >{model}</group>
  </group>
}
