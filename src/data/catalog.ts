import type {
  CameraView,
  DeviceId,
  DeviceKind,
  DeviceSpec,
  Point3,
  SceneMode,
  StationId,
  StationSpec,
} from '../types'

export const CIRCUIT_LIMIT = 2200
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
    limit: 800,
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
    limit: 800,
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
    limit: 800,
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
    limit: 800,
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
const descriptions: Record<DeviceKind, [string, string, number, number]> = {
  monitor: ['桌面显示器', 'STUDIO DISPLAY', 38, 0.5],
  laptop: ['笔记本电脑', 'PERSONAL LAPTOP', 65, 2],
  lamp: ['护眼阅读灯', 'TASK LIGHT', 9, 0],
  fan: ['桌面循环扇', 'AIR CIRCULATOR', 25, 0],
  phone: ['手机充电座', 'WIRELESS CHARGER', 15, 0.3],
  tower: ['台式主机', 'COMPACT PC', 280, 1],
  speaker: ['桌面音箱', 'DESKTOP AUDIO', 12, 0.4],
  tablet: ['绘图平板', 'PEN DISPLAY', 24, 0.3],
  printer: ['桌面打印机', 'COMPACT PRINTER', 45, 1],
  humidifier: ['小型加湿器', 'AIR & COMFORT', 18, 0],
  headphones: ['耳机充电架', 'HEADPHONE DOCK', 8, 0.2],
}
type Placement = {
  kind: DeviceKind
  position: Point3
  scale: number
  footprint: [number, number]
  height: number
  port: Point3
  on: boolean
}
const main = (kind: 'monitor' | 'laptop' | 'tablet'): Placement => ({
  kind,
  position: [-0.35, DESK_TOP, -0.075],
  scale: kind === 'monitor' ? 0.51 : 0.62,
  footprint: kind === 'monitor' ? [0.57, 0.19] : [0.51, 0.36],
  height: kind === 'monitor' ? 0.47 : 0.33,
  port:
    kind === 'monitor'
      ? [0, 0.018, -0.066]
      : kind === 'laptop'
        ? [0, 0.01, -0.16]
        : [0, 0.012, -0.096],
  on: true,
})
const right = (kind: 'lamp' | 'fan'): Placement => ({
  kind,
  position: [0.4, DESK_TOP, -0.13],
  scale: 0.47,
  footprint: kind === 'lamp' ? [0.33, 0.24] : [0.26, 0.22],
  height: 0.37,
  port: [0, 0.02, -0.08],
  on: kind === 'lamp',
})
const left = (kind: 'phone' | 'speaker' | 'humidifier'): Placement => ({
  kind,
  position: [-0.94, DESK_TOP, -0.12],
  scale: 0.55,
  footprint: [0.19, 0.21],
  height: kind === 'phone' ? 0.06 : 0.27,
  port: [
    0,
    kind === 'phone' ? 0.009 : 0.02,
    kind === 'speaker' ? -0.059 : kind === 'phone' ? -0.07 : -0.075,
  ],
  on: kind !== 'humidifier',
})
const inventories: Record<StationId, Placement[]> = {
  s1: [
    main('monitor'),
    right('lamp'),
    left('phone'),
    {
      kind: 'tower',
      position: [-0.94, 0.13, -0.1],
      scale: 1,
      footprint: [0.29, 0.43],
      height: 0.53,
      port: [0, 0.1, -0.22],
      on: true,
    },
  ],
  s2: [
    main('laptop'),
    right('fan'),
    left('speaker'),
    {
      kind: 'headphones',
      position: [0.93, 1.1685, -0.12],
      scale: 0.82,
      footprint: [0.25, 0.25],
      height: 0.32,
      port: [0, 0.008, -0.09],
      on: false,
    },
  ],
  s3: [
    main('tablet'),
    right('lamp'),
    left('phone'),
    {
      kind: 'printer',
      position: [-0.94, 0.25, -0.05],
      scale: 0.8,
      footprint: [0.4, 0.36],
      height: 0.25,
      port: [0, 0.06, -0.162],
      on: false,
    },
  ],
  s4: [
    main('laptop'),
    right('fan'),
    left('humidifier'),
    {
      kind: 'speaker',
      position: [0.93, 1.1685, -0.12],
      scale: 0.7,
      footprint: [0.21, 0.25],
      height: 0.32,
      port: [0, 0.03, -0.077],
      on: true,
    },
  ],
}
export const DEVICE_CATALOG: DeviceSpec[] = STATIONS.flatMap((station) =>
  inventories[station.id].map((p, socket) => {
    const [name, english, ratedWatts, standbyWatts] = descriptions[p.kind]
    return {
      id: `${station.id}-${p.kind}` as DeviceId,
      stationId: station.id,
      kind: p.kind,
      name,
      english,
      ratedWatts,
      standbyWatts,
      color: station.color,
      localPosition: p.position,
      position: toWorld(station, p.position),
      scale: p.scale,
      socket,
      footprint: p.footprint,
      height: p.height,
      cablePort: p.port,
      defaultOn: p.on,
      description: `${station.name}的${name}，连接该床位独立插排的 ${socket + 1} 号插孔。开关或调整负载不会影响其他床位；功率是演示参数，不是真实电表读数。`,
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
    position: [5.8, 3, 7.6],
    target: [0.15, 1.4, -0.55],
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
