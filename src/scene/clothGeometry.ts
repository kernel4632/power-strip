import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three'

export const MATTRESS_TOP = 2.16
export const BED_CLEARANCE = { x: 1.205, z: 0.505 }

type SurfacePoint = (
  u: number,
  v: number,
  upper: boolean,
) => [number, number, number]

/** Closed, indexed cloth shell. The two sides share a stitched perimeter, not floating strips. */
function shell(surface: SurfacePoint, columns: number, rows: number) {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const stride = columns + 1
  const layerSize = stride * (rows + 1)
  for (const upper of [true, false]) {
    for (let row = 0; row <= rows; row++) {
      for (let col = 0; col <= columns; col++) {
        const u = col / columns,
          v = row / rows
        positions.push(...surface(u, v, upper))
        uvs.push(u, v)
      }
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const a = row * stride + col,
        b = a + 1,
        c = a + stride,
        d = c + 1
      indices.push(a, c, b, b, c, d)
      indices.push(
        a + layerSize,
        b + layerSize,
        c + layerSize,
        b + layerSize,
        d + layerSize,
        c + layerSize,
      )
    }
  }
  const perimeter: number[] = []
  for (let col = 0; col <= columns; col++) perimeter.push(col)
  for (let row = 1; row <= rows; row++) perimeter.push(row * stride + columns)
  for (let col = columns - 1; col >= 0; col--)
    perimeter.push(rows * stride + col)
  for (let row = rows - 1; row > 0; row--) perimeter.push(row * stride)
  for (let i = 0; i < perimeter.length; i++) {
    const a = perimeter[i],
      b = perimeter[(i + 1) % perimeter.length]
    indices.push(a, b, a + layerSize, b, b + layerSize, a + layerSize)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

/** The turn at the foot follows the mattress radius. Nothing extends through the guardrail. */
export function quiltPoint(
  u: number,
  v: number,
  seed: number,
  upper = true,
): [number, number, number] {
  const loose = seed % 2 === 1
  let x: number,
    y: number,
    nx = 0,
    ny = 1
  if (u <= 0.87) {
    const t = u / 0.87
    x = -0.5 + t * 1.645
    const envelope = Math.sin(Math.PI * t) ** 0.8 * Math.sin(Math.PI * v) ** 0.7
    const crease = Math.sin(v * 17 + t * 7 + seed) * Math.sin(t * 13 - v * 4)
    const bunch = loose
      ? 0.026 *
        Math.exp(-(((t - 0.2) / 0.17) ** 2)) *
        (0.55 + 0.45 * Math.cos(v * 12))
      : 0
    y =
      MATTRESS_TOP +
      0.002 +
      (upper ? 0.012 + envelope * (0.022 + crease * 0.008) + bunch : 0)
  } else if (u <= 0.95) {
    const angle = (((u - 0.87) / 0.08) * Math.PI) / 2
    const radius = upper ? 0.049 : 0.039
    x = 1.145 + Math.sin(angle) * radius
    y = 2.125 + Math.cos(angle) * radius
    nx = Math.sin(angle)
    ny = Math.cos(angle)
  } else {
    x = upper ? 1.194 : 1.184
    y = 2.125 - ((u - 0.95) / 0.05) * 0.063
    nx = 1
    ny = 0
  }
  const taper = 1 - 0.035 * Math.abs(2 * u - 1) ** 10
  const z = (v - 0.5) * 0.968 * taper
  const hem =
    0.0015 * Math.sin(v * 8 * Math.PI + seed) * Math.max(0, (u - 0.85) / 0.15)
  return [x + nx * hem, y + ny * hem, z]
}

export function createQuiltGeometry(seed: number) {
  return shell((u, v, upper) => quiltPoint(u, v, seed, upper), 64, 32)
}

export function createPillowGeometry(seed: number) {
  return shell(
    (u, v, upper) => {
      const a = 2 * u - 1,
        b = 2 * v - 1
      const outline = 1 - 0.08 * Math.abs(a) ** 8
      const fullness =
        Math.max(
          0,
          Math.cos((a * Math.PI) / 2) * Math.cos((b * Math.PI) / 2),
        ) ** 0.52
      const dent =
        0.017 * Math.exp(-((a - 0.12) ** 2 / 0.22 + (b + 0.15) ** 2 / 0.32))
      const gather =
        0.003 * Math.sin(b * 22 + seed) * Math.abs(a) ** 6 * fullness
      return [
        -0.855 + a * 0.245,
        MATTRESS_TOP +
          0.002 +
          (upper ? 0.004 + 0.104 * fullness - dent + gather : 0),
        b * 0.34 * outline + (seed % 2 ? 0.035 : -0.015),
      ]
    },
    36,
    24,
  )
}

/** A continuous U-shaped towel over a rail, with both tails below their actual support. */
export function createTowelGeometry(width = 0.32, drop = 0.32) {
  return shell(
    (u, v, upper) => {
      const angle =
        v < 0.42 ? 0 : v > 0.58 ? Math.PI : ((v - 0.42) / 0.16) * Math.PI
      const fold =
        v < 0.42
          ? (-(0.42 - v) / 0.42) * drop
          : v > 0.58
            ? (-(v - 0.58) / 0.42) * drop * 0.72
            : 0
      const radius = upper ? 0.014 : 0.011
      return [
        (u - 0.5) * width,
        Math.sin(angle) * radius + fold,
        -Math.cos(angle) * radius + Math.sin(u * 17) * Math.abs(fold) * 0.012,
      ]
    },
    22,
    40,
  )
}

export function geometryIsFinite(geometry: BufferGeometry) {
  const positions = geometry.getAttribute('position')
  const normals = geometry.getAttribute('normal')
  const n = new Vector3()
  for (let i = 0; i < positions.count; i++) {
    if (
      ![positions.getX(i), positions.getY(i), positions.getZ(i)].every(
        Number.isFinite,
      )
    )
      return false
    n.fromBufferAttribute(normals, i)
    if (!Number.isFinite(n.lengthSq()) || n.lengthSq() < 0.5) return false
  }
  return true
}
