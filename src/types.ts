export type DeviceId =
  | 'laptop'
  | 'monitor'
  | 'lamp'
  | 'fan'
  | 'phone'
  | 'kettle'
  | 'fridge'
  | 'ac'
export type Point3 = [number, number, number]
export type SceneMode = 'study' | 'relax' | 'away'
export type CameraView = 'overview' | 'desk' | 'living' | 'top'

export interface DeviceSpec {
  id: DeviceId
  name: string
  english: string
  category: string
  description: string
  ratedWatts: number
  standbyWatts: number
  color: string
  position: Point3
  target: Point3
  camera: Point3
  labelOffset: Point3
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
}
