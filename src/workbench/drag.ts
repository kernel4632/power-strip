import { create } from 'zustand'
import type { BenchDrag, BenchKind, BenchPoint, BenchPointer } from './types'

interface DragState {
  drag: BenchDrag | null
  previewPosition: BenchPoint | null
  hoveredSocket: number | null
  validTarget: boolean
  hasMoved: boolean
  message: string
  start: (kind: BenchKind, itemId: string | null, pointer: BenchPointer, mode?: BenchDrag['mode'], offset?: BenchPoint) => void
  preview: (position: BenchPoint | null, socket: number | null, valid: boolean) => void
  cancel: (message?: string) => void
}
export const useBenchDrag = create<DragState>()(set => ({
  drag: null, previewPosition: null, hoveredSocket: null, validTarget: false, hasMoved: false, message: '',
  start: (kind, itemId, pointer, mode = itemId ? 'device' : 'catalog', offset = [0, 0]) => set(state => state.drag ? state : {
    drag: { pointerId: pointer.pointerId, clientX: pointer.clientX, clientY: pointer.clientY, startX: pointer.clientX, startY: pointer.clientY, kind, itemId, mode, offset: [...offset] },
    previewPosition: null, hoveredSocket: null, validTarget: false, hasMoved: false, message: '',
  }),
  preview: (previewPosition, hoveredSocket, validTarget) => set(state => state.hasMoved && state.hoveredSocket === hoveredSocket && state.validTarget === validTarget && state.previewPosition?.[0] === previewPosition?.[0] && state.previewPosition?.[1] === previewPosition?.[1]
    ? state : { previewPosition, hoveredSocket, validTarget, hasMoved: true }),
  cancel: (message = '') => set({ drag: null, previewPosition: null, hoveredSocket: null, validTarget: false, hasMoved: false, message }),
}))
