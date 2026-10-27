import { BENCH_MAP } from './catalog'
import type { BenchItem, BenchKind, BenchPoint } from './types'

export const BENCH_Y = 0.03
export const TABLE_BOUNDS = { minX: -3.5, maxX: 3.5, minZ: -0.7, maxZ: 2.1 }
export const SOCKET_POSITIONS: BenchPoint[] = [[-1.8, -0.48], [-0.6, -0.48], [0.6, -0.48], [1.8, -0.48]]
export const PLACEMENT_PADS: BenchPoint[] = [0.3, 1.4].flatMap(z => [-2.7, -0.9, 0.9, 2.7].map(x => [x, z] as BenchPoint))
export const SOCKET_SNAP_RADIUS = 0.5

export function socketDevicePosition(socket: number): BenchPoint {
  return [-2.1 + socket * 1.4, 0.3]
}

export function fitsTable(kind: BenchKind, position: BenchPoint) {
  const [w, d] = BENCH_MAP[kind].footprint
  return position.every(Number.isFinite) && position[0] - w / 2 >= TABLE_BOUNDS.minX && position[0] + w / 2 <= TABLE_BOUNDS.maxX && position[1] - d / 2 >= TABLE_BOUNDS.minZ && position[1] + d / 2 <= TABLE_BOUNDS.maxZ
}
export function fitsPlacement(kind: BenchKind, position: BenchPoint, items: BenchItem[], ignoreId?: string) {
  if (!fitsTable(kind, position)) return false
  const [w, d] = BENCH_MAP[kind].footprint
  // The strip is a real obstacle, not an alternative device drop zone.
  if (Math.abs(position[0]) < 2.4 + w / 2 && Math.abs(position[1] + 0.48) < 0.18 + d / 2) return false
  return items.filter(item => item.id !== ignoreId).every(item => {
    const [ow, od] = BENCH_MAP[item.kind].footprint
    return Math.abs(position[0] - item.position[0]) >= (w + ow) / 2 + 0.12 || Math.abs(position[1] - item.position[1]) >= (d + od) / 2 + 0.12
  })
}
export function clampPlacement(kind: BenchKind, desired: BenchPoint): BenchPoint {
  const [w, d] = BENCH_MAP[kind].footprint
  return [
    Math.max(TABLE_BOUNDS.minX + w / 2, Math.min(TABLE_BOUNDS.maxX - w / 2, desired[0])),
    Math.max(TABLE_BOUNDS.minZ + d / 2, Math.min(TABLE_BOUNDS.maxZ - d / 2, desired[1])),
  ]
}

export function plugPoint(item: BenchItem): BenchPoint {
  if (item.socket !== null) return SOCKET_POSITIONS[item.socket]
  if (item.plugPosition) return item.plugPosition
  const [width, depth] = BENCH_MAP[item.kind].footprint
  return [Math.min(TABLE_BOUNDS.maxX - .1, item.position[0] + width * .65), Math.min(TABLE_BOUNDS.maxZ - .1, item.position[1] + depth * .25)]
}
export function fitsSocketPlacement(_kind: BenchKind, socket: number, _items: BenchItem[], _ignoreId?: string) {
  return Number.isInteger(socket) && socket >= 0 && socket < SOCKET_POSITIONS.length
}
export function findPlacement(kind: BenchKind, items: BenchItem[], desired: BenchPoint = [0, 1], ignoreId?: string): BenchPoint | null {
  const clamped = clampPlacement(kind, desired)
  const candidates = [clamped, ...PLACEMENT_PADS].sort((a, b) => Math.hypot(a[0] - desired[0], a[1] - desired[1]) - Math.hypot(b[0] - desired[0], b[1] - desired[1]))
  return candidates.find(point => fitsPlacement(kind, point, items, ignoreId)) ?? null
}
