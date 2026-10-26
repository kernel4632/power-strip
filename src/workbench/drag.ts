import { create } from 'zustand'
import type { BenchDrag, BenchKind, BenchPoint, BenchPointer } from './types'

interface DragState {
  drag: BenchDrag | null
  previewPosition: BenchPoint | null
  hoveredSocket: number | null
  validTarget: boolean
  start: (kind: BenchKind, itemId: string | null, pointer: BenchPointer) => void
  preview: (position: BenchPoint | null, socket: number | null, valid: boolean) => void
  cancel: () => void
}
export const useBenchDrag = create<DragState>()(set => ({
  drag: null, previewPosition: null, hoveredSocket: null, validTarget: false,
  start: (kind, itemId, pointer) => set({ drag: { ...pointer, startX: pointer.clientX, startY: pointer.clientY, kind, itemId }, previewPosition: null, hoveredSocket: null, validTarget: false }),
  preview: (previewPosition, hoveredSocket, validTarget) => set(state => state.hoveredSocket === hoveredSocket && state.validTarget === validTarget && state.previewPosition?.[0] === previewPosition?.[0] && state.previewPosition?.[1] === previewPosition?.[1] ? {} : { previewPosition, hoveredSocket, validTarget }),
  cancel: () => set({ drag: null, previewPosition: null, hoveredSocket: null, validTarget: false }),
}))
