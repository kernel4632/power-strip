import { Box3, Vector3 } from 'three'
import type { Camera, Object3D } from 'three'
import type { BenchItem } from './types'

export interface ActionRect {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export function overlapsActionRect(a: ActionRect, b: ActionRect, gap = 0) {
  return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x
    && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y
}

/** Clamp BEFORE testing collisions: viewport edges must not push a panel onto a model. */
export function placeDeviceActions(anchor: ActionRect, obstacles: ActionRect[], viewport: { width: number; height: number }, panel: { width: number; height: number }, previous?: ActionRect): ActionRect | null {
  const inset = 8
  const gap = 16
  const spacing = gap + 4
  if (panel.width + inset * 2 > viewport.width || panel.height + inset * 2 > viewport.height) return null
  // Keep a usable panel still while the camera damps. Reposition only when its
  // current rectangle would cover an object or leave the visible canvas.
  if (previous && previous.width === panel.width && previous.height === panel.height
    && previous.x >= inset && previous.y >= inset
    && previous.x + previous.width <= viewport.width - inset && previous.y + previous.height <= viewport.height - inset
    && !obstacles.some(obstacle => overlapsActionRect(previous, obstacle, gap))) return previous
  const centerX = anchor.x + anchor.width / 2
  const centerY = anchor.y + anchor.height / 2
  const preferred = { x: anchor.x + anchor.width + spacing, y: anchor.y - panel.height - spacing }
  const xs = [preferred.x, anchor.x - panel.width - spacing, centerX - panel.width / 2, inset, viewport.width - panel.width - inset]
  const ys = [preferred.y, anchor.y + anchor.height + spacing, centerY - panel.height / 2, inset, viewport.height - panel.height - inset]
  for (const obstacle of obstacles) {
    xs.push(obstacle.x - panel.width - spacing, obstacle.x + obstacle.width + spacing)
    ys.push(obstacle.y - panel.height - spacing, obstacle.y + obstacle.height + spacing)
  }
  return xs.flatMap(x => ys.map(y => ({
    id: 'device-actions',
    x: Math.max(inset, Math.min(viewport.width - panel.width - inset, x)),
    y: Math.max(inset, Math.min(viewport.height - panel.height - inset, y)),
    ...panel,
  })))
    .filter(candidate => !obstacles.some(obstacle => overlapsActionRect(candidate, obstacle, gap)))
    .sort((a, b) => (a.x - preferred.x) ** 2 + (a.y - preferred.y) ** 2 - (b.x - preferred.x) ** 2 - (b.y - preferred.y) ** 2)[0] ?? null
}

export function actionConnector(anchor: ActionRect, panel: ActionRect) {
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
  const x1 = clamp(panel.x + panel.width / 2, anchor.x, anchor.x + anchor.width)
  const y1 = clamp(panel.y + panel.height / 2, anchor.y, anchor.y + anchor.height)
  return { x1, y1, x2: clamp(x1, panel.x, panel.x + panel.width), y2: clamp(y1, panel.y, panel.y + panel.height) }
}

/** Only project bodies and plugs, not their long cables or the selection ring. */
export function projectActionObstacles(scene: Object3D, camera: Camera, items: BenchItem[], viewport: { width: number; height: number }): ActionRect[] {
  const box = new Box3()
  const point = new Vector3()
  const rectangles: ActionRect[] = []
  scene.updateMatrixWorld(true)
  camera.updateMatrixWorld()
  for (const item of items) {
    for (const prefix of ['bench-body-', 'bench-plug-']) {
      const object = scene.getObjectByName(`${prefix}${item.id}`)
      if (!object) continue
      box.setFromObject(object)
      if (box.isEmpty()) continue
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      let inFront = false
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        point.set(x, y, z).project(camera)
        if (point.z >= -1 && point.z <= 1) inFront = true
        const px = (point.x + 1) * viewport.width / 2
        const py = (1 - point.y) * viewport.height / 2
        minX = Math.min(minX, px); maxX = Math.max(maxX, px)
        minY = Math.min(minY, py); maxY = Math.max(maxY, py)
      }
      if (inFront && maxX >= 0 && minX <= viewport.width && maxY >= 0 && minY <= viewport.height) {
        rectangles.push({ id: `${prefix}${item.id}`, x: minX, y: minY, width: maxX - minX, height: maxY - minY })
      }
    }
  }
  return rectangles
}
