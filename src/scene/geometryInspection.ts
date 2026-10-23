import { Box3, Matrix4, Mesh, Object3D, Vector3 } from 'three'
import type { PartCheck } from './ModelPart'
import { DEVICE_CATALOG, STATIONS } from '../data/catalog'

const tolerance = 0.003

/** Use transformed vertices, not rotated local AABBs (which overestimate a tipped object). */
export function vertexBounds(object: Object3D, reference: Object3D) {
  const bounds = new Box3()
  const inverse = new Matrix4().copy(reference.matrixWorld).invert()
  const matrix = new Matrix4(),
    point = new Vector3()
  object.traverse((child) => {
    if (!(child instanceof Mesh) || child.userData.inspectionIgnore) return
    const positions = child.geometry.getAttribute('position')
    if (!positions) return
    matrix.multiplyMatrices(inverse, child.matrixWorld)
    for (let i = 0; i < positions.count; i++) {
      point.fromBufferAttribute(positions, i).applyMatrix4(matrix)
      bounds.expandByPoint(point)
    }
  })
  return bounds
}

function referenceFrame(object: Object3D, scene: Object3D) {
  let parent = object.parent
  while (parent) {
    if (/^station-s[1-4]$/.test(parent.name)) return parent
    parent = parent.parent
  }
  return scene
}

function overlap(a: Box3, b: Box3) {
  return [
    Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x),
    Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y),
    Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z),
  ]
}

export function inspectSceneGeometry(scene: Object3D) {
  scene.updateWorldMatrix(true, true)
  const objects: {
    id: string
    frame: string
    box: Box3
    worldBox: Box3
    check: PartCheck
  }[] = []
  const issues: { id: string; kind: string; details: unknown }[] = []
  scene.traverse((object) => {
    const check = object.userData.modelCheck as PartCheck | undefined
    if (!check) return
    const reference = referenceFrame(object, scene)
    const box = vertexBounds(object, reference)
    if (!box.isEmpty())
      objects.push({
        id: object.name.replace(/^check-/, ''),
        frame: reference.name,
        box,
        worldBox: vertexBounds(object, scene),
        check,
      })
  })
  for (const device of DEVICE_CATALOG) {
    const object = scene.getObjectByName(`device-${device.id}`),
      frame = scene.getObjectByName(`station-${device.stationId}`)
    if (object && frame)
      objects.push({
        id: device.id,
        frame: frame.name,
        box: vertexBounds(object, frame),
        worldBox: vertexBounds(object, scene),
        check: { supportY: device.localPosition[1], category: 'prop' },
      })
    else
      issues.push({
        id: device.id,
        kind: 'missing-device-model',
        details: null,
      })
  }
  for (const object of objects) {
    const { id, box, check } = object
    if (
      check.supportY !== undefined &&
      Math.abs(box.min.y - check.supportY) > tolerance
    )
      issues.push({
        id,
        kind: 'support-gap-or-penetration',
        details: { millimeters: (box.min.y - check.supportY) * 1000 },
      })
    for (const side of ['min', 'max'] as const) {
      const limit = check[side]
      if (!limit) continue
      const value = box[side].toArray()
      if (
        value.some((v, index) =>
          side === 'min'
            ? v < limit[index] - tolerance
            : v > limit[index] + tolerance,
        )
      )
        issues.push({
          id,
          kind: 'outside-allowed-region',
          details: { side, value, limit },
        })
    }
  }
  const overlaps: { a: string; b: string; depthMillimeters: number[] }[] = []
  for (let i = 0; i < objects.length; i++)
    for (const b of objects.slice(i + 1)) {
      const a = objects[i]
      if (a.check.category === 'solid' && b.check.category === 'solid') continue
      const depths =
        a.frame === b.frame
          ? overlap(a.box, b.box)
          : overlap(a.worldBox, b.worldBox)
      if (depths.every((depth) => depth > tolerance))
        overlaps.push({
          a: a.id,
          b: b.id,
          depthMillimeters: depths.map((v) => v * 1000),
        })
    }
  const connections = DEVICE_CATALOG.map((device) => {
    const cable = scene.getObjectByName(`cable-${device.id}`)
    const bounds = objects.find((object) => object.id === device.id)?.box
    const endpoint = cable?.userData.cableEnd as number[] | undefined
    if (!bounds || !endpoint) {
      issues.push({
        id: device.id,
        kind: 'missing-cable-endpoint',
        details: null,
      })
      return { id: device.id, distanceMillimeters: null }
    }
    const distance = bounds.distanceToPoint(new Vector3(...endpoint))
    // The connector housing extends 11 mm from the cable center to the appliance.
    if (distance > 0.011)
      issues.push({
        id: device.id,
        kind: 'disconnected-cable',
        details: { millimeters: distance * 1000 },
      })
    return { id: device.id, distanceMillimeters: distance * 1000 }
  })
  return {
    toleranceMillimeters: tolerance * 1000,
    counts: {
      beds: STATIONS.filter((s) => scene.getObjectByName(`loft-${s.id}`))
        .length,
      strips: STATIONS.filter((s) =>
        scene.getObjectByName(`power-strip-${s.id}`),
      ).length,
      devices: DEVICE_CATALOG.length,
      auditedObjects: objects.length,
    },
    parts: objects.map(({ id, frame, box, check }) => ({
      id,
      frame,
      category: check.category,
      min: box.min.toArray(),
      max: box.max.toArray(),
      supportY: check.supportY,
    })),
    connections,
    issues,
    overlaps,
  }
}
