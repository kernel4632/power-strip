import assert from 'node:assert/strict'
import { createServer } from 'vite'

const server = await createServer({
  configFile: false,
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
})
try {
  const { placeHotspots } = await server.ssrLoadModule(
    '/src/lib/hotspot-layout.ts',
  )
  const { formatPower } = await server.ssrLoadModule('/src/lib/format.ts')
  const { usePowerStore: store } = await server.ssrLoadModule(
    '/src/store/usePowerStore.ts',
  )
  // All four device names and powers are visible together, plus the strip.
  // Full labels must fit with the mobile drawer and desktop side panel.
  for (const [width, height] of [
    [366, 358],
    [641, 285],
    [1040, 824],
  ]) {
    for (const [x, y] of [
      [width / 2, height / 2],
      [width - 12, 90],
      [12, height - 12],
    ]) {
      const items = Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        x,
        y,
        width: i === 0 ? 44 : 190,
        height: 44,
      }))
      const result = placeHotspots(items, width, height, '4')
      assert.equal(
        result.length,
        5,
        `all targets visible at ${width}x${height}`,
      )
      assert.equal(result[0].id, '4', 'selected device gets first placement')
      for (let i = 0; i < result.length; i++) {
        const a = result[i]
        assert.ok(
          a.x >= 0 &&
            a.y >= 0 &&
            a.x + a.width <= width &&
            a.y + a.height <= height,
        )
        for (const b of result.slice(i + 1))
          assert.ok(
            a.x + a.width <= b.x ||
              b.x + b.width <= a.x ||
              a.y + a.height <= b.y ||
              b.y + b.height <= a.y,
            'targets must not overlap',
          )
      }
    }
  }
  assert.equal(formatPower(19.5), '19.5')
  assert.equal(formatPower(200), '200')
  assert.equal(formatPower(0), '0')
  store.getState().selectStation('s1')
  store.getState().setPanelExpanded(true)
  store.getState().closePanel()
  assert.equal(
    store.getState().panelExpanded,
    false,
    'closing records must restore scene markers',
  )
  store.getState().setPanelExpanded(true)
  store.getState().selectStation('s2')
  assert.equal(store.getState().panelExpanded, false)
  store.getState().setStrip('s2', false)
  store.getState().setStrip('s2', true)
  assert.equal(store.getState().strips.s2, true)
  console.log(
    'Interaction checks passed: hotspot collision/edges at 3 sizes and 3 anchor positions, shared power precision, panel and power state.',
  )
} finally {
  await server.close()
}
