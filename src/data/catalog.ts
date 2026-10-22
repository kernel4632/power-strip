import type {
  CameraView,
  DeviceId,
  DeviceKind,
  DeviceSpec,
  Point3,
  PowerSource,
  SceneMode,
  StationId,
  StationSpec,
} from '../types'
import { MEASURED_MAP } from './measured'
import { DESK_STRIP } from './strips'

export const VOLTAGE = 220
export const DESK_TOP = 0.86
export const STRIP_LOCAL: Point3 = [-0.3, 0.886, -0.405]
export const STATIONS: StationSpec[] = [
  {
    id: 's1',
    number: '01',
    name: '一号床位',
    theme: '数字工作站',
    color: '#688e85',
    lightColor: '#bbd3c2',
    position: [-1.91, 0, -1.55],
    rotation: Math.PI / 2,
    limit: DESK_STRIP.maxW,
  },
  {
    id: 's2',
    number: '02',
    name: '二号床位',
    theme: '音乐与阅读',
    color: '#b88265',
    lightColor: '#dfbea3',
    position: [-1.91, 0, 1.25],
    rotation: Math.PI / 2,
    limit: DESK_STRIP.maxW,
  },
  {
    id: 's3',
    number: '03',
    name: '三号床位',
    theme: '灵感设计室',
    color: '#7b87a5',
    lightColor: '#c4cce2',
    position: [1.91, 0, -1.55],
    rotation: -Math.PI / 2,
    limit: DESK_STRIP.maxW,
  },
  {
    id: 's4',
    number: '04',
    name: '四号床位',
    theme: '轻松生活角',
    color: '#9b8c61',
    lightColor: '#d9d1ad',
    position: [1.91, 0, 1.25],
    rotation: -Math.PI / 2,
    limit: DESK_STRIP.maxW,
  },
]
export const STATION_MAP = Object.fromEntries(
  STATIONS.map((s) => [s.id, s]),
) as Record<StationId, StationSpec>
export function toWorld(station: StationSpec, local: Point3): Point3 {
  const c = Math.cos(station.rotation),
    s = Math.sin(station.rotation)
  return [
    station.position[0] + local[0] * c + local[2] * s,
    local[1],
    station.position[2] - local[0] * s + local[2] * c,
  ]
}
/** 100% load uses the recorded group peak, equally allocated to its units.
 * This is a reference for interaction, not a nameplate rating or measured single-unit peak.
 * Historical records remain unchanged; the computer clock never controls a switch.
 */
export function deviceReading(spec: DeviceSpec): { watts: number; source: PowerSource } {
  return { watts: spec.referenceWatts, source: 'allocated' }
}

type Placement = {
  kind: DeviceKind; group: string; name: string; position: Point3; scale: number
  footprint: [number, number]; height: number; port: Point3
}
function inventory(station: StationSpec): Placement[] {
  const mac = station.id === 's2' || station.id === 's4'
  const items: Placement[] = [
    { kind: 'laptop', group: mac ? 'macbook' : 'gaming', name: mac ? 'MacBook' : '游戏笔记本',
      position: [-0.35, DESK_TOP, -0.075], scale: 0.62, footprint: [0.51, 0.36], height: 0.33, port: [0, 0.01, -0.16] },
    { kind: 'lamp', group: 'lamp', name: '台灯', position: [0.4, DESK_TOP, -0.13], scale: 0.47,
      footprint: [0.33, 0.24], height: 0.37, port: [0, 0.02, -0.08] },
    { kind: 'phone', group: mac ? 'android' : 'iphone', name: mac ? '安卓手机' : 'iPhone',
      position: [-0.94, DESK_TOP, -0.12], scale: 0.55, footprint: [0.19, 0.21], height: 0.06, port: [0, 0.009, -0.07] },
  ]
  if (!mac) items.push({ kind: 'tablet', group: 'tablet', name: '平板电脑',
    position: [0.16, DESK_TOP, 0.17], scale: 0.42, footprint: [0.32, 0.25], height: 0.19, port: [0, 0.012, -0.096] })
  return items
}
export const DEVICE_CATALOG: DeviceSpec[] = STATIONS.flatMap(station =>
  inventory(station).map((p, socket) => {
    const group = MEASURED_MAP[p.group]
    return {
      id: `${station.id}-${p.kind}` as DeviceId, stationId: station.id, kind: p.kind,
      name: p.name, english: p.group.toUpperCase(), referenceWatts: group.peakW / group.units,
      measuredGroup: group.id, measuredUnits: group.units,
      color: station.color, localPosition: p.position, position: toWorld(station, p.position),
      scale: p.scale, socket, footprint: p.footprint, height: p.height, cablePort: p.port, defaultOn: true,
    }
  }),
)
export const DEVICE_MAP = Object.fromEntries(
  DEVICE_CATALOG.map((d) => [d.id, d]),
) as Record<DeviceId, DeviceSpec>
export function stationDevices(id: StationId) {
  return DEVICE_CATALOG.filter((d) => d.stationId === id)
}
export const SCENE_MODES: { id: SceneMode; label: string }[] = [
  { id: 'study', label: '一起学习' },
  { id: 'relax', label: '晚间放松' },
  { id: 'away', label: '全员离寝' },
]
export const CAMERA_VIEWS: Record<
  CameraView,
  { position: Point3; target: Point3; label: string }
> = {
  overview: {
    position: [9.3, 9.7, 12.6],
    target: [0, 1.1, -0.15],
    label: '四人寝全景',
  },
  aisle: {
    position: [0.15, 3.1, 9.8],
    target: [0, 1.35, -0.6],
    label: '中央通道',
  },
  top: {
    position: [0.1, 12.6, 3.2],
    target: [0, 0.5, -0.1],
    label: '空间俯瞰',
  },
}
export function stationCamera(id: StationId): {
  position: Point3
  target: Point3
} {
  const station = STATION_MAP[id]
  return {
    position: toWorld(station, [-0.14, 1.82, 3.1]),
    target: toWorld(station, [-0.08, 1.13, -0.06]),
  }
}
