export type Point3 = [number, number, number]
export type StationId = 's1' | 's2' | 's3' | 's4'
export type DeviceKind =
  | 'monitor'
  | 'laptop'
  | 'lamp'
  | 'fan'
  | 'phone'
  | 'tower'
  | 'speaker'
  | 'tablet'
  | 'printer'
  | 'humidifier'
  | 'headphones'
export type DeviceId = `${StationId}-${DeviceKind}`
export type Selection = DeviceId | StationId | 'room' | null
export type CameraView = 'overview' | 'aisle' | 'top'
export type InspectionPart = 'station' | 'device' | 'strip' | 'bed'
export type SceneMode = 'study' | 'relax' | 'away'
export interface StationSpec {
  id: StationId
  number: string
  name: string
  theme: string
  color: string
  lightColor: string
  position: Point3
  rotation: number
  limit: number
}
export interface DeviceSpec {
  id: DeviceId
  stationId: StationId
  kind: DeviceKind
  name: string
  english: string
  /** 组记录峰值均分到单台，用作 100% 负载参考和图表量程，不是额定功率。 */
  referenceWatts: number
  measuredGroup: string
  /** 该资料组记录的是几台设备，用来把组合计功率折算成单台 */
  measuredUnits: number
  color: string
  localPosition: Point3
  position: Point3
  scale: number
  socket: number
  footprint: [number, number]
  height: number
  cablePort: Point3
  defaultOn: boolean
}
/** 功率读数的来源，决定界面上挂哪个徽章。 */
export type PowerSource = 'allocated'
export interface DeviceState {
  on: boolean
  level: number
  watts: number
  energyWh: number
  powerSource: PowerSource
}
