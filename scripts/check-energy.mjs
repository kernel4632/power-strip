import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, server: { middlewareMode: true } })
try {
  const { usePowerStore: store } = await server.ssrLoadModule('/src/store/usePowerStore.ts')
  const { powerStep } = await server.ssrLoadModule('/src/lib/power-step.ts')
  const { formatEnergy } = await server.ssrLoadModule('/src/lib/format.ts')
  const initial = store.getState()
  const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`)
  const laptop = () => store.getState().devices['s1-laptop']
  // Historical fixture: 3746e49, 230 W, phase 0, sixty one-second ticks.
  for (let i = 0; i < 60; i++) store.getState().tick(1, Date.now())
  near(laptop().watts, 217.07793626510633)
  near(laptop().energyWh, 3.7232461942616575)
  store.setState(initial, true)
  // Delayed updates retain the full elapsed minute (the old cap lost 55 seconds).
  store.getState().tick(60, Date.now())
  const delayed = laptop()
  assert.equal(store.getState().sessionSeconds, 60)
  assert.ok(delayed.energyWh > 3.6 && delayed.energyWh < 3.84)
  // Check events between timer ticks, with one shared monotonic clock.
  store.setState(initial, true)
  let clock = 0
  mock.method(performance, 'now', () => clock)
  store.getState().sync()
  clock = 500
  store.getState().setLevel('s1-laptop', 0.5)
  const first = powerStep(230, 230, 0, 0.5, 0)
  near(laptop().energyWh, first.energyWh)
  clock = 900
  store.getState().toggle('s1-laptop')
  const second = powerStep(first.watts / 2, 115, 0.5, 0.4, 0)
  near(laptop().energyWh, first.energyWh + second.energyWh)
  clock = 60000
  store.getState().sync()
  near(laptop().energyWh, first.energyWh + second.energyWh)
  assert.equal(laptop().watts, 0)
  assert.equal(store.getState().sessionSeconds, 60)
  const energy = laptop().energyWh
  store.getState().sync() // Same timestamp cannot count twice.
  near(laptop().energyWh, energy)
  store.getState().sync(59000) // A backwards clock cannot subtract energy/time.
  near(laptop().energyWh, energy)
  assert.equal(store.getState().sessionSeconds, 60)
  assert.deepEqual(formatEnergy(0), { value: '0.0000', unit: 'kWh' })
  assert.deepEqual(formatEnergy(3.7232461942616575), { value: '0.0037', unit: 'kWh' })
  assert.deepEqual(formatEnergy(1000), { value: '1.0000', unit: 'kWh' })
  console.log('Energy checks passed: historical 3746e49 fixture, delayed ticks, control boundaries, power-off, monotonic clock and four-decimal kWh.')
} finally { mock.restoreAll(); await server.close() }
