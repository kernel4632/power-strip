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
  ratedWatts: number
  standbyWatts: number
  /** 对应的实测设备组 id，没有实测记录的设备为空 */
  measuredGroup?: string
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
export interface DeviceState {
  on: boolean
  level: number
  watts: number
  energyWh: number
}
export interface PowerSample {
  time: number
  total: number
  devices: Record<DeviceId, number>
  stations: Record<StationId, number>
}
