import { BENCH_MAX_ITEMS } from './catalog'
import { clampPlacement, fitsPlacement, SOCKET_POSITIONS, TABLE_BOUNDS } from './layout'
import type { BenchDrag, BenchItem, BenchPoint } from './types'

export interface DragTarget {
  position: BenchPoint
  socket: number | null
  valid: boolean
}

/** Dragging never calls the automatic placement search or jumps to a pad. */
export function resolveDragTarget(drag: BenchDrag, point: BenchPoint, items: BenchItem[]): DragTarget {
  const desired: BenchPoint = [point[0] + drag.offset[0], point[1] + drag.offset[1]]
  if (drag.mode === 'plug') {
    const socket = SOCKET_POSITIONS.findIndex(([x, z]) => Math.hypot(desired[0] - x, desired[1] - z) <= .32)
    if (socket >= 0) {
      return {
        position: SOCKET_POSITIONS[socket],
        socket,
        valid: !items.some(item => item.socket === socket && item.id !== drag.itemId),
      }
    }
    return {
      position: [Math.max(TABLE_BOUNDS.minX + .1, Math.min(TABLE_BOUNDS.maxX - .1, desired[0])), Math.max(TABLE_BOUNDS.minZ + .1, Math.min(TABLE_BOUNDS.maxZ - .1, desired[1]))],
      socket: null,
      valid: true,
    }
  }
  const position = clampPlacement(drag.kind, desired)
  return {
    position,
    socket: null,
    valid: (drag.itemId !== null || items.length < BENCH_MAX_ITEMS)
      && fitsPlacement(drag.kind, position, items, drag.itemId ?? undefined),
  }
}
