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
  // Independent fine-step integration of dP/dt = 2.5 * (target - P).
  let watts = 230, wh = 0
  const dt = 0.0001
  for (let i = 0; i < 600000; i++) {
    wh += watts * dt / 3600
    watts += 2.5 * (230 * (0.97 + 0.03 * Math.sin(i * dt * 0.7)) - watts) * dt
  }
  const integrated = powerStep(230, 230, 0, 60, 0)
  near(integrated.watts, watts, 0.001)
  near(integrated.energyWh, wh, 0.00001)
  // A delayed tick must count the same minute as 60 ordinary updates.
  store.getState().tick(60, Date.now())
  const delayed = laptop()
  assert.equal(store.getState().sessionSeconds, 60)
  assert.ok(delayed.energyWh > 3.6 && delayed.energyWh < 3.84)
  store.setState(initial, true)
  for (let i = 0; i < 60; i++) store.getState().tick(1, Date.now())
  near(laptop().energyWh, delayed.energyWh)
  near(laptop().watts, delayed.watts)
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
  for (const value of [0, 9, 99.9, 100, 1000]) assert.equal(formatEnergy(value).unit, 'Wh')
  console.log('Energy checks passed: independent integration, delayed ticks, exact control boundaries, power-off, monotonic clock and stable units.')
} finally { mock.restoreAll(); await server.close() }
