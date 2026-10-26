export type BenchKind = 'kettle' | 'dryer' | 'cooker' | 'gaming' | 'macbook' | 'lamp' | 'phone' | 'tablet'
export type BenchPoint = [number, number]
export type RiskStatus = 'normal' | 'warning' | 'overload'
export interface BenchSpec {
  id: BenchKind
  name: string
  referenceWatts: number
  referenceText: string
  referenceModel: string | null
  category: string
  footprint: BenchPoint
  height: number
  color: string
}
export interface BenchItem {
  id: string
  kind: BenchKind
  position: BenchPoint
  socket: number | null
  on: boolean
  load: number
  customWatts: number | null
}
export interface BenchLimits { warningWatts: number; limitWatts: number }
export interface BenchSettings { strip: BenchLimits; room: BenchLimits; backgroundWatts: number }
export interface BenchSnapshot { items: BenchItem[]; masterOn: boolean; settings: BenchSettings }
export type BenchDestination = { socket: number } | { position: BenchPoint }
export type BenchPreset = 'study' | 'room-warning' | 'strip-warning' | 'overload'
export interface RiskReading extends BenchLimits {
  watts: number
  ratio: number
  status: RiskStatus
  remainingWatts: number
}
export interface BenchReadings {
  strip: RiskReading
  room: RiskReading
  itemWatts: Record<string, number>
  connectedCount: number
  runningCount: number
}
export interface BenchPointer { pointerId: number; clientX: number; clientY: number }
export interface BenchDrag extends BenchPointer {
  startX: number
  startY: number
  kind: BenchKind
  itemId: string | null
}
