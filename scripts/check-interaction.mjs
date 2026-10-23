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
  const { DEVICE_CATALOG } = await server.ssrLoadModule('/src/data/catalog.ts')
  const { SCENE_MEASURED_TOTAL } = await server.ssrLoadModule('/src/data/sceneMeasured.ts')
  const recorded = [...SCENE_MEASURED_TOTAL.series]
  const before = store.getState().history.at(-1)
  const lengthBefore = store.getState().history.length
  // 两次 tick 之间不改设置：滑块调到哪，曲线末端立刻就是哪。
  store.getState().setLevel('s1-laptop', 0.5)
  const half = store.getState().history.at(-1)
  assert.equal(half.devices['s1-laptop'], 115)
  assert.equal(before.devices['s1-laptop'], 230, '之前的采样保持不动')
  assert.equal(half.total, before.total - 115)
  // 同一采样窗口内连拖 40 次，只能多出一两个点，不能把 90 点缓冲挤空。
  for (let i = 1; i <= 40; i++) store.getState().setLevel('s1-laptop', (i / 40) * 0.5)
  assert.ok(store.getState().history.length <= lengthBefore + 2, '拖动不应逐次入队')
  store.getState().setLevel('s1-laptop', 0.1)
  store.getState().toggle('s1-laptop')
  store.getState().toggle('s1-laptop')
  const tail = store.getState().history.at(-1)
  assert.equal(tail.devices['s1-laptop'], store.getState().devices['s1-laptop'].watts, '曲线末端跟住最新读数')
  store.getState().setStrip('s1', false)
  assert.equal(store.getState().history.at(-1).stations.s1, 0)
  store.getState().setMaster(false)
  assert.equal(store.getState().history.at(-1).total, 0)
  store.getState().setStrip('s1', true)
  store.getState().setMaster(true)
  store.getState().setLevel('s1-laptop', 1)
  for (let i = 0; i < 120; i++) store.getState().tick(1, Date.now() + i * 1000)
  const history = store.getState().history
  assert.equal(history.length, 90, 'sample buffer is bounded')
  assert.ok(new Set(history.map(s => s.devices['s1-laptop'].toFixed(1))).size > 20, 'power keeps changing with the slider untouched')
  assert.ok(history.some(s => Math.abs(s.devices['s1-laptop'] - s.devices['s3-laptop']) > 1), 'identical devices have different phases')
  assert.ok(history.every((s, i) => i === 0 || s.time > history[i - 1].time))
  for (const sample of history) {
    assert.equal(sample.total, Object.values(sample.devices).reduce((sum, watts) => sum + watts, 0))
    for (const station of ['s1', 's2', 's3', 's4'])
      assert.equal(sample.stations[station], DEVICE_CATALOG.filter(d => d.stationId === station).reduce((sum, d) => sum + sample.devices[d.id], 0))
  }
  assert.deepEqual(SCENE_MEASURED_TOTAL.series, recorded, 'controls do not rewrite 24-hour records')
  // Turning off upstream power must stop both the wave and energy accumulation.
  store.getState().setMaster(false)
  const energyBeforeOff = Object.values(store.getState().devices).map(d => d.energyWh)
  store.getState().tick(1, Date.now() + 130000)
  assert.equal(store.getState().history.at(-1).total, 0)
  assert.deepEqual(Object.values(store.getState().devices).map(d => d.energyWh), energyBeforeOff)
  console.log(
    'Interaction checks passed: hotspot collision/edges, panel state, immediate samples, continuous fluctuation with distinct phases, aggregate curves, bounded history, power-off and unchanged daily records.',
  )
} finally {
  await server.close()
}
