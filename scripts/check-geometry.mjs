import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
})
try {
  const {
    createPillowGeometry,
    createQuiltGeometry,
    createTowelGeometry,
    geometryIsFinite,
    MATTRESS_TOP,
    BED_CLEARANCE,
  } = await server.ssrLoadModule('/src/scene/clothGeometry.ts')
  function checkShell(geometry, name) {
    assert.ok(
      geometryIsFinite(geometry),
      `${name}: finite positions and nonzero normals`,
    )
    const edges = new Map()
    const indices = geometry.index.array
    const p = geometry.getAttribute('position')
    for (let i = 0; i < indices.length; i += 3) {
      const ids = [...indices.slice(i, i + 3)]
      const [a, b, c] = ids.map((index) => [
        p.getX(index),
        p.getY(index),
        p.getZ(index),
      ])
      const u = b.map((value, j) => value - a[j]),
        v = c.map((value, j) => value - a[j])
      const area = Math.hypot(
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      )
      assert.ok(area > 1e-12, `${name}: no collapsed triangles`)
      for (const [x, y] of [
        [ids[0], ids[1]],
        [ids[1], ids[2]],
        [ids[2], ids[0]],
      ]) {
        const key = x < y ? `${x}-${y}` : `${y}-${x}`
        edges.set(key, (edges.get(key) ?? 0) + 1)
      }
    }
    assert.ok(
      [...edges.values()].every((count) => count === 2),
      `${name}: closed two-manifold shell`,
    )
  }
  for (let seed = 0; seed < 4; seed++) {
    const quilt = createQuiltGeometry(seed),
      pillow = createPillowGeometry(seed)
    for (const [geometry, name] of [
      [quilt, 'quilt'],
      [pillow, 'pillow'],
    ]) {
      checkShell(geometry, `${name}-${seed}`)
      const { min, max } = geometry.boundingBox
      assert.ok(
        min.x >= -BED_CLEARANCE.x && max.x <= BED_CLEARANCE.x,
        `${name}: inside end rails`,
      )
      assert.ok(
        min.z >= -BED_CLEARANCE.z && max.z <= BED_CLEARANCE.z,
        `${name}: inside side rails`,
      )
      assert.ok(
        min.y >= (name === 'pillow' ? MATTRESS_TOP : 2.052),
        `${name}: not through mattress/deck`,
      )
      assert.ok(max.y < 2.3, `${name}: below mid-rail`)
    }
    assert.ok(
      pillow.boundingBox.max.x < quilt.boundingBox.min.x - 0.02,
      'pillow does not cross quilt',
    )
    quilt.dispose()
    pillow.dispose()
  }
  const towel = createTowelGeometry()
  checkShell(towel, 'towel')
  assert.ok(towel.boundingBox.max.y <= 0.015, 'towel wraps its supporting rail')
  assert.ok(
    towel.boundingBox.min.y < -0.3,
    'towel has a continuous hanging tail',
  )
  towel.dispose()
  const { DEVICE_CATALOG } = await server.ssrLoadModule('/src/data/catalog.ts')
  const { cablePort } = await server.ssrLoadModule(
    '/src/scene/deviceConnections.ts',
  )
  for (const device of DEVICE_CATALOG.filter(
    (device) => device.kind === 'tablet',
  )) {
    assert.ok(
      Math.abs(cablePort(device)[2] + 0.155 * device.scale) < 1e-8,
      'tablet cable port scales with its physical base',
    )
  }
  console.log(
    'Geometry checks passed: 4 quilt/pillow pairs inside rails, no collapsed triangles, closed cloth shells and continuous towel drape. Run dormDiagnostics().geometry in the browser for transformed prop supports and intersections.',
  )
} finally {
  await server.close()
}
